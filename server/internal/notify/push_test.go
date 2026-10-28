package notify

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"serverhub/internal/testdb"
)

func TestValidExpoPushToken(t *testing.T) {
	valid := []string{
		"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
		"ExpoPushToken[abc123]",
		"  ExponentPushToken[x]  ",
	}
	for _, tok := range valid {
		if !ValidExpoPushToken(tok) {
			t.Errorf("should accept %q", tok)
		}
	}
	invalid := []string{
		"",
		"ExponentPushToken[]",
		"ExponentPushToken[x",
		"ExponentPushTokenx]",
		"FCMToken[abc]",
		"ExponentPushToken",
		"ExponentPushToken[x]extra",
	}
	for _, tok := range invalid {
		if ValidExpoPushToken(tok) {
			t.Errorf("should reject %q", tok)
		}
	}
}

func TestSendPushPrunesDeadTokens(t *testing.T) {
	db := testdb.Open(t)
	good := "ExponentPushToken[good-device]"
	dead := "ExponentPushToken[dead-device]"
	for _, tok := range []string{good, dead} {
		if _, err := db.Exec(`INSERT INTO push_tokens (username, token, platform, created_at, last_used_at)
			VALUES ('op',$1,'android',NOW(),NOW())`, tok); err != nil {
			t.Fatal(err)
		}
	}

	var got struct {
		To       []string `json:"to"`
		Title    string   `json:"title"`
		Body     string   `json:"body"`
		Sound    string   `json:"sound"`
		Priority string   `json:"priority"`
	}
	stub := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Errorf("bad payload: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":[{"status":"ok","id":"1"},` +
			`{"status":"error","message":"mismatch","details":{"error":"DeviceNotRegistered"}}]}`))
	}))
	defer stub.Close()

	old := expoPushURL
	expoPushURL = stub.URL
	defer func() { expoPushURL = old }()

	if err := sendPush(db, "Alert", "cpu high"); err != nil {
		t.Fatalf("sendPush: %v", err)
	}
	if len(got.To) != 2 || got.Title != "Alert" || got.Body != "cpu high" {
		t.Fatalf("bad ticket payload: %+v", got)
	}
	if got.Sound != "default" || got.Priority != "high" {
		t.Fatalf("bad ticket options: %+v", got)
	}

	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM push_tokens`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("dead token should be pruned, %d rows left", n)
	}
	var left string
	if err := db.QueryRow(`SELECT token FROM push_tokens`).Scan(&left); err != nil {
		t.Fatal(err)
	}
	if left != good {
		t.Fatalf("wrong token pruned, left %q", left)
	}
}

func TestSendPushNoDevices(t *testing.T) {
	db := testdb.Open(t)
	if err := sendPush(db, "Alert", "cpu high"); err != nil {
		t.Fatalf("no devices must be a no-op, got %v", err)
	}
}
