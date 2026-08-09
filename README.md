# notes-api-devsecops

A production-grade Notes REST API with a full DevSecOps CI/CD pipeline built on GitHub Actions.

[![CI](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/ci.yml/badge.svg)](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/ci.yml)
[![CD](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/cd.yml/badge.svg)](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/cd.yml)
[![Deploy](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/deploy.yml/badge.svg)](https://github.com/ofurufu/notes-api-devsecops/actions/workflows/deploy.yml)

**Live API →** https://notes-api-devsecops.onrender.com

---

## What This Project Is

This is a CRUD REST API for managing notes, used as the foundation for a production-grade DevSecOps pipeline. The API itself is intentionally simple — the engineering focus is the pipeline: security gates, reusable components, Docker image publishing, and gated multi-environment deployments.

Every push to `main` runs through five automated stages before anything touches production:
lint → dependency audit → vulnerability scan → matrix tests → Docker build → GHCR push → staging deploy → approval gate → production deploy.

---

## Live API

**Base URL:** `https://notes-api-devsecops.onrender.com`

```bash
# Health check
curl https://notes-api-devsecops.onrender.com/health

# Get all notes
curl https://notes-api-devsecops.onrender.com/api/notes

# Create a note
curl -X POST https://notes-api-devsecops.onrender.com/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My Note", "content": "Hello from the pipeline"}'

# Update a note
curl -X PUT https://notes-api-devsecops.onrender.com/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated", "content": "Changed content"}'

# Delete a note
curl -X DELETE https://notes-api-devsecops.onrender.com/api/notes/1
```

> The free Render tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## API Reference

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | — |
| `GET` | `/api/notes` | Get all notes | — |
| `GET` | `/api/notes/:id` | Get a note by ID | — |
| `POST` | `/api/notes` | Create a note | `{ title, content? }` |
| `PUT` | `/api/notes/:id` | Update a note | `{ title, content? }` |
| `DELETE` | `/api/notes/:id` | Delete a note | — |

**Response shape (all endpoints):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My Note",
    "content": "Note content",
    "createdAt": "2025-01-15T10:23:41.123Z",
    "updatedAt": "2025-01-15T10:23:41.123Z"
  }
}
```

---

## Pipeline Architecture

```
git push origin main
        │
        ▼
┌─────────────────────────────────────────────────┐
│  CI                                             │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌───────────────┐   │
│  │  Lint   │  │  Audit  │  │ Security Scan │   │  ← parallel
│  │ ESLint  │  │npm audit│  │ Trivy + SARIF │   │
│  └────┬────┘  └────┬────┘  └──────┬────────┘   │
│       └────────────┼──────────────┘             │
│                    │ all pass                   │
│          ┌─────────┴──────────┐                 │
│          │                    │                 │
│     ┌────▼────┐          ┌────▼────┐            │  ← parallel
│     │  Test   │          │  Test   │            │
│     │ Node 20 │          │ Node 22 │            │
│     └─────────┘          └─────────┘            │
└─────────────────────────────────────────────────┘
        │ CI passes
        ▼
┌─────────────────────────────────────────────────┐
│  CD                                             │
│                                                 │
│  Login GHCR                                     │
│       │                                         │
│  Build Docker image (multi-stage, Alpine)       │
│       │                                         │
│  Tag: sha-xxxxxxx + latest                      │
│       │                                         │
│  Push → ghcr.io/ofurufu/notes-api-devsecops     │
└─────────────────────────────────────────────────┘
        │ CD passes
        ▼
┌─────────────────────────────────────────────────┐
│  Deploy                                         │
│                                                 │
│  Resolve image tag (sha-xxxxxxx)                │
│       │                                         │
│  ┌────▼──────────────────────────┐              │
│  │ staging environment           │ ← auto       │
│  │ pull → run → smoke tests ✅   │              │
│  └────┬──────────────────────────┘              │
│       │                                         │
│  ┌────▼──────────────────────────┐              │
│  │ ⏸ Approval gate              │ ← manual     │
│  │ required reviewer must approve│              │
│  └────┬──────────────────────────┘              │
│       │                                         │
│  ┌────▼──────────────────────────┐              │
│  │ production environment        │ ← gated      │
│  │ pull → run → smoke tests ✅   │              │
│  └───────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

---

## Repository Structure

```
notes-api-devsecops/
│
├── .github/
│   ├── actions/
│   │   └── setup-node-app/
│   │       └── action.yml          # Composite action: Node.js setup + npm ci
│   │
│   └── workflows/
│       ├── ci.yml                  # CI entry point (push + PR trigger)
│       ├── reusable-ci.yml         # Reusable: lint + audit + trivy + matrix test
│       ├── cd.yml                  # CD: Docker build + GHCR push
│       └── deploy.yml              # Deploy: staging → approval → production
│
├── src/
│   ├── app.js                      # Express app (routes, middleware, error handler)
│   ├── server.js                   # Entry point with graceful SIGTERM shutdown
│   └── routes/
│       └── notes.js                # CRUD handlers + in-memory store
│
├── tests/
│   ├── health.test.js              # Health and 404 tests
│   └── notes.test.js               # Full CRUD coverage (22 tests)
│
├── Dockerfile                      # Multi-stage: deps + runner, non-root user
├── .dockerignore
├── .trivyignore                    # Documented CVE suppressions
├── eslint.config.mjs               # ESLint v9 flat config
└── package.json
```

---

## Pipeline Components

### Composite Action — `.github/actions/setup-node-app`

Packages Node.js setup and `npm ci` into a single reusable step. Called by every job in `reusable-ci.yml` that needs the application installed. Each calling job checks out the repository first (mandatory — the composite action file must exist on disk before it can be referenced).

### Reusable Workflow — `reusable-ci.yml`

Contains four jobs called by `ci.yml`:

| Job | What it does |
|-----|-------------|
| `lint` | ESLint with `--max-warnings=0` — zero tolerance |
| `audit` | `npm audit --audit-level=high` — blocks on High/Critical CVEs |
| `security-scan` | Trivy filesystem scan, uploads SARIF to Security tab |
| `test` | Jest with coverage across Node 20 and 22 matrix |

`test` depends on all three security/quality gates. If any gate fails, tests are skipped.

### Docker Image

- **Base:** `node:20-alpine` (~50MB vs ~900MB for full Node image)
- **Build:** Multi-stage — production image contains only runtime dependencies
- **Security:** Non-root user (`nodeuser`, uid 1001)
- **Health check:** Docker `HEALTHCHECK` on `/health` endpoint
- **Registry:** `ghcr.io/ofurufu/notes-api-devsecops`
- **Tags:** `sha-<7-char-sha>` (immutable) + `latest` (most recent main)

### Environments

| Environment | Trigger | Protection |
|-------------|---------|------------|
| `staging` | Automatic after CD passes | None — auto-deploys |
| `production` | After staging passes | Required reviewer approval |

---

## Security

- **Dependency scanning:** `npm audit` on every CI run, blocks at High severity
- **Vulnerability scanning:** Trivy scans the filesystem on every CI run
- **SARIF upload:** Trivy results appear in **Security → Code scanning** tab
- **Least privilege:** Every workflow and job declares only the permissions it needs
- **No stored cloud credentials:** GHCR authentication via `GITHUB_TOKEN` (auto-generated per run, expires after run)
- **Branch protection:** `main` requires CI to pass and PR review before merging
- **Non-root container:** Application runs as `nodeuser`, not root

---

## Running Locally

**Prerequisites:** Node.js 20+, Docker

```bash
# Clone
git clone https://github.com/ofurufu/notes-api-devsecops.git
cd notes-api-devsecops

# Install dependencies
npm ci

# Run the API
npm start
# → http://localhost:3000

# Run tests with coverage
npm test

# Lint
npm run lint

# Build and run with Docker
docker build -t notes-api:local .
docker run -p 3000:3000 notes-api:local

# Pull from GHCR
docker pull ghcr.io/ofurufu/notes-api-devsecops:latest
docker run -p 3000:3000 ghcr.io/ofurufu/notes-api-devsecops:latest
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Testing | Jest + Supertest (22 tests, >94% coverage) |
| Linting | ESLint v9 (flat config) |
| Containerisation | Docker (multi-stage, Alpine) |
| Registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |
| Security scanning | npm audit + Trivy |
| Hosting | Render (free tier) |

---

## What I Learned Building This

This project was built as a hands-on DevSecOps learning exercise covering:

- GitHub Actions workflow anatomy and the four-layer hierarchy (Workflow → Job → Step → Action)
- Reusable pipeline components — composite actions and reusable workflows
- Matrix builds across Node.js versions with `fail-fast: false`
- Dependency and vulnerability scanning integrated as CI gates
- Multi-stage Docker builds with security best practices
- GHCR image publishing using `GITHUB_TOKEN` (no stored credentials)
- GitHub Environments with required reviewer approval gates
- Debugging real pipeline errors: composite action checkout ordering, dynamic expressions in reusable workflow inputs, Docker Hub rate limiting, GHCR permission scopes

---

## Author

**Ayodele Adewuyi** — AWS Cloud Engineer (in the making)

[GitHub](https://github.com/ofurufu)
