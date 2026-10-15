# ServerHub Agent

Lightweight Go agent that runs on a managed Linux server and reports heartbeat + metrics to the ServerHub API. Single static binary — no Node.js runtime required.

## Requirements

- An agent token generated from the ServerHub web UI (Servers → select server → Agent Tokens → Generate)

## Install

```bash
# On the managed server
git clone https://github.com/Sri20112001/server-hub.git /opt/serverhub-agent
cd /opt/serverhub-agent/agent
go build -o serverhub-agent .
```

Or via Docker:

```bash
docker build -t serverhub-agent ./agent
```

Pre-built cross-compile examples:

```bash
GOOS=linux GOARCH=amd64 go build -o serverhub-agent .
GOOS=linux GOARCH=arm64 go build -o serverhub-agent .
```

## Run

```bash
AGENT_TOKEN=<your-token> \
SERVERHUB_URL=http://<your-serverhub-host>:4000 \
./serverhub-agent
```

## Environment variables

| Variable             | Required | Default | Description                          |
|----------------------|----------|---------|--------------------------------------|
| `AGENT_TOKEN`        | Yes      | —       | Token from ServerHub web UI          |
| `SERVERHUB_URL`      | Yes      | —       | Base URL of the ServerHub API        |
| `METRICS_INTERVAL`   | No       | 60      | Seconds between metric reports       |
| `HEARTBEAT_INTERVAL` | No       | 30      | Seconds between heartbeats           |
| `HTTP_TIMEOUT_SEC`   | No       | 10      | Per-request timeout in seconds       |

## Run as a systemd service

```ini
# /etc/systemd/system/serverhub-agent.service
[Unit]
Description=ServerHub Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/serverhub-agent/agent
ExecStart=/opt/serverhub-agent/agent/serverhub-agent
Restart=always
RestartSec=10
Environment=AGENT_TOKEN=<your-token>
Environment=SERVERHUB_URL=http://<your-serverhub-host>:4000

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now serverhub-agent
```

## Notes

- `uptimeSec` reports **host** uptime (the previous Node.js agent reported the agent process uptime).
- Metrics are collected with [gopsutil](https://github.com/shirou/gopsutil) (`cpu`, `mem`, `disk`, `net`, `load`, `host`) and POSTed to `/server-hub/api/agent/heartbeat` and `/server-hub/api/agent/metrics` with `Authorization: Bearer <token>`.
- Live reload during development: `air` (see `.air.toml`).
