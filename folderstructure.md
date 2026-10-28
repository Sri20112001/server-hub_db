# Task: Audit and Organize the ServerHub Monorepo

Repository: https://github.com/Sri20112001/serverhub

Act as a senior software architect. Review the current repository and improve its monorepo organization without breaking application functionality, development workflows, or production deployment.

## Phase 1 — Audit the existing repository

Inspect the entire repository, including:
- Go backend and `go.mod`
- React web dashboard and its package manifest
- Expo mobile application and its build configuration
- Node.js agent and its package manifest
- Dockerfiles and Docker Compose files
- Jenkins pipeline
- GitHub Actions workflows, if present
- Environment examples, scripts, tests, migrations, and documentation

Create a concise inventory of the existing applications, their dependencies, entry points, build commands, test commands, and deployment dependencies.

Identify duplicated configuration, unclear directory boundaries, unnecessary files, and any paths hardcoded into build or deployment scripts.

Do not assume the proposed directory structure matches the actual repository.

## Phase 2 — Propose the target architecture

Recommend a maintainable structure for this repository.

The desired logical boundaries are:
- Go backend
- React web dashboard
- Expo mobile app
- Node.js agent
- Shared API contracts or generated API clients, where justified
- Deployment and monitoring infrastructure
- Documentation
- Repository-level automation

Preserve the existing folder names unless a move provides a measurable benefit. Do not move everything into an `apps/` directory simply for convention.

If proposing a directory move, identify every Docker, Jenkins, CI, script, import, and documentation reference that must be updated.

## Phase 3 — Establish project boundaries

1. Each application must have clear ownership of its source code, dependencies, configuration, tests, and build process.
2. Keep Go dependencies managed by Go tooling.
3. Keep Node.js dependencies managed by the existing package manager.
4. Do not force the Go backend into a JavaScript workspace.
5. Avoid duplicating API endpoint definitions or data contracts where a practical, maintainable shared specification would help.
6. If adding OpenAPI or shared generated clients, first inspect the existing API and authentication behavior. Do not change API routes or response formats.
7. Keep secrets and machine-specific configuration out of version control.
8. Keep Docker Compose and Jenkins paths valid after every change.

## Phase 4 — Improve developer experience

Create or improve a root `Makefile` with clear commands where applicable, such as:

- `make help`
- `make test`
- `make lint`
- `make build`
- `make test-server`
- `make test-web`
- `make test-mobile`
- `make test-agent`

Commands must call the actual scripts and tools available in the repository. Do not invent scripts that do not exist.

Document prerequisites, environment setup, local development, testing, and production deployment.

Allow developers to work on one application without requiring unrelated applications to be rebuilt, except when a real dependency exists.

## Phase 5 — CI/CD and deployment

Review Jenkins and any GitHub Actions workflows.

- Keep backend, web, mobile, and agent validation logically separate.
- Preserve current deployment behavior.
- Add path-based execution only if it is reliable and does not miss shared dependency changes.
- Ensure Docker build contexts and COPY instructions still work.
- Keep production deployment separate from ordinary test/build jobs.
- Do not deploy or change production infrastructure during this task.

## Phase 6 — Safe implementation

First present the inventory, proposed directory tree, and migration plan.

Then implement only the improvements that are justified by the audit.

Do not:
- Rewrite the applications.
- Change business logic or API contracts.
- Upgrade dependencies without a clear reason.
- Delete existing configuration or scripts before proving they are unused.
- Introduce Turborepo, Nx, or another orchestration framework without demonstrating a concrete benefit.
- Move files in a way that breaks Docker, Jenkins, Expo, or Go builds.

Run the available tests and builds after each significant change.

## Phase 7 — Final report

Report:
1. The original structure and its problems.
2. The final structure and rationale.
3. Every moved, added, or removed file.
4. All updated paths and configurations.
5. Test/build commands and actual results.
6. Remaining technical debt and recommended next steps.

Do not claim a successful build or deployment unless it was actually verified.