package handlers

// Mobile push-token registry. The app registers its Expo push token after
// login (and drops it on logout); the notify package fans alert events out
// to every registered device. Tokens are per-user and never returned by the
// API — clients track their own token locally for deregistration.

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"serverhub/internal/audit"
	"serverhub/internal/database"
	"serverhub/internal/middleware"
	"serverhub/internal/notify"
)

type PushTokensHandler struct {
	DB *database.DB
}

// GET /server-hub/api/push-tokens — the caller's devices (token values withheld).
func (h *PushTokensHandler) List(c *gin.Context) {
	u, _ := middleware.CurrentUser(c)
	rows, err := h.DB.Query(`
		SELECT id, platform, created_at, last_used_at
		FROM push_tokens WHERE username=$1 ORDER BY last_used_at DESC`, u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []gin.H{}
	for rows.Next() {
		var id uint
		var platform string
		var createdAt, lastUsedAt time.Time
		if err := rows.Scan(&id, &platform, &createdAt, &lastUsedAt); err != nil {
			continue
		}
		out = append(out, gin.H{
			"id": id, "platform": platform,
			"createdAt": createdAt, "lastUsedAt": lastUsedAt,
		})
	}
	c.JSON(http.StatusOK, out)
}

// POST /server-hub/api/push-tokens — register (or refresh) this device.
// Any authenticated role may register its own devices.
func (h *PushTokensHandler) Register(c *gin.Context) {
	var body struct {
		ExpoPushToken string `json:"expoPushToken"`
		Platform      string `json:"platform"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	token := strings.TrimSpace(body.ExpoPushToken)
	if !notify.ValidExpoPushToken(token) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "expoPushToken must look like ExponentPushToken[...] or ExpoPushToken[...]"})
		return
	}
	u, _ := middleware.CurrentUser(c)
	_, err := h.DB.Exec(`
		INSERT INTO push_tokens (username, token, platform, created_at, last_used_at)
		VALUES ($1,$2,$3,NOW(),NOW())
		ON CONFLICT(token) DO UPDATE SET username=excluded.username, platform=excluded.platform, last_used_at=NOW()`,
		u, token, strings.TrimSpace(body.Platform))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	audit.Write(h.DB, u, "register", "push_token", "", "ok", strings.TrimSpace(body.Platform))
	c.JSON(http.StatusCreated, gin.H{"ok": true})
}

// DELETE /server-hub/api/push-tokens — drop one of the caller's devices.
// Unknown tokens (including other users') 404 so callers can't probe devices
// that aren't theirs.
func (h *PushTokensHandler) Unregister(c *gin.Context) {
	var body struct {
		ExpoPushToken string `json:"expoPushToken"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	u, _ := middleware.CurrentUser(c)
	res, err := h.DB.Exec(`DELETE FROM push_tokens WHERE token=$1 AND username=$2`,
		strings.TrimSpace(body.ExpoPushToken), u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "token not found"})
		return
	}
	audit.Write(h.DB, u, "unregister", "push_token", "", "ok", "")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
