# 1. Build the React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# 2. Build the Go Backend
FROM golang:1.26-alpine AS backend-build
ENV GOTOOLCHAIN=auto
WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ .
RUN CGO_ENABLED=0 go build -o /serverhub ./cmd/server

# 2b. Cross-compile the monitoring agent for every supported target so new
# hosts can download a matching binary (GET /server-hub/api/agent/download).
# Keep this list in sync with agentTargets in internal/handlers/agentdownload.go.
FROM golang:1.26-alpine AS agent-build
WORKDIR /src
COPY agent/go.mod agent/go.sum ./
RUN go mod download
COPY agent/ ./
RUN set -eux; \
    for target in linux/amd64 linux/arm64 linux/arm darwin/amd64 darwin/arm64 windows/amd64; do \
        os="${target%%/*}"; arch="${target##*/}"; out="/out/serverhub-agent-${os}-${arch}"; \
        if [ "$os" = "windows" ]; then out="${out}.exe"; fi; \
        CGO_ENABLED=0 GOOS="$os" GOARCH="$arch" \
            go build -trimpath -ldflags="-s -w" -o "$out" .; \
    done

# 3. Final Image
FROM alpine:3.20
RUN apk add --no-cache ca-certificates docker-cli && \
    adduser -D -u 1001 serverhub
WORKDIR /app
COPY --from=backend-build /serverhub /app/serverhub
COPY --from=frontend-build /app/dist /app/client/dist
COPY --from=agent-build /out /app/agents
RUN chown -R serverhub:serverhub /app
VOLUME ["/app/data"]
EXPOSE 4000
ENV PORT=4000 FRONTEND_DIR=/app/client/dist AGENT_BIN_DIR=/app/agents
USER serverhub
CMD ["/app/serverhub"]
