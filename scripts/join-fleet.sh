#!/usr/bin/env bash
# ServerHub — join this host to the fleet in one step.
#
# Run ON the host you want to monitor. The script:
#   1. logs in to ServerHub (admin or operator),
#   2. registers the host as a managed server (reusing an existing entry with
#      the same name),
#   3. mints a fresh agent token,
#   4. downloads the matching agent binary for this OS/arch,
#   5. installs it as a service (systemd on Linux, launchd on macOS) and starts
#      it.
#
# Usage:
#   sudo ./join-fleet.sh -url=http://imagesoft.in:4000 -user=admin
#   SERVERHUB_PASSWORD=... sudo ./join-fleet.sh -url=... -user=admin -name=web-01
#
# Options:
#   -url=URL        ServerHub base URL (default: http://localhost:4000)
#   -user=NAME      account used to register (agent tokens need admin)
#   -password=PASS  password (or SERVERHUB_PASSWORD, else prompt)
#   -name=NAME      fleet name for this host (default: short hostname)
#   -group=ID       optional server group id
#   -no-service     register + download only; do not install/start a service
#   -h, --help      show this help
#
# The token is written to /etc/serverhub-agent/.env (0600) and never appears on
# a command line, so it stays out of `ps` and shell history.

set -euo pipefail

BASE="http://localhost:4000"
USERNAME=""
PASSWORD="${SERVERHUB_PASSWORD:-}"
NAME=""
GROUP=""
NO_SERVICE=0
BIN_NAME="serverhub-agent"
DEST_BIN="/usr/local/bin/${BIN_NAME}"
CONF_DIR="/etc/serverhub-agent"

usage() { sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; }
die() { echo "error: $*" >&2; exit 1; }

while [ "$#" -gt 0 ]; do
  case "$1" in
    -url=*) BASE="${1#*=}" ;;
    -user=*) USERNAME="${1#*=}" ;;
    -password=*) PASSWORD="${1#*=}" ;;
    -name=*) NAME="${1#*=}" ;;
    -group=*) GROUP="${1#*=}" ;;
    -no-service) NO_SERVICE=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1 (try -h)" ;;
  esac
  shift
done

BASE="${BASE%/}"
[ -n "$USERNAME" ] || die "-user is required"
if [ -z "$PASSWORD" ]; then
  [ -t 0 ] || die "no TTY for the password prompt; pass -password= or SERVERHUB_PASSWORD"
  printf 'ServerHub password for %s: ' "$USERNAME" >&2
  read -r -s PASSWORD
  echo >&2
fi
[ -n "$PASSWORD" ] || die "password is required"

if [ "$NO_SERVICE" -eq 0 ] && [ "$(id -u)" -ne 0 ]; then
  die "service install needs root — re-run with sudo, or pass -no-service"
fi

# ── tiny HTTP helper: prints the body, fails loudly on HTTP >= 400 ───────────
request() { # request METHOD PATH TOKEN DATA
  local method="$1" path="$2" token="${3:-}" data="${4:-}"
  local body_file status
  local -a args
  body_file="$(mktemp)"
  args=(-sS -o "$body_file" -w '%{http_code}' -X "$method" "$BASE$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ] && args+=(-H 'Content-Type: application/json' -d "$data")
  if ! status="$(curl "${args[@]}")"; then
    rm -f "$body_file"
    die "cannot reach $BASE$path"
  fi
  if [ "$status" -ge 400 ]; then
    local msg
    msg="$(cat "$body_file")"
    rm -f "$body_file"
    echo "HTTP $status on $method $path: $msg" >&2
    return 1
  fi
  cat "$body_file"
  rm -f "$body_file"
}

json_str() { printf '%s' "$1" | tr ',' '\n' | sed -n 's/.*"'"$2"'":"\([^"]*\)".*/\1/p' | head -n 1; }
json_num() { printf '%s' "$1" | tr ',' '\n' | sed -n 's/.*"'"$2"'":\([0-9][0-9]*\).*/\1/p' | head -n 1; }
json_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

# ── 1. log in ───────────────────────────────────────────────────────────────
echo "→ logging in to $BASE as $USERNAME"
login_body="{\"username\":\"$(json_escape "$USERNAME")\",\"password\":\"$(json_escape "$PASSWORD")\"}"
login_resp="$(request POST /server-hub/api/auth/token "" "$login_body")" || die "login failed"
JWT="$(json_str "$login_resp" token)"
[ -n "$JWT" ] || die "login returned no token: $login_resp"
ROLE="$(json_str "$login_resp" role)"
echo "  ok (role: ${ROLE:-unknown})"

# ── 1b. work out which binary this host needs ───────────────────────────────
case "$(uname -s)" in
  Linux) AGENT_OS="linux" ;;
  Darwin) AGENT_OS="darwin" ;;
  *) die "unsupported OS: $(uname -s) — Windows hosts install the .exe manually (?os=windows)" ;;
esac
case "$(uname -m)" in
  x86_64|amd64) AGENT_ARCH="amd64" ;;
  arm64|aarch64) AGENT_ARCH="arm64" ;;
  armv7*|armv6*) AGENT_ARCH="arm" ;;
  *) die "unsupported arch: $(uname -m)" ;;
esac

# ── 2. find or create the server record ─────────────────────────────────────
if [ -z "$NAME" ]; then
  NAME="$(hostname -s 2>/dev/null || hostname)"
fi
FQDN="$(hostname -f 2>/dev/null || hostname 2>/dev/null || echo "")"
IP=""
if [ "$AGENT_OS" = "linux" ] && command -v ip >/dev/null 2>&1; then
  IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}' 2>/dev/null || true)"
elif [ "$AGENT_OS" = "darwin" ] && command -v ipconfig >/dev/null 2>&1; then
  IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
fi

echo "→ registering $NAME (${FQDN:-no fqdn}${IP:+, $IP})"
list_resp="$(request GET /server-hub/api/servers "$JWT")" || die "could not list servers"
SERVER_ID="$(printf '%s' "$list_resp" | tr '{' '\n' | grep -F "\"name\":\"$NAME\"" | sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' | head -n 1 || true)"
if [ -n "$SERVER_ID" ]; then
  echo "  reusing existing server id $SERVER_ID"
else
  create_body=$(printf '{"name":"%s","hostname":"%s","ipAddress":"%s"%s}' \
    "$(json_escape "$NAME")" "$(json_escape "$FQDN")" "$(json_escape "$IP")" "${GROUP:+,\"groupId\":$GROUP}")
  create_resp="$(request POST /server-hub/api/servers "$JWT" "$create_body")" || die "could not create the server"
  SERVER_ID="$(json_num "$create_resp" id)"
  [ -n "$SERVER_ID" ] || die "server created but no id returned: $create_resp"
  echo "  created server id $SERVER_ID"
fi

# ── 3. mint an agent token ──────────────────────────────────────────────────
LABEL="join-fleet $(date -u +%Y-%m-%dT%H:%MZ)"
echo "→ creating agent token"
token_resp="$(request POST "/server-hub/api/servers/$SERVER_ID/tokens" "$JWT" "{\"label\":\"$LABEL\"}")" \
  || die "could not create a token (is $USERNAME an admin?)"
TOKEN="$(json_str "$token_resp" token)"
[ -n "$TOKEN" ] || die "no token returned: $token_resp"
echo "  token created (shown only once, stored in $CONF_DIR/.env)"

# ── 4. download the matching agent binary ───────────────────────────────────
echo "→ downloading agent ($AGENT_OS/$AGENT_ARCH)"
tmp_bin="$(mktemp)"
if ! curl -fsSL "$BASE/server-hub/api/agent/download?os=$AGENT_OS&arch=$AGENT_ARCH" -o "$tmp_bin"; then
  rm -f "$tmp_bin"
  echo "" >&2
  echo "The API does not serve prebuilt binaries yet (older image)." >&2
  echo "Register/token work is done — server id $SERVER_ID, token saved nowhere." >&2
  echo "Rebuild ServerHub (commit bfca443 or later) or copy a binary manually:" >&2
  echo "  sudo install -m 0755 ./serverhub-agent $DEST_BIN" >&2
  echo "  AGENT_TOKEN=$TOKEN SERVERHUB_URL=$BASE $DEST_BIN" >&2
  exit 1
fi
chmod +x "$tmp_bin"

# ── 5. install + start ──────────────────────────────────────────────────────
if [ "$NO_SERVICE" -eq 1 ]; then
  echo "→ saved binary at $tmp_bin (service install skipped)"
  echo "  run: AGENT_TOKEN=$TOKEN SERVERHUB_URL=$BASE $tmp_bin"
  exit 0
fi

mkdir -p "$(dirname "$DEST_BIN")"
install -m 0755 "$tmp_bin" "$DEST_BIN"
rm -f "$tmp_bin"
mkdir -p "$CONF_DIR"
umask 077
printf 'AGENT_TOKEN=%s\nSERVERHUB_URL=%s\n' "$TOKEN" "$BASE" > "$CONF_DIR/.env"
chmod 600 "$CONF_DIR/.env"

if [ "$AGENT_OS" = "linux" ]; then
  command -v systemctl >/dev/null 2>&1 || die "systemd not found — run $DEST_BIN with $CONF_DIR/.env yourself"
  cat > /etc/systemd/system/serverhub-agent.service <<'UNIT'
[Unit]
Description=ServerHub Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/serverhub-agent
WorkingDirectory=/etc/serverhub-agent
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now serverhub-agent
  echo "→ started systemd unit serverhub-agent"
  systemctl --no-pager --lines=0 status serverhub-agent || true
else
  PLIST="/Library/LaunchDaemons/in.serverhub.agent.plist"
  cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>in.serverhub.agent</string>
  <key>ProgramArguments</key><array><string>$DEST_BIN</string></array>
  <key>WorkingDirectory</key><string>$CONF_DIR</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AGENT_TOKEN</key><string>$TOKEN</string>
    <key>SERVERHUB_URL</key><string>$BASE</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
PLIST_EOF
  chmod 600 "$PLIST"
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load -w "$PLIST"
  echo "→ started launchd job in.serverhub.agent"
fi

echo ""
echo "Done: \"$NAME\" (id $SERVER_ID) should show ONLINE within ~30s."
echo "Check: systemctl status serverhub-agent   (or: launchctl list | grep serverhub)"
echo "Remove: revoke the token in the UI, then stop and delete the unit."
