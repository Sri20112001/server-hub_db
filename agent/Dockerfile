# ServerHub Agent — multi-arch static binary (no Node.js required).
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/serverhub-agent .

FROM scratch
COPY --from=build /out/serverhub-agent /serverhub-agent
ENTRYPOINT ["/serverhub-agent"]
