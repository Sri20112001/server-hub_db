package handlers

// Agent installer downloads.
//
// server/Dockerfile cross-compiles the agent for every supported target and
// bakes the binaries into the API image, so a new host can install the agent
// without a Go toolchain, a git clone or the repo at all:
//
//	curl -fsSL "http://<serverhub>:4000/server-hub/api/agent/download?os=linux&arch=amd64" -o serverhub-agent
//
// The endpoint is unauthenticated on purpose: it serves the same static
// binary that is already public in the repo, and requiring a header would
// break the `curl | tar` style install. The os/arch values are matched
// against an allowlist before touching the filesystem, so the query string
// can never escape the binary directory.

import (
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
)

// agentTargets is the set of targets server/Dockerfile builds. Anything not
// listed here is rejected with 400 (unknown target) rather than 404, so a
// typo is distinguishable from "this image was built without that binary".
var agentTargets = map[string][]string{
	"linux":   {"amd64", "arm64", "arm"},
	"darwin":  {"amd64", "arm64"},
	"windows": {"amd64"},
}

type AgentDownloadHandler struct {
	// Dir holds serverhub-agent-<os>-<arch>[.exe] files (AGENT_BIN_DIR).
	Dir string
}

func agentBinaryName(osName, arch string) string {
	name := "serverhub-agent-" + osName + "-" + arch
	if osName == "windows" {
		name += ".exe"
	}
	return name
}

func agentTargetSupported(osName, arch string) bool {
	for _, a := range agentTargets[osName] {
		if a == arch {
			return true
		}
	}
	return false
}

// agentTargetList renders the supported targets as "os [arch,arch]" strings
// for error payloads and the UI.
func agentTargetList() []string {
	oses := make([]string, 0, len(agentTargets))
	for o := range agentTargets {
		oses = append(oses, o)
	}
	sort.Strings(oses)
	out := make([]string, 0, len(oses))
	for _, o := range oses {
		arches := append([]string(nil), agentTargets[o]...)
		sort.Strings(arches)
		out = append(out, o+" ["+strings.Join(arches, ",")+"]")
	}
	return out
}

// GET|HEAD /server-hub/api/agent/download?os=linux&arch=amd64
func (h *AgentDownloadHandler) Download(c *gin.Context) {
	osName := strings.ToLower(strings.TrimSpace(c.Query("os")))
	arch := strings.ToLower(strings.TrimSpace(c.Query("arch")))
	if arch == "" {
		arch = "amd64"
	}
	if osName == "" || !agentTargetSupported(osName, arch) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "unsupported os/arch",
			"targets": agentTargetList(),
			"usage":   "/server-hub/api/agent/download?os=linux&arch=amd64",
		})
		return
	}

	name := agentBinaryName(osName, arch)
	path := filepath.Join(h.Dir, name)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "agent binary not bundled for " + osName + "/" + arch,
			"targets": agentTargetList(),
		})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", `attachment; filename="`+name+`"`)
	c.Header("Cache-Control", "public, max-age=3600")
	c.File(path)
}
