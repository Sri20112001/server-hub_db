package handlers

// Tests for the push-token registry: validation, per-user isolation, and
// idempotent re-registration.

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"serverhub/internal/config"
	"serverhub/internal/database"
	"serverhub/internal/middleware"
	"serverhub/internal/testdb"
)

func testSetupPush(t *testing.T) (*database.DB, *gin.Engine) {
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
	pushH := &PushTokensHandler{DB: db}
	viewer.GET("/push-tokens", pushH.List)
	viewer.POST("/push-tokens", pushH.Register)
	viewer.DELETE("/push-tokens", pushH.Unregister)
	return db, r
}

func TestPushTokensRegister(t *testing.T) {
	db, r := testSetupPush(t)
	opC := loginAs(t, r, "op", "testpass123")

	// Invalid tokens rejected.
	for _, bad := range []string{"", "FCM[abc]", "ExponentPushToken[]"} {
		w := doReq(t, r, "POST", "/api/push-tokens",
			map[string]any{"expoPushToken": bad}, opC)
		if w.Code != http.StatusBadRequest {
			t.Errorf("token %q: want 400, got %d", bad, w.Code)
		}
	}

	// Unauthenticated rejected.
	w := doReq(t, r, "POST", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[x]"}, nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous register: want 401, got %d", w.Code)
	}

	// Valid register (viewer role is fine — any role manages its own devices).
	viewC := loginAs(t, r, "view", "testpass123")
	w = doReq(t, r, "POST", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[phone1]", "platform": "android"}, viewC)
	if w.Code != http.StatusCreated {
		t.Fatalf("register: want 201, got %d (%s)", w.Code, w.Body.String())
	}

	// Re-register is idempotent (one row, ownership refreshed).
	w = doReq(t, r, "POST", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[phone1]"}, opC)
	if w.Code != http.StatusCreated {
		t.Fatalf("re-register: want 201, got %d", w.Code)
	}
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM push_tokens`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("re-register must upsert, got %d rows", n)
	}

	// List shows the device but never the token value.
	w = doReq(t, r, "GET", "/api/push-tokens", nil, opC)
	if w.Code != http.StatusOK {
		t.Fatalf("list: %d", w.Code)
	}
	if body := w.Body.String(); body == "[]" || strings.Contains(body, "ExponentPushToken") {
		t.Fatalf("list must show the device without leaking the token: %s", body)
	}
}

func TestPushTokensIsolation(t *testing.T) {
	_, r := testSetupPush(t)
	opC := loginAs(t, r, "op", "testpass123")
	viewC := loginAs(t, r, "view", "testpass123")

	doReq(t, r, "POST", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[ops-phone]"}, opC)

	// Other users don't see it…
	w := doReq(t, r, "GET", "/api/push-tokens", nil, viewC)
	var list []map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &list); err != nil || len(list) != 0 {
		t.Fatalf("cross-user leak: %s", w.Body.String())
	}
	// …and can't delete it (404, not 403 — no oracle).
	w = doReq(t, r, "DELETE", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[ops-phone]"}, viewC)
	if w.Code != http.StatusNotFound {
		t.Fatalf("delete other's: want 404, got %d", w.Code)
	}

	// Owner deletes it.
	w = doReq(t, r, "DELETE", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[ops-phone]"}, opC)
	if w.Code != http.StatusOK {
		t.Fatalf("delete own: want 200, got %d (%s)", w.Code, w.Body.String())
	}
	w = doReq(t, r, "DELETE", "/api/push-tokens",
		map[string]any{"expoPushToken": "ExponentPushToken[ops-phone]"}, opC)
	if w.Code != http.StatusNotFound {
		t.Fatalf("double delete: want 404, got %d", w.Code)
	}
}
