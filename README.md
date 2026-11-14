# Agricultural-Production-Optimization
Indian crop fertilizer growth

**AgriSmart** — a full-stack, AI-powered farm platform: crop recommendations from a
trained ML model with per-prediction SHAP explanations, yield forecasting, fertilizer
planning, farm & field management, an AI assistant (Claude + RAG + LangGraph), an
MCP tool server, an operations dashboard, batch jobs, real-time updates, a
load-balancing gateway and AWS deployment.

```mermaid
flowchart LR
  B[Browser<br/>React app · Dashboard] -->|REST · SSE · WebSocket| G[Gateway<br/>Nginx load balancer<br/>AWS ALB in the cloud]
  C[MCP clients<br/>Claude Code / Desktop] -->|streamable HTTP| G
  G -->|/api · least-conn| A[api × N<br/>FastAPI + AIML]
  G -->|/farm-api · /socket.io sticky| F[farm-service × N<br/>Express]
  G -->|/mcp · stateless| M[mcp × N<br/>AIML MCP server]
  G -->|/ :8080 · :8090| W[React app · Dashboard]
  A --> PG[(PostgreSQL)]
  A --> R[(Redis)] --> C2[worker<br/>Celery]
  A -->|Claude API| L[LLM]
  A --> ML[[AIML models<br/>Random Forest · XGB[Browser<br/>React app · Dashboard]ost · TreeSHAP]]
  M --> ML
  F --> MG[(MongoDB)]
  F -->|Socket.IO adapter| R
  F -->|fertilizer plan · retries| A
  A -.->|health probes| F & M
```

## Structure

| Folder | What it is | Stack |
|---|---|---|
| [Dashboard](Dashboard) | **Operations console**: AI Studio (live recommendations + SHAP), yield analytics, models, farms, assistant, MCP tools, live system health and a load probe | React 19, Vite, Tailwind CSS v4, TanStack Query, React Router, Recharts, Google Sans, Material Symbols |
| [frontend/react-app](frontend/react-app) | Public web app in plain **JavaScript (JSX)** | React 19, Vite, React Router, B[Browser<br/>React app · Dashboard]otstrap 5 + Sass, Redux Toolkit, Zustand, TanStack Query, Axios, Framer Motion, Socket.IO client, Vitest, Playwright |
| [backend/python-fastapi](backend/python-fastapi) | AI/ML API | FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL/SQLite, JWT + RBAC, WebSockets, SSE, Celery + Redis, Anthropic SDK, LangGraph, Qdrant, load shedding, prediction caches, Prometheus metrics |
| [backend/node-express](backend/node-express) | Farm management API | Express 5, MongoDB[Browser<br/>React app · Dashboard]+ Mongoose, Zod, JWT, Socket.IO (+ Redis adapter), AWS S3, helmet, rate limiting, pino |
| [AIML](AIML) | Models, explainability, RAG, agents and the **MCP server** | pandas, scikit-learn, XGB[Browser<br/>React app · Dashboard]ost, LightGBM, CatB[Browser<br/>React app · Dashboard]ost, PyTorch, SHAP, Optuna, MLflow, MCP |
| [infra](infra) | DevOps | Nginx gateway (load balancer), Docker Compose, Terraform (AWS: VPC, ECS Fargate, ALB, RDS, ElastiCache, S3, CloudFront) |
| [docs](docs) | Documentation | [architecture](docs/architecture.md) · [AWS deployment](docs/deploy-aws.md) · [syllabus coverage](docs/syllabus-coverage.md) |

## How the pieces connect

| From → to | How |
|---|---|
| B[Browser<br/>React app · Dashboard]owser → every service | One origin: the gateway (Docker) or the Vite dev proxy (local) routes `/api`, `/farm-api`, `/socket.io`, `/mcp` |
| FastAPI → AIML | Imports the `AIML` package: crop & yield model bundles, TreeSHAP attribution (`AIML/advanced_ml/attribution.py`), agent tools |
| MCP server → AIML | The same `AIML.agentic_ai.tools` functions, exposed as MCP tools |
| Express → FastAPI | Fertilizer plans via `callAgriApi` with retries + `Retry-After` handling |
| FastAPI → Express / MCP | Health probes for `GET /api/system/status` (the dashboard's service map) |
| Auth | FastAPI issues JWTs; Express and the dashboard use the same token |

## Run the complete local stack

Python 3.12+, Node 20+. MongoDB[Browser<br/>React app · Dashboard]on `127.0.0.1:27017` is optional — without it
everything runs and the farm pages report the database as unavailable.

```powershell
.\scripts\dev.ps1
```

| Service | URL |
|---|---|
| Operations dashboard | http://localhost:5180 |
| React web app | http://localhost:5175 |
| FastAPI docs (2 workers) | http://localhost:8000/docs |
| MCP server (2 workers) | http://localhost:8100/mcp |
| Express health | http://localhost:4100/health |

Logs go to `.devlogs/`; `.\scripts\stop-dev.ps1` stops everything the script
started. First-time setup:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/python-fastapi/requirements.txt
npm --prefix backend/node-express ci
npm --prefix frontend/react-app ci
npm --prefix Dashboard ci
```

Set `ANTHROPIC_API_KEY` in `backend/python-fastapi/.env` for Claude-backed assistant
answers; without it the assistant uses the local knowledge base and models.

## Run everything with Docker (load-balanced)

```powershell
docker compose up --build
```

| | |
|---|---|
| React web app | http://localhost:8080 |
| Operations dashboard | http://localhost:8090 |
| FastAPI docs | http://localhost:8080/docs |
| MCP endpoint | http://localhost:8080/mcp |

Compose runs PostgreSQL, Redis, MongoDB, a one-shot Alembic `migrate` job, **3 API
replicas** (2 workers each), a Celery worker, **2 MCP replicas**, **2 farm-service
replicas** and the two frontends, all behind the Nginx gateway. Scale any tier
live — the gateway re-resolves replicas every 10 s:

```powershell
docker compose up -d --scale api=5 --scale mcp=3 --scale farm-service=3
```

Set `JWT_SECRET` in `.env` to a random 32+ character value before exposing the
stack beyond your computer.

## Staying up under heavy load

| Layer | Mechanism |
|---|---|
| Gateway ([infra/nginx](infra/nginx)) | Least-connections balancing, passive health checks (a failing replica is skipped for 10 s), failover to another replica on connect errors/timeouts, per-IP rate limits (429), upstream keep-alive, micro-cache of read-only API responses served **stale** while replicas restart, JSON `503 + Retry-After` when nothing is healthy, sticky Socket.IO |
| FastAPI | Per-worker concurrency cap: excess requests get an immediate `503 + Retry-After` instead of queueing into timeouts ([resilience.py](backend/python-fastapi/app/core/resilience.py)); TTL + LRU prediction caches; models served single-threaded so throughput scales with workers (measured 65 → 25 ms per prediction, 15 → 26 req/s at 25 concurrent); background warm-up so cold workers never block requests; GZip; multi-worker uvicorn |
| MCP server | Stateless streamable HTTP — no sessions, so any replica answers any call |
| Express | Socket.IO Redis adapter for cross-replica events; retries to FastAPI honouring `Retry-After` |
| Dashboard | Retries with backoff + jitter, request timeouts, per-service circuit breakers, per-page error boundaries |
| Observability | `GET /api/system/status`, `/api/system/metrics`, Prometheus `GET /api/metrics`; every response carries `X-Served-By` |

The dashboard's **System health → Load probe** fires concurrent requests and shows
which replica answered each one.

## MCP server

```bash
python -m AIML.agentic_ai.mcp_server                                   # stdio (desktop clients)
python -m AIML.agentic_ai.mcp_server --transport http --port 8100      # stateless HTTP
claude mcp add --transport http agrismart http://localhost:8100/mcp
```

Tools: `recommend_crop`, `explain_crop` (TreeSHAP), `predict_yield`,
`fertilizer_plan`, `weather_forecast`, `search_knowledge`; resources:
`knowledge://{name}`.

## Tests

| Where | Command | What |
|---|---|---|
| backend/python-fastapi | `pytest` | 44 API tests: auth/JWT/RBAC, history, Celery jobs, WebSocket, model serving, RAG, agent loop, SHAP explanations, caching, load shedding, system status, warm-up |
| repository root | `pytest AIML/tests` | Algorithms, models, RAG, Hadoop, CV, agents, MCP tools over stdio and stateless HTTP, SHAP additivity |
| backend/node-express | `npm test` | Integration tests on real MongoDB[Browser<br/>React app · Dashboard](skipped without it) + DB-down behaviour |
| Dashboard | `npm test` | API client resilience (retry, Retry-After, circuit breaker), SSE parsing, every route renders with services down, icon subset, palette/CSS sync |
| frontend/react-app | `npm test` · `npm run test:e2e` | Vitest + Playwright |

CI ([ci.yml](.github/workflows/ci.yml)) runs all of them, applies the migrations to
PostgreSQL, smoke-tests the MCP server over HTTP, validates the Compose file and
checks the gateway config with `nginx -t`.

## Deploy to AWS

Terraform in [infra/aws/terraform](infra/aws/terraform) creates the whole platform,
and [deploy-aws.yml](.github/workflows/deploy-aws.yml) builds and rolls out images
on every push to `main`. Step-by-step guide: [docs/deploy-aws.md](docs/deploy-aws.md).
