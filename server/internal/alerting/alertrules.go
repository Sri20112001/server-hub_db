package alerting

import (
	"database/sql"
	"fmt"

	"serverhub/internal/database"
	"serverhub/internal/events"
)

// Custom alert rules (alert_rules table) evaluated on every check pass.
// Rule firings reuse fireAlert/resolveAlert, so the TRIGGERED/RESOLVED state
// machine, in-app notifications, external channels, and SSE events all flow
// exactly like the built-in threshold alerts.

// ruleCondition keys rule-fired alerts so each rule tracks its own state
// independently of the built-in cpu_high/ram_high/disk_high/offline ones.
func ruleCondition(ruleID uint) string {
	return fmt.Sprintf("rule:%d", ruleID)
}

// ruleMetricColumn maps the API metric name to its server_metrics column.
func ruleMetricColumn(metric string) string {
	switch metric {
	case "cpu":
		return "cpu_usage"
	case "memory":
		return "memory_usage"
	case "disk":
		return "disk_usage"
	}
	return ""
}

// breached reports whether samples breach threshold under operator.
// When sustained is false (rule ForSec == 0) only the latest sample is
// evaluated; otherwise every sample in the window must breach, which makes
// the check restart-safe (no in-memory breach timers to lose on reboot).
func breached(samples []float64, operator string, threshold float64, sustained bool) bool {
	if len(samples) == 0 {
		return false
	}
	test := func(v float64) bool {
		if operator == "below" {
			return v < threshold
		}
		return v > threshold
	}
	if !sustained {
		return test(samples[len(samples)-1])
	}
	for _, v := range samples {
		if !test(v) {
			return false
		}
	}
	return true
}

type customRule struct {
	id        uint
	serverID  *uint
	name      string
	metric    string
	operator  string
	threshold float64
	severity  string
	forSec    int
}

func checkCustomRules(db *database.DB, broker *events.Broker) {
	rows, err := db.Query(`
		SELECT id, server_id, name, metric, operator, threshold, severity, for_sec
		FROM alert_rules WHERE enabled=true ORDER BY id`)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var r customRule
		if err := rows.Scan(&r.id, &r.serverID, &r.name, &r.metric, &r.operator,
			&r.threshold, &r.severity, &r.forSec); err != nil {
			continue
		}
		evalCustomRule(db, broker, r)
	}
}

func evalCustomRule(db *database.DB, broker *events.Broker, r customRule) {
	col := ruleMetricColumn(r.metric)
	if col == "" {
		return
	}
	var serverIDs []uint
	if r.serverID != nil {
		serverIDs = []uint{*r.serverID}
	} else {
		srows, err := db.Query(`SELECT id FROM managed_servers`)
		if err != nil {
			return
		}
		for srows.Next() {
			var sid uint
			if err := srows.Scan(&sid); err == nil {
				serverIDs = append(serverIDs, sid)
			}
		}
		srows.Close()
	}
	for _, sid := range serverIDs {
		samples := ruleSamples(db, sid, col, r.forSec)
		if breached(samples, r.operator, r.threshold, r.forSec > 0) {
			latest := samples[len(samples)-1]
			window := ""
			if r.forSec > 0 {
				window = fmt.Sprintf(" for %ds", r.forSec)
			}
			msg := fmt.Sprintf("%s: %s at %.1f%% (%s %.1f%%%s)",
				r.name, r.metric, latest, r.operator, r.threshold, window)
			fireAlert(db, broker, sid, ruleCondition(r.id), r.threshold, r.severity, msg)
		} else {
			resolveAlert(db, broker, sid, ruleCondition(r.id))
		}
	}
}

// ruleSamples returns the metric history for the rule window, oldest first.
// forSec <= 0 returns just the latest sample.
func ruleSamples(db *database.DB, serverID uint, col string, forSec int) []float64 {
	var rows *sql.Rows
	var err error
	if forSec > 0 {
		rows, err = db.Query(`
			SELECT `+col+` FROM server_metrics
			WHERE server_id=? AND timestamp >= NOW() - (? * INTERVAL '1 second')
			ORDER BY timestamp ASC`, serverID, forSec)
	} else {
		rows, err = db.Query(`
			SELECT `+col+` FROM server_metrics
			WHERE server_id=? ORDER BY timestamp DESC LIMIT 1`, serverID)
	}
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []float64
	for rows.Next() {
		var v float64
		if err := rows.Scan(&v); err == nil {
			out = append(out, v)
		}
	}
	return out
}
