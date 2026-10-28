package handlers

// Custom alert rules: user-defined per-server thresholds evaluated by the
// alerting loop (see internal/alerting/alertrules.go). Rule firings land in
// the shared alerts table under condition "rule:<id>", so listing,
// resolving, notifications, and SSE keep working unchanged.

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"serverhub/internal/audit"
	"serverhub/internal/database"
	"serverhub/internal/middleware"
)

type AlertRulesHandler struct {
	DB *database.DB
}

func validRuleMetric(m string) bool {
	return m == "cpu" || m == "memory" || m == "disk"
}

func validRuleOperator(o string) bool {
	return o == "above" || o == "below"
}

func validRuleSeverity(s string) bool {
	return s == "WARNING" || s == "CRITICAL"
}

// validRuleThreshold bounds percent thresholds. "above 0" would fire
// constantly and "below 100" likewise, so those edges are rejected.
func validRuleThreshold(operator string, t float64) bool {
	if operator == "below" {
		return t >= 0 && t < 100
	}
	return t > 0 && t <= 100
}

func ruleConditionKey(id int64) string {
	return fmt.Sprintf("rule:%d", id)
}

// resolveRuleAlerts marks open alerts for a rule RESOLVED (used when a rule
// is disabled, rescoped, or deleted so stale TRIGGERED rows never linger).
// serverID nil resolves across every server.
func (h *AlertRulesHandler) resolveRuleAlerts(condition string, serverID *uint) {
	if serverID != nil {
		_, _ = h.DB.Exec(`UPDATE alerts SET status='RESOLVED', resolved_at=$1
			WHERE condition=$2 AND status='TRIGGERED' AND server_id=$3`,
			time.Now().UTC(), condition, *serverID)
		return
	}
	_, _ = h.DB.Exec(`UPDATE alerts SET status='RESOLVED', resolved_at=$1
		WHERE condition=$2 AND status='TRIGGERED'`, time.Now().UTC(), condition)
}

func (h *AlertRulesHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(`
		SELECT r.id, r.server_id, s.name, r.name, r.metric, r.operator,
		       r.threshold, r.severity, r.for_sec, r.enabled,
		       r.created_by, r.created_at, r.updated_at
		FROM alert_rules r LEFT JOIN managed_servers s ON s.id = r.server_id
		ORDER BY r.id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	out := []gin.H{}
	for rows.Next() {
		var id uint
		var serverID *uint
		var serverName *string
		var name, metric, operator, severity, createdBy string
		var threshold float64
		var forSec int
		var enabled bool
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &serverID, &serverName, &name, &metric,
			&operator, &threshold, &severity, &forSec, &enabled,
			&createdBy, &createdAt, &updatedAt); err != nil {
			continue
		}
		out = append(out, gin.H{
			"id": id, "serverId": serverID, "serverName": serverName,
			"name": name, "metric": metric, "operator": operator,
			"threshold": threshold, "severity": severity, "forSec": forSec,
			"enabled": enabled, "createdBy": createdBy,
			"createdAt": createdAt, "updatedAt": updatedAt,
		})
	}
	c.JSON(http.StatusOK, out)
}

func (h *AlertRulesHandler) Create(c *gin.Context) {
	var body struct {
		Name      string  `json:"name"`
		ServerID  *uint   `json:"serverId"`
		Metric    string  `json:"metric"`
		Operator  string  `json:"operator"`
		Threshold float64 `json:"threshold"`
		Severity  string  `json:"severity"`
		ForSec    int     `json:"forSec"`
		Enabled   *bool   `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	body.Metric = strings.ToLower(strings.TrimSpace(body.Metric))
	body.Operator = strings.ToLower(strings.TrimSpace(body.Operator))
	if body.Operator == "" {
		body.Operator = "above"
	}
	body.Severity = strings.ToUpper(strings.TrimSpace(body.Severity))
	if body.Severity == "" {
		body.Severity = "WARNING"
	}
	if !validRuleMetric(body.Metric) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "metric must be cpu, memory, or disk"})
		return
	}
	if !validRuleOperator(body.Operator) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "operator must be above or below"})
		return
	}
	if !validRuleThreshold(body.Operator, body.Threshold) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "threshold must be a percent in (0,100] for above or [0,100) for below"})
		return
	}
	if !validRuleSeverity(body.Severity) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "severity must be WARNING or CRITICAL"})
		return
	}
	if body.ForSec < 0 || body.ForSec > 86400 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "forSec must be between 0 and 86400"})
		return
	}
	if body.ServerID != nil {
		var count int
		if err := h.DB.QueryRow(`SELECT COUNT(*) FROM managed_servers WHERE id=$1`, *body.ServerID).Scan(&count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if count == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "server not found"})
			return
		}
	}
	if strings.TrimSpace(body.Name) == "" {
		body.Name = fmt.Sprintf("%s %s %v%%", body.Metric, body.Operator, body.Threshold)
	}
	enabled := body.Enabled == nil || *body.Enabled
	u, _ := middleware.CurrentUser(c)
	id, err := h.DB.InsertID(`
		INSERT INTO alert_rules (server_id,name,metric,operator,threshold,severity,for_sec,enabled,created_by,created_at,updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
		body.ServerID, strings.TrimSpace(body.Name), body.Metric, body.Operator,
		body.Threshold, body.Severity, body.ForSec, enabled, u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	audit.Write(h.DB, u, "create", "alert_rule", strconv.FormatInt(id, 10), "ok", body.Metric)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *AlertRulesHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var curServerID *uint
	if err := h.DB.QueryRow(`SELECT server_id FROM alert_rules WHERE id=$1`, id).
		Scan(&curServerID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "rule not found"})
		return
	}
	var body struct {
		Name      *string  `json:"name"`
		ServerID  *uint    `json:"serverId"`
		Threshold *float64 `json:"threshold"`
		Severity  *string  `json:"severity"`
		ForSec    *int     `json:"forSec"`
		Enabled   *bool    `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Severity != nil {
		*body.Severity = strings.ToUpper(strings.TrimSpace(*body.Severity))
		if !validRuleSeverity(*body.Severity) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "severity must be WARNING or CRITICAL"})
			return
		}
	}
	if body.Threshold != nil {
		// Operator and metric are immutable after creation; validate the
		// new threshold against the stored operator.
		var operator string
		if err := h.DB.QueryRow(`SELECT operator FROM alert_rules WHERE id=$1`, id).Scan(&operator); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !validRuleThreshold(operator, *body.Threshold) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "threshold out of range for this rule's operator"})
			return
		}
	}
	if body.ForSec != nil && (*body.ForSec < 0 || *body.ForSec > 86400) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "forSec must be between 0 and 86400"})
		return
	}
	if body.Name != nil && strings.TrimSpace(*body.Name) == "" {
		body.Name = nil // empty name means "leave unchanged", not "erase"
	}
	if body.ServerID != nil {
		var count int
		if err := h.DB.QueryRow(`SELECT COUNT(*) FROM managed_servers WHERE id=$1`, *body.ServerID).Scan(&count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if count == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "server not found"})
			return
		}
	}
	_, err = h.DB.Exec(`
		UPDATE alert_rules SET
		  name=COALESCE($1,name),
		  server_id=COALESCE($2,server_id),
		  threshold=COALESCE($3,threshold),
		  severity=COALESCE($4,severity),
		  for_sec=COALESCE($5,for_sec),
		  enabled=COALESCE($6,enabled),
		  updated_at=NOW()
		WHERE id=$7`,
		body.Name, body.ServerID, body.Threshold, body.Severity, body.ForSec, body.Enabled, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// A disabled or rescoped rule must not leave stale TRIGGERED rows:
	// resolve across the previous scope (nil scope clears every server).
	if (body.Enabled != nil && !*body.Enabled) ||
		(body.ServerID != nil && (curServerID == nil || *body.ServerID != *curServerID)) {
		h.resolveRuleAlerts(ruleConditionKey(id), curServerID)
	}
	u, _ := middleware.CurrentUser(c)
	audit.Write(h.DB, u, "update", "alert_rule", strconv.FormatInt(id, 10), "ok", "")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AlertRulesHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var count int
	if err := h.DB.QueryRow(`SELECT COUNT(*) FROM alert_rules WHERE id=$1`, id).Scan(&count); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "rule not found"})
		return
	}
	h.resolveRuleAlerts(ruleConditionKey(id), nil)
	if _, err := h.DB.Exec(`DELETE FROM alert_rules WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	u, _ := middleware.CurrentUser(c)
	audit.Write(h.DB, u, "delete", "alert_rule", strconv.FormatInt(id, 10), "ok", "")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

type DefaultRuleSpec struct {
	Name      string  `json:"name"`
	Metric    string  `json:"metric"`
	Operator  string  `json:"operator"`
	Threshold float64 `json:"threshold"`
	Severity  string  `json:"severity"`
	ForSec    int     `json:"forSec"`
}

var DefaultRuleSpecs = []DefaultRuleSpec{
	{Name: "Sustained High CPU", Metric: "cpu", Operator: "above", Threshold: 85, Severity: "WARNING", ForSec: 300},
	{Name: "Critical CPU Spike", Metric: "cpu", Operator: "above", Threshold: 95, Severity: "CRITICAL", ForSec: 60},
	{Name: "High Memory Pressure", Metric: "memory", Operator: "above", Threshold: 85, Severity: "WARNING", ForSec: 120},
	{Name: "Critical Memory Saturation", Metric: "memory", Operator: "above", Threshold: 92, Severity: "CRITICAL", ForSec: 60},
	{Name: "Low Disk Space Warning", Metric: "disk", Operator: "above", Threshold: 85, Severity: "WARNING", ForSec: 0},
	{Name: "Critical Disk Exhaustion", Metric: "disk", Operator: "above", Threshold: 95, Severity: "CRITICAL", ForSec: 0},
	{Name: "Idle Host Inactivity", Metric: "cpu", Operator: "below", Threshold: 5, Severity: "WARNING", ForSec: 900},
}

// SeedDefaultRules seeds industry-standard alert rules if not already present.
func SeedDefaultRules(db *database.DB, creator string) (int, error) {
	if creator == "" {
		creator = "system"
	}
	seeded := 0
	for _, r := range DefaultRuleSpecs {
		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM alert_rules WHERE name=$1 AND server_id IS NULL`, r.Name).Scan(&count); err != nil {
			return seeded, err
		}
		if count > 0 {
			continue
		}
		_, err := db.Exec(`
			INSERT INTO alert_rules (server_id,name,metric,operator,threshold,severity,for_sec,enabled,created_by,created_at,updated_at)
			VALUES (NULL,$1,$2,$3,$4,$5,$6,true,$7,NOW(),NOW())`,
			r.Name, r.Metric, r.Operator, r.Threshold, r.Severity, r.ForSec, creator)
		if err != nil {
			return seeded, err
		}
		seeded++
	}
	return seeded, nil
}

func (h *AlertRulesHandler) Seed(c *gin.Context) {
	u, _ := middleware.CurrentUser(c)
	seeded, err := SeedDefaultRules(h.DB, u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	audit.Write(h.DB, u, "seed", "alert_rules", strconv.Itoa(seeded), "ok", "")
	c.JSON(http.StatusOK, gin.H{"ok": true, "seeded": seeded})
}
