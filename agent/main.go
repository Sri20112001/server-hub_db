// ServerHub Agent — lightweight host monitor written in Go.
//
// Reports heartbeat + system metrics to the ServerHub API.
// Replaces the former Node.js agent with a single static binary
// (no Node.js runtime required on managed servers).
//
// Required env vars:
//
//	AGENT_TOKEN   — token generated via the ServerHub web UI
//	SERVERHUB_URL — base URL of the ServerHub API, e.g. http://192.168.1.10:4000
//
// Optional:
//
//	METRICS_INTERVAL   — seconds between metric reports (default: 60)
//	HEARTBEAT_INTERVAL — seconds between heartbeats (default: 30)
//	HTTP_TIMEOUT_SEC   — per-request timeout in seconds (default: 10)
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	gnet "github.com/shirou/gopsutil/v3/net"
)

const version = "2.0.0"

// metricsPayload mirrors the JSON body expected by
// POST /server-hub/api/agent/metrics (see servers.go IngestMetrics).
type metricsPayload struct {
	CPUUsage     float64 `json:"cpuUsage"`
	MemoryUsage  float64 `json:"memoryUsage"`
	MemoryUsedMB float64 `json:"memoryUsedMB"`
	DiskUsage    float64 `json:"diskUsage"`
	DiskUsedGB   float64 `json:"diskUsedGB"`
	NetRx        uint64  `json:"netRx"`
	NetTx        uint64  `json:"netTx"`
	LoadAvg1     float64 `json:"loadAvg1"`
	UptimeSec    uint64  `json:"uptimeSec"`
	Hostname     string  `json:"hostname"`
	OS           string  `json:"os"`
	OSVersion    string  `json:"osVersion"`
	Arch         string  `json:"arch"`
	CPUInfo      string  `json:"cpuInfo"`
	CPUCores     int     `json:"cpuCores"`
	RAMTotal     uint64  `json:"ramTotal"`
	DiskTotal    uint64  `json:"diskTotal"`
}

type config struct {
	token             string
	baseURL           string
	metricsInterval   time.Duration
	heartbeatInterval time.Duration
	httpTimeout       time.Duration
}

func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func parseSeconds(key string, def int) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return time.Duration(def) * time.Second
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		log.Printf("WARN: invalid %s=%q, using default %ds", key, raw, def)
		return time.Duration(def) * time.Second
	}
	return time.Duration(n) * time.Second
}

func loadDotEnv() {
	f, err := os.Open(".env")
	if err != nil {
		return
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
			if os.Getenv(k) == "" {
				_ = os.Setenv(k, v)
			}
		}
	}
}

func loadConfig() (config, error) {
	loadDotEnv()

	tokenFlag := flag.String("token", "", "ServerHub agent token")
	urlFlag := flag.String("url", "", "ServerHub base URL (e.g. http://localhost:4000)")
	metricsFlag := flag.Int("metrics-interval", 0, "Seconds between metric reports")
	heartbeatFlag := flag.Int("heartbeat-interval", 0, "Seconds between heartbeats")
	timeoutFlag := flag.Int("timeout", 0, "Per-request timeout in seconds")
	flag.Parse()

	token := strings.TrimSpace(*tokenFlag)
	if token == "" {
		token = strings.TrimSpace(os.Getenv("AGENT_TOKEN"))
	}
	base := strings.TrimRight(strings.TrimSpace(*urlFlag), "/")
	if base == "" {
		base = strings.TrimRight(strings.TrimSpace(os.Getenv("SERVERHUB_URL")), "/")
	}
	if token == "" || base == "" {
		return config{}, fmt.Errorf("AGENT_TOKEN (or -token) and SERVERHUB_URL (or -url) are required")
	}

	metricsInterval := parseSeconds("METRICS_INTERVAL", 60)
	if *metricsFlag > 0 {
		metricsInterval = time.Duration(*metricsFlag) * time.Second
	}

	heartbeatInterval := parseSeconds("HEARTBEAT_INTERVAL", 30)
	if *heartbeatFlag > 0 {
		heartbeatInterval = time.Duration(*heartbeatFlag) * time.Second
	}

	httpTimeout := parseSeconds("HTTP_TIMEOUT_SEC", 10)
	if *timeoutFlag > 0 {
		httpTimeout = time.Duration(*timeoutFlag) * time.Second
	}

	return config{
		token:             token,
		baseURL:           base,
		metricsInterval:   metricsInterval,
		heartbeatInterval: heartbeatInterval,
		httpTimeout:       httpTimeout,
	}, nil
}

// rootDiskUsage returns usage for "/" on Unix, falling back to the first
// mountable partition (e.g. C: on Windows).
func rootDiskUsage() *disk.UsageStat {
	if u, err := disk.Usage("/"); err == nil && u != nil {
		return u
	}
	partitions, err := disk.Partitions(false)
	if err != nil {
		return nil
	}
	for _, p := range partitions {
		if u, err := disk.Usage(p.Mountpoint); err == nil && u != nil && u.Total > 0 {
			return u
		}
	}
	return nil
}

func totalNetIO() (rx, tx uint64) {
	const maxSafe = 9223372036854775807
	// Sum per-interface counters, filtering out loopback and virtual tunnels
	pers, err := gnet.IOCounters(true)
	if err == nil && len(pers) > 0 {
		for _, c := range pers {
			name := strings.ToLower(c.Name)
			if name == "lo" || strings.HasPrefix(name, "loopback") || strings.Contains(name, "isatap") || strings.Contains(name, "teredo") {
				continue
			}
			if c.BytesRecv < maxSafe {
				rx += c.BytesRecv
			}
			if c.BytesSent < maxSafe {
				tx += c.BytesSent
			}
		}
		if rx > 0 || tx > 0 {
			if rx > maxSafe {
				rx = maxSafe
			}
			if tx > maxSafe {
				tx = maxSafe
			}
			return rx, tx
		}
	}
	// Fallback to aggregate counter
	if totals, err := gnet.IOCounters(false); err == nil && len(totals) > 0 {
		rx, tx = totals[0].BytesRecv, totals[0].BytesSent
		if rx > maxSafe {
			rx = maxSafe
		}
		if tx > maxSafe {
			tx = maxSafe
		}
	}
	return rx, tx
}

func collectMetrics() metricsPayload {
	var m metricsPayload

	if pcts, err := cpu.Percent(time.Second, false); err == nil && len(pcts) > 0 {
		m.CPUUsage = pcts[0]
	} else if err != nil {
		log.Printf("WARN: cpu.Percent: %v", err)
	}

	if vm, err := mem.VirtualMemory(); err == nil && vm != nil {
		if vm.Total > 0 && vm.Active > 0 {
			m.MemoryUsage = float64(vm.Active) / float64(vm.Total) * 100
			m.MemoryUsedMB = float64(vm.Active) / 1024 / 1024
		} else {
			m.MemoryUsage = vm.UsedPercent
			m.MemoryUsedMB = float64(vm.Used) / 1024 / 1024
		}
		m.RAMTotal = vm.Total
	} else if err != nil {
		log.Printf("WARN: mem.VirtualMemory: %v", err)
	}

	if du := rootDiskUsage(); du != nil {
		m.DiskUsage = du.UsedPercent
		m.DiskUsedGB = float64(du.Used) / 1024 / 1024 / 1024
		m.DiskTotal = du.Total
	}

	m.NetRx, m.NetTx = totalNetIO()

	if avg, err := load.Avg(); err == nil && avg != nil {
		m.LoadAvg1 = avg.Load1
	}

	if up, err := host.Uptime(); err == nil {
		m.UptimeSec = up
	}

	if hi, err := host.Info(); err == nil && hi != nil {
		m.Hostname = hi.Hostname
		m.OS = hi.Platform
		if m.OS == "" {
			m.OS = hi.OS
		}
		m.OSVersion = hi.PlatformVersion
		if m.OSVersion == "" {
			m.OSVersion = hi.KernelVersion
		}
		m.Arch = hi.KernelArch
	}
	if m.Hostname == "" {
		m.Hostname, _ = os.Hostname()
	}
	if m.Arch == "" {
		m.Arch = runtime.GOARCH
	}
	if m.OS == "" {
		m.OS = runtime.GOOS
	}

	if infos, err := cpu.Info(); err == nil && len(infos) > 0 {
		m.CPUInfo = strings.TrimSpace(infos[0].ModelName)
	} else if err != nil {
		log.Printf("WARN: cpu.Info: %v", err)
	}
	if n, err := cpu.Counts(true); err == nil && n > 0 {
		m.CPUCores = n
	} else {
		m.CPUCores = runtime.NumCPU()
	}

	return m
}

type agent struct {
	cfg    config
	client *http.Client
}

func (a *agent) post(ctx context.Context, path string, body any) error {
	var rdr io.Reader
	if body != nil {
		buf, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal: %w", err)
		}
		rdr = bytes.NewReader(buf)
	} else {
		rdr = bytes.NewReader([]byte("{}"))
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.cfg.baseURL+path, rdr)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.cfg.token)
	req.Header.Set("User-Agent", "serverhub-agent/"+version+" ("+runtime.GOOS+"/"+runtime.GOARCH+")")

	resp, err := a.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}
	_, _ = io.Copy(io.Discard, resp.Body)
	return nil
}

func (a *agent) sendHeartbeat(ctx context.Context) {
	if err := a.post(ctx, "/server-hub/api/agent/heartbeat", map[string]any{}); err != nil {
		log.Printf("heartbeat failed: %v", err)
		return
	}
	log.Print("heartbeat ok")
}

func (a *agent) sendMetrics(ctx context.Context) {
	m := collectMetrics()
	if err := a.post(ctx, "/server-hub/api/agent/metrics", m); err != nil {
		log.Printf("metrics failed: %v", err)
		return
	}
	log.Printf("metrics ok (cpu=%.1f%% mem=%.1f%% disk=%.1f%%)", m.CPUUsage, m.MemoryUsage, m.DiskUsage)
}

func (a *agent) run(ctx context.Context) {
	// Send immediately on start, then on interval.
	go a.sendHeartbeat(ctx)
	go a.sendMetrics(ctx)

	hb := time.NewTicker(a.cfg.heartbeatInterval)
	mt := time.NewTicker(a.cfg.metricsInterval)
	defer hb.Stop()
	defer mt.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-hb.C:
			go a.sendHeartbeat(ctx)
		case <-mt.C:
			go a.sendMetrics(ctx)
		}
	}
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lmsgprefix)
	log.SetPrefix("serverhub-agent: ")

	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("%v", err)
	}

	log.Printf("starting v%s — %s", version, cfg.baseURL)
	log.Printf("heartbeat every %s, metrics every %s",
		cfg.heartbeatInterval.Truncate(time.Second), cfg.metricsInterval.Truncate(time.Second))

	a := &agent{cfg: cfg, client: &http.Client{Timeout: cfg.httpTimeout}}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		a.run(ctx)
	}()
	<-ctx.Done()
	log.Print("shutting down…")
	stop()
	wg.Wait()
}
