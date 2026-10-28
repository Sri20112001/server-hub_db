package handlers

// Tests for custom alert rules: validation, RBAC matrix, CRUD, and the
// disable/delete resolving of open rule alerts.

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"serverhub/internal/config"
	"serverhub/internal/database"
	"serverhub/internal/middleware"
	"serverhub/internal/testdb"
)

func testSetupRules(t *testing.T) (*database.DB, *gin.Engine) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	db := testdb.Open(t)
	for _, u := range [][3]string{
		{"admin", "testpass123", "admin"},
		{"op", "testpass123", "operator"},
		{"view", "testpass123", "viewer"},
	} {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u[1]), bcrypt.MinCost)
		if _, err := db.Exec(`INSERT INTO users (username, password_hash, role) VALUES (?,?,?)`,
			u[0], string(hash), u[2]); err != nil {
			t.Fatal(err)
		}
	}
	cfg := &config.Config{
		JWTSecret:     "test-jwt-secret-min-32-chars-long!!",
		EncryptionKey: testEncKey,
	}
	r := gin.New()
	authH := &AuthHandler{DB: db, Cfg: cfg}
	r.POST("/api/auth/login", authH.Login)
	authd := middleware.AuthRequired(cfg.JWTSecret)
	viewer := r.Group("/api", authd, middleware.RequireRole(middleware.RoleViewer))
	operator := r.Group("/api", authd, middleware.RequireRole(middleware.RoleOperator))
	admin := r.Group("/api", authd, middleware.RequireRole(middleware.RoleAdmin))
	ruleH := &AlertRulesHandler{DB: db}
	viewer.GET("/alert-rules", ruleH.List)
	operator.POST("/alert-rules", ruleH.Create)
	operator.PATCH("/alert-rules/:id", ruleH.Update)
	admin.DELETE("/alert-rules/:id", ruleH.Delete)
	return db, r
}

func TestAlertRulesValidation(t *testing.T) {
	_, r := testSetupRules(t)
	adminC := loginAs(t, r, "admin", "testpass123")
	viewC := loginAs(t, r, "view", "testpass123")

	cases := []struct {
		name string
		body map[string]any
		want int
	}{
		{"bad metric", map[string]any{"metric": "gpu", "threshold": 90}, http.StatusBadRequest},
		{"bad operator", map[string]any{"metric": "cpu", "operator": "equals", "threshold": 90}, http.StatusBadRequest},
		{"above zero", map[string]any{"metric": "cpu", "threshold": 0}, http.StatusBadRequest},
		{"above over 100", map[string]any{"metric": "cpu", "threshold": 101}, http.StatusBadRequest},
		{"below 100", map[string]any{"metric": "cpu", "operator": "below", "threshold": 100}, http.StatusBadRequest},
		{"bad severity", map[string]any{"metric": "cpu", "threshold": 90, "severity": "INFO"}, http.StatusBadRequest},
		{"negative forSec", map[string]any{"metric": "cpu", "threshold": 90, "forSec": -5}, http.StatusBadRequest},
		{"missing server", map[string]any{"metric": "cpu", "threshold": 90, "serverId": 999999}, http.StatusNotFound},
	}
	for _, tc := range cases {
		w := doReq(t, r, "POST", "/api/alert-rules", tc.body, adminC)
		if w.Code != tc.want {
			t.Errorf("%s: want %d, got %d (%s)", tc.name, tc.want, w.Code, w.Body.String())
		}
	}

	// viewer may read but not create.
	if w := doReq(t, r, "GET", "/api/alert-rules", nil, viewC); w.Code != http.StatusOK {
		t.Fatalf("viewer list: want 200, got %d", w.Code)
	}
	if w := doReq(t, r, "POST", "/api/alert-rules",
		map[string]any{"metric": "cpu", "threshold": 90}, viewC); w.Code != http.StatusForbidden {
		t.Fatalf("viewer create: want 403, got %d", w.Code)
	}

	// malformed JSON rejected.
	if w := doReq(t, r, "POST", "/api/alert-rules", "{bad json", adminC); w.Code != http.StatusBadRequest {
		t.Fatalf("malformed json: want 400, got %d", w.Code)
	}
}

func TestAlertRulesCRUD(t *testing.T) {
	_, r := testSetupRules(t)
	adminC := loginAs(t, r, "admin", "testpass123")
	opC := loginAs(t, r, "op", "testpass123")

	// Create with defaults (operator/severity/name auto-filled).
	w := doReq(t, r, "POST", "/api/alert-rules",
		map[string]any{"metric": "memory", "threshold": 80}, opC)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: want 201, got %d (%s)", w.Code, w.Body.String())
	}
	var created struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil || created.ID == 0 {
		t.Fatalf("create response missing id: %s", w.Body.String())
	}

	// List shows defaults applied.
	w = doReq(t, r, "GET", "/api/alert-rules", nil, opC)
	var list []map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil {
		t.Fatalf("list decode: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("want 1 rule, got %d", len(list))
	}
	got := list[0]
	if got["operator"] != "above" || got["severity"] != "WARNING" || got["enabled"] != true {
		t.Fatalf("defaults not applied: %v", got)
	}
	if got["name"] != "memory above 80%" {
		t.Fatalf("auto name wrong: %v", got["name"])
	}

	// Operator cannot delete; admin can.
	rid := fmt.Sprintf("%d", created.ID)
	if w := doReq(t, r, "DELETE", "/api/alert-rules/"+rid, nil, opC); w.Code != http.StatusForbidden {
		t.Fatalf("operator delete: want 403, got %d", w.Code)
	}
	if w := doReq(t, r, "DELETE", "/api/alert-rules/"+rid, nil, adminC); w.Code != http.StatusOK {
		t.Fatalf("admin delete: want 200, got %d (%s)", w.Code, w.Body.String())
	}
	w = doReq(t, r, "GET", "/api/alert-rules", nil, opC)
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil || len(list) != 0 {
		t.Fatalf("rule not deleted: %s", w.Body.String())
	}

	// Unknown ids 404.
	if w := doReq(t, r, "PATCH", "/api/alert-rules/999999",
		map[string]any{"threshold": 50}, opC); w.Code != http.StatusNotFound {
		t.Fatalf("update missing: want 404, got %d", w.Code)
	}
	if w := doReq(t, r, "DELETE", "/api/alert-rules/999999", nil, adminC); w.Code != http.StatusNotFound {
		t.Fatalf("delete missing: want 404, got %d", w.Code)
	}
}

func TestAlertRulesDisableResolves(t *testing.T) {
	db, r := testSetupRules(t)
	opC := loginAs(t, r, "op", "testpass123")

	w := doReq(t, r, "POST", "/api/alert-rules",
		map[string]any{"metric": "cpu", "threshold": 90}, opC)
	if w.Code != http.StatusCreated {
		t.Fatalf("create: %d %s", w.Code, w.Body.String())
	}
	var created struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	cond := fmt.Sprintf("rule:%d", created.ID)

	// Simulate an open firing, then disable the rule: the TRIGGERED row
	// must flip to RESOLVED so it never lingers.
	if _, err := db.Exec(`
		INSERT INTO alerts (condition,threshold,severity,status,message,triggered_at)
		VALUES ($1,90,'WARNING','TRIGGERED','test firing',NOW())`, cond); err != nil {
		t.Fatal(err)
	}
	rid := fmt.Sprintf("%d", created.ID)
	if w := doReq(t, r, "PATCH", "/api/alert-rules/"+rid,
		map[string]any{"enabled": false}, opC); w.Code != http.StatusOK {
		t.Fatalf("disable: want 200, got %d (%s)", w.Code, w.Body.String())
	}
	var status string
	if err := db.QueryRow(`SELECT status FROM alerts WHERE condition=$1`, cond).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != "RESOLVED" {
		t.Fatalf("open alert after disable: want RESOLVED, got %q", status)
	}
}
