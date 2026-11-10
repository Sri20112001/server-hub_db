package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// newDownloadRouter mounts the handler on a bare gin engine.
func newDownloadRouter(dir string) *gin.Engine {
	r := gin.New()
	h := &AgentDownloadHandler{Dir: dir}
	r.GET("/server-hub/api/agent/download", h.Download)
	r.HEAD("/server-hub/api/agent/download", h.Download)
	return r
}

// testAgentDir creates a fake binary directory with a single linux/amd64 file.
func testAgentDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, agentBinaryName("linux", "amd64"))
	if err := os.WriteFile(path, []byte("fake-agent-binary"), 0o644); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
	return dir
}

func TestAgentDownloadServesBinary(t *testing.T) {
	r := newDownloadRouter(testAgentDir(t))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/server-hub/api/agent/download?os=linux&arch=amd64", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", w.Code, w.Body.String())
	}
	if got := w.Body.String(); got != "fake-agent-binary" {
		t.Errorf("body = %q, want fixture contents", got)
	}
	cd := w.Header().Get("Content-Disposition")
	if !strings.Contains(cd, agentBinaryName("linux", "amd64")) {
		t.Errorf("Content-Disposition = %q, want the binary name", cd)
	}
}

func TestAgentDownloadDefaultsToAmd64(t *testing.T) {
	// Windows binary fixture: default arch must resolve to amd64 (.exe suffix).
	dir := t.TempDir()
	name := agentBinaryName("windows", "amd64")
	if err := os.WriteFile(filepath.Join(dir, name), []byte("MZ"), 0o644); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
	r := newDownloadRouter(dir)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/server-hub/api/agent/download?os=windows", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", w.Code, w.Body.String())
	}
	if !strings.HasSuffix(w.Header().Get("Content-Disposition"), name+`"`) {
		t.Errorf("Content-Disposition = %q, want %q", w.Header().Get("Content-Disposition"), name)
	}
}

func TestAgentDownloadHead(t *testing.T) {
	r := newDownloadRouter(testAgentDir(t))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodHead, "/server-hub/api/agent/download?os=linux&arch=amd64", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if w.Body.Len() != 0 {
		t.Errorf("HEAD returned %d body bytes, want none", w.Body.Len())
	}
}

func TestAgentDownloadRejectsUnknownTargets(t *testing.T) {
	r := newDownloadRouter(testAgentDir(t))
	for _, q := range []string{
		"",                        // no os
		"?os=plan9",               // unknown os
		"?os=linux&arch=386",      // allowed os, unsupported arch
		"?os=linux&arch=../..%2f", // traversal attempt
		"?os=..&arch=amd64",       // traversal attempt
	} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/server-hub/api/agent/download"+q, nil))
		if w.Code != http.StatusBadRequest {
			t.Errorf("query %q: status = %d, want 400", q, w.Code)
			continue
		}
		if !strings.Contains(w.Body.String(), "targets") {
			t.Errorf("query %q: body should list supported targets, got %s", q, w.Body.String())
		}
	}
}

func TestAgentDownloadMissingBinary(t *testing.T) {
	// darwin/arm64 is a valid target but the fixture only bundles linux/amd64.
	r := newDownloadRouter(testAgentDir(t))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/server-hub/api/agent/download?os=darwin&arch=arm64", nil))

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body %s)", w.Code, w.Body.String())
	}
}

func TestAgentTargetListSorted(t *testing.T) {
	list := agentTargetList()
	want := []string{
		"darwin [amd64,arm64]",
		"linux [amd64,arm,arm64]",
		"windows [amd64]",
	}
	if len(list) != len(want) {
		t.Fatalf("targets = %v, want %v", list, want)
	}
	for i := range want {
		if list[i] != want[i] {
			t.Errorf("targets[%d] = %q, want %q", i, list[i], want[i])
		}
	}
}
