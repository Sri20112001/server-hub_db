package alerting

import (
	"testing"

	"serverhub/internal/database"
	"serverhub/internal/testdb"
)

func TestBreachedLatest(t *testing.T) {
	cases := []struct {
		name      string
		samples   []float64
		operator  string
		threshold float64
		want      bool
	}{
		{"above fires", []float64{50, 91}, "above", 90, true},
		{"above quiet", []float64{50, 89}, "above", 90, false},
		{"above equal is not breach", []float64{90}, "above", 90, false},
		{"below fires", []float64{50, 9}, "below", 10, true},
		{"below quiet", []float64{50, 11}, "below", 10, false},
		{"below equal is not breach", []float64{10}, "below", 10, false},
		{"empty never breaches", nil, "above", 90, false},
	}
	for _, tc := range cases {
		if got := breached(tc.samples, tc.operator, tc.threshold, false); got != tc.want {
			t.Errorf("%s: got %v, want %v", tc.name, got, tc.want)
		}
	}
}

func TestBreachedSustained(t *testing.T) {
	if !breached([]float64{91, 92, 95}, "above", 90, true) {
		t.Error("all-breaching window should fire")
	}
	if breached([]float64{91, 89, 95}, "above", 90, true) {
		t.Error("window with one good sample should not fire")
	}
	if breached(nil, "above", 90, true) {
		t.Error("empty window should not fire")
	}
	if !breached([]float64{5, 4}, "below", 10, true) {
		t.Error("all-breaching below window should fire")
	}
}

func TestRuleHelpers(t *testing.T) {
	if ruleMetricColumn("cpu") != "cpu_usage" ||
		ruleMetricColumn("memory") != "memory_usage" ||
		ruleMetricColumn("disk") != "disk_usage" {
		t.Error("metric column mapping wrong")
	}
	if ruleMetricColumn("bogus") != "" {
		t.Error("unknown metric should map to empty column")
	}
	if ruleCondition(7) != "rule:7" {
		t.Errorf("condition key wrong: %q", ruleCondition(7))
	}
}

func TestEvalCustomRuleFiresAndResolves(t *testing.T) {
	db := testdb.Open(t)
	sid, err := db.InsertID(`INSERT INTO managed_servers (name) VALUES ('ruleship')`)
	if err != nil {
		t.Fatal(err)
	}
	rid, err := db.InsertID(`
		INSERT INTO alert_rules (server_id,name,metric,operator,threshold,severity,for_sec,enabled,created_by,created_at,updated_at)
		VALUES ($1,'hot cpu','cpu','above',90,'WARNING',0,true,'test',NOW(),NOW())`, sid)
	if err != nil {
		t.Fatal(err)
	}
	rule := customRule{id: uint(rid), serverID: ptrUint(uint(sid)), name: "hot cpu",
		metric: "cpu", operator: "above", threshold: 90, severity: "WARNING"}

	insertMetric := func(cpu float64) {
		t.Helper()
		if _, err := db.Exec(`
			INSERT INTO server_metrics (server_id,timestamp,cpu_usage,memory_usage,memory_used_mb,disk_usage,disk_used_gb,net_rx,net_tx,load_avg1,uptime_sec)
			VALUES ($1,NOW(),$2,0,0,0,0,0,0,0,0)`, sid, cpu); err != nil {
			t.Fatal(err)
		}
	}

	insertMetric(95)
	evalCustomRule(db, nil, rule)
	if got := alertStatus(t, db, ruleCondition(uint(rid))); got != "TRIGGERED" {
		t.Fatalf("want TRIGGERED, got %q", got)
	}

	// Second pass must not duplicate the open alert.
	evalCustomRule(db, nil, rule)
	if got := alertCount(t, db, ruleCondition(uint(rid))); got != 1 {
		t.Fatalf("want 1 alert row, got %d", got)
	}

	// Fresh cool sample resolves it (ForSec=0 evaluates latest only).
	insertMetric(10)
	evalCustomRule(db, nil, rule)
	if got := alertStatus(t, db, ruleCondition(uint(rid))); got != "RESOLVED" {
		t.Fatalf("want RESOLVED, got %q", got)
	}
}

func TestEvalCustomRuleSustained(t *testing.T) {
	db := testdb.Open(t)
	sid, err := db.InsertID(`INSERT INTO managed_servers (name) VALUES ('steadyship')`)
	if err != nil {
		t.Fatal(err)
	}
	rid, err := db.InsertID(`
		INSERT INTO alert_rules (server_id,name,metric,operator,threshold,severity,for_sec,enabled,created_by,created_at,updated_at)
		VALUES ($1,'hot cpu 5m','cpu','above',90,'WARNING',300,true,'test',NOW(),NOW())`, sid)
	if err != nil {
		t.Fatal(err)
	}
	rule := customRule{id: uint(rid), serverID: ptrUint(uint(sid)), name: "hot cpu 5m",
		metric: "cpu", operator: "above", threshold: 90, severity: "WARNING", forSec: 300}

	// One hot, one cool sample inside the window: no fire.
	if _, err := db.Exec(`
		INSERT INTO server_metrics (server_id,timestamp,cpu_usage,memory_usage,memory_used_mb,disk_usage,disk_used_gb,net_rx,net_tx,load_avg1,uptime_sec)
		VALUES ($1,NOW()-INTERVAL '200 seconds',95,0,0,0,0,0,0,0,0),
		       ($1,NOW()-INTERVAL '100 seconds',10,0,0,0,0,0,0,0,0)`, sid); err != nil {
		t.Fatal(err)
	}
	evalCustomRule(db, nil, rule)
	if got := alertCount(t, db, ruleCondition(uint(rid))); got != 0 {
		t.Fatalf("mixed window should not fire, got %d rows", got)
	}

	// Cool sample ages out of the window: fires.
	if _, err := db.Exec(`DELETE FROM server_metrics WHERE server_id=$1 AND cpu_usage < 50`, sid); err != nil {
		t.Fatal(err)
	}
	evalCustomRule(db, nil, rule)
	if got := alertStatus(t, db, ruleCondition(uint(rid))); got != "TRIGGERED" {
		t.Fatalf("sustained breach should fire, got %q", got)
	}
}

func ptrUint(v uint) *uint { return &v }

func alertStatus(t *testing.T, db *database.DB, cond string) string {
	t.Helper()
	var status string
	if err := db.QueryRow(`SELECT status FROM alerts WHERE condition=$1 ORDER BY triggered_at DESC LIMIT 1`, cond).Scan(&status); err != nil {
		t.Fatalf("alert row missing for %s: %v", cond, err)
	}
	return status
}

func alertCount(t *testing.T, db *database.DB, cond string) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM alerts WHERE condition=$1`, cond).Scan(&n); err != nil {
		t.Fatal(err)
	}
	return n
}
