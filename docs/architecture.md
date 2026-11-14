# Architecture

## Services and why they are split

| Service | Owns | Why this technology |
|---|---|---|
| **web** (React app, `frontend/react-app`) | UI and tools | Vite SPA served as static files; calls `/api` and `/farm-api` through the gateway/ALB |
| **api** (FastAPI) | Users & auth, predictions, batch jobs, ML serving, AI assistant | ML and AI libraries are Python-first; Pydantic gives typed validation and OpenAPI docs for free. |
| **worker** (Celery) | Batch recommendations, model retraining | Long work leaves the request path; Redis is the broker. |
| **farm-service** (Express) | Farms, fields, activity logs, photos | Flexible documents (activities, photos, GeoJSON) fit MongoDB; Socket.IO pushes changes to open tabs. |

**Two databases, on purpose.** Users, predictions and jobs are relational
(foreign keys, joins, aggregates, migrations) → PostgreSQL. Farm data is
document-shaped and grows freely (nested soil readings, photo lists, activity
types) → MongoDB.

## Authentication flow

1. `POST /api/auth/register` or `POST /api/auth/token` (OAuth 2.0 password grant) on FastAPI.
2. FastAPI signs an HS256 **JWT** (`sub`, `email`, `role`, `iss`, `aud`, `exp`).
3. The browser sends `Authorization: Bearer <jwt>` to **both** services; the Node
   service verifies the same signature, issuer and audience with the shared `JWT_SECRET`.
4. Socket.IO connections pass the token in the handshake; each socket joins the
   private room `user:<id>`.
5. **RBAC**: the first account is `admin`; admin-only endpoints (`/api/admin/users`,
   `/api/ml/reload`, `/api/ml/retrain`) use `require_role("admin")`.

## Request flows

**Crop recommendation**: browser → `POST /api/recommend/crop` → model bundle
(`AIML/models/crop_model.joblib`, best of Logistic Regression / Random Forest /
XGBoost) → top-3 crops. Signed-in users' requests are stored in `predictions`.

**Live what-if**: browser ↔ `WS /api/ws/recommend`; every slider move sends the
readings and receives a fresh ranking (inference runs in a thread pool).

**Batch job**: CSV → `POST /api/jobs/batch-csv` → `batch_jobs` row (queued) →
Celery task → all predictions and the job result are written in **one transaction**.

**Fertilizer plan for a field**: browser → farm-service → (service-to-service
HTTP) FastAPI `/recommend/fertilizer` → doses of DAP / Urea / MOP.

**Field photo**: browser asks farm-service for a **presigned S3 PUT URL** →
uploads directly to S3 → records the key; photos are served via CloudFront.

**AI assistant** (`POST /api/assistant/chat`, Server-Sent Events):

```
START → agent (Claude, streamed tokens) ──tool_use──► tools ──► agent … ──► END
                                   └─ step limit / cut-off ─► close (answer pending calls) ─► END
```

* Tools: `recommend_crop`, `fertilizer_plan`, `get_crop_profile`, `search_knowledge`.
* **RAG**: knowledge base (`backend/app/ai/knowledge/*.md`) chunked by section →
  embeddings (Hugging Face sentence-transformers, or TF-IDF offline) → Qdrant →
  hybrid search (vector + keyword rerank) → passages cited as `[source]`.
* **Guardrails**: message length limit, topic restriction in the system prompt,
  max 6 model steps per question, Pydantic validation of every tool input,
  refusal handling with server-side model fallback, conversation length cap.
* **Memory**: LangGraph checkpointer keeps each thread's history (short-term memory).
* Without an API key the endpoint still works and returns retrieval-only answers.

## SQL schema (PostgreSQL)

```
users(id PK, email UNIQUE, full_name, hashed_password[argon2], role, created_at)
predictions(id PK, user_id FK→users ON DELETE CASCADE, N,P,K,temperature,humidity,ph,rainfall,
            top_crop [index], confidence, method, source, created_at,
            INDEX(user_id, created_at))
batch_jobs(id PK uuid, user_id FK→users [index], status, total_rows, result JSON, error,
           created_at, finished_at)
```

Migrations: `backend/migrations` (Alembic). CI applies them to PostgreSQL and runs
`alembic check` to prove the models and migrations agree.

## MongoDB collections

`farms` (owner, name, GeoJSON point · unique(owner, name) · 2dsphere),
`fields` (farm, crop, season, area, status, soil, photos[] · index(farm, createdAt)),
`activities` (field, type, quantity, date · index(field, date)).
The farm summary uses an aggregation pipeline with `$facet` and `$lookup`;
deleting a farm removes its fields and activities in a transaction.

## ML lifecycle (MLOps)

1. `python -m AIML.data.download`: public dataset, SHA-256 pinned, schema-validated.
2. `python -m AIML.eda.crop_eda`: statistics, correlations and plots → `AIML/reports/`.
3. `python -m AIML.machine_learning.crop_classifier`: 5-fold CV + held-out test for 3 scikit-learn/XGBoost
   models + a PyTorch MLP; every run logged to **MLflow**; the best model is
   registered as `crop-recommender` and saved as the serving bundle.
4. `python -m AIML.advanced_ml.tuning`: **Optuna** search for XGBoost (each trial an MLflow run).
5. `python -m AIML.advanced_ml.explain`: **SHAP** feature importance.
6. Serving reloads without a restart: `POST /api/ml/reload`; `POST /api/ml/retrain`
   runs training on the Celery worker.

## Scaling notes (system design)

* All services are stateless → scale horizontally behind the load balancer
  (ECS auto-scales the API on CPU).
* Socket.IO across several farm-service tasks: sticky sessions on the ALB today;
  add the Redis adapter (`@socket.io/redis-adapter`) to fan out events across tasks.
* LangGraph's in-memory checkpointer is per-process; use a Postgres checkpointer
  for multi-instance assistant memory.
* Read-heavy reference data is micro-cached by the gateway and cached in the browser by TanStack Query.
