#!/usr/bin/env bash
set -e

# ServerHub Agent — 1-Step Linux Installer & Systemd Service Setup
# Usage:
#   sudo ./install.sh -token="<AGENT_TOKEN>" -url="http://<SERVERHUB_HOST>:4000"

TOKEN=""
URL=""
BIN_NAME="serverhub-agent"
DEST_BIN="/usr/local/bin/${BIN_NAME}"
SERVICE_FILE="/etc/systemd/system/serverhub-agent.service"

while [ "$#" -gt 0 ]; do
  case "$1" in
    -token=*|--token=*)
      TOKEN="${1#*=}"
      shift
      ;;
    -token|--token)
      TOKEN="$2"
      shift 2
      ;;
    -url=*|--url=*)
      URL="${1#*=}"
      shift
      ;;
    -url|--url)
      URL="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ -z "$TOKEN" ] || [ -z "$URL" ]; then
  echo "❌ Error: Both -token and -url are required."
  echo ""
  echo "Usage:"
  echo "  sudo ./install.sh -token=\"<YOUR_AGENT_TOKEN>\" -url=\"http://<SERVERHUB_HOST>:4000\""
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: This script must be run as root (or with sudo)."
  exit 1
fi

echo "==> Configuring ServerHub Agent..."

# If binary exists in current directory, use it
if [ -f "./${BIN_NAME}" ]; then
  echo "==> Using local binary: ./${BIN_NAME}"
  cp "./${BIN_NAME}" "$DEST_BIN"
elif command -v go >/dev/null 2>&1 && [ -f "./main.go" ]; then
  echo "==> Building binary using Go..."
  CGO_ENABLED=0 go build -ldflags="-s -w" -o "$DEST_BIN" .
else
  echo "❌ Error: Neither ./${BIN_NAME} binary nor 'go' compiler found in current directory."
  echo "Please build the binary or copy serverhub-agent into this directory first."
  exit 1
fi

chmod +x "$DEST_BIN"

echo "==> Registering systemd service (${SERVICE_FILE})..."
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=ServerHub Telemetry Agent
After=network.target

[Service]
Type=simple
ExecStart=${DEST_BIN} -token=${TOKEN} -url=${URL}
Restart=always
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

echo "==> Starting service..."
systemctl daemon-reload
systemctl enable --now serverhub-agent

sleep 2
if systemctl is-active --quiet serverhub-agent; then
  echo ""
  echo "=========================================================="
  echo "  ✅ ServerHub Agent is successfully installed & running!  "
  echo "=========================================================="
  echo "  View status:  systemctl status serverhub-agent"
  echo "  View logs:    journalctl -u serverhub-agent -f"
  echo "  Stop agent:   sudo systemctl stop serverhub-agent"
  echo "=========================================================="
else
  echo "⚠️ Service started but is not reporting active. Recent logs:"
  journalctl -u serverhub-agent -n 15 --no-pager
  exit 1
fi
