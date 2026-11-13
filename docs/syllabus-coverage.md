# Syllabus coverage

Where each topic from the full-stack and AI/ML syllabus is used in this project.
"Not used" items are deliberate: one project can't sensibly use every framework,
and the syllabus itself recommends learning one deeply and understanding the others.

## Frontend

| Topic | Where |
|---|---|
| HTML5 semantic, accessibility | landmarks, labelled forms, `aria-live` results, keyboard-usable controls throughout `frontend/web/src` |
| CSS3, Flexbox, Grid, responsive | every page; mobile nav row in `site-header.tsx` |
| Sass | `components/hero.module.scss` |
| Tailwind CSS | all components; theme tokens in `app/globals.css` |
| JavaScript (ES6+) | `services/farm-service` (plain JS, ES modules) |
| TypeScript | the whole web app; API types in `lib/api/types.ts` |
| React (hooks, components) | all of `src/components` |
| Next.js: SSR / SSG / ISR / SEO | `app/crops/page.tsx` (SSR), `app/crops/[name]` (SSG + ISR), `metadata`, `sitemap.ts`, `robots.ts` |
| State: Context API / Redux Toolkit / Zustand | `context/theme-context.tsx` / `store/fields-slice.ts` / `store/history-store.ts`, `store/auth-store.ts` |
| Fetch / Axios / TanStack Query | `lib/api/server.ts` / `lib/api/client.ts` / every data hook |
| React Hook Form + Zod | all forms; schemas in `lib/validation.ts` |
| shadcn/ui, Material UI | `components/ui/*`; MUI tables, selects, sliders, dialog |
| Framer Motion | hero, results, planner list |
| Authentication (frontend) | `components/auth/*`, token interceptor in `lib/api/client.ts` |
| Jest / Vitest / Playwright | `tests/jest`, `src/**/*.test.ts(x)`, `e2e/` |

## Backend

| Topic | Where |
|---|---|
| Node.js + Express.js | `services/farm-service` |
| Python + FastAPI | `backend/app` |
| REST API | both services; OpenAPI docs at `/docs` |
| JWT, OAuth 2.0 password flow | `backend/app/core/security.py`, `api/routes/auth.py`; verified in Node `middleware/auth.js` |
| RBAC | `backend/app/api/deps.py` (`require_role`) |
| Validation: Zod / Pydantic | `farm-service/src/validators`, `backend/app/schemas` |
| WebSockets / Socket.IO | `backend/app/api/routes/realtime.py` / `farm-service/src/services/realtime.js` |
| Server-Sent Events | assistant streaming (`api/routes/assistant.py`, `lib/api/sse.ts`) |
| Background jobs: Celery | `backend/app/tasks` |
| MVC / Clean Architecture / microservices | farm-service = models/controllers/routes; backend = routes → services → repositories → db; two services communicating over HTTP |
| Security: OWASP basics | Argon2 password hashing, timing-safe login, helmet, CORS allow-lists, rate limiting, input validation everywhere, ownership checks (no IDOR), open-redirect guard on login, no raw HTML from the LLM, secrets only from env/Secrets Manager |

## Database & storage

| Topic | Where |
|---|---|
| SQL, PostgreSQL, SQLite | `backend/app/db`; SQLite locally, PostgreSQL in Docker/CI/AWS |
| ORM: SQLAlchemy | models + repositories |
| Joins, GROUP BY, indexes | `repositories/users.py` (LEFT JOIN report), `repositories/predictions.py`, composite index in `db/models.py` |
| Transactions | batch job writes (`tasks/jobs.py`); MongoDB farm delete (`utils/transaction.js`) |
| Normalization | 3NF schema (users / predictions / batch_jobs) |
| Migrations | Alembic, `backend/migrations` |
| MongoDB + Mongoose | farm-service models, aggregation `$facet` + `$lookup` |
| Redis | Celery broker (Docker/AWS) |
| AWS S3 (+ CloudFront) | presigned uploads `storage.service.js`, Terraform `data.tf` |

## DevOps & cloud

| Topic | Where |
|---|---|
| Git, GitHub, pull requests | repository + CI on every PR |
| Docker, Docker Compose | `*/Dockerfile`, `docker-compose.yml` |
| Nginx, SSL | `infra/nginx/nginx.conf` (TLS block), ALB + ACM on AWS |
| CI/CD: GitHub Actions | `.github/workflows/ci.yml`, `deploy-aws.yml` |
| AWS | Terraform: VPC, ECS Fargate, ALB, RDS, ElastiCache, S3, CloudFront, ECR, Secrets Manager, IAM OIDC, CloudWatch |
| Monitoring & logging | structured logs with request IDs (FastAPI), pino (Node), CloudWatch + Container Insights |

## AI / ML

| Topic | Where |
|---|---|
| NumPy, pandas | `ml/` throughout |
| EDA & visualization (Matplotlib) | `ml/eda.py`, `ml/explain.py` |
| Classification: Logistic Regression, Random Forest | `ml/train.py` |
| Boosting: XGBoost | `ml/train.py`, `ml/tune.py` |
| Cross-validation, metrics (precision, recall, F1, confusion matrix) | `ml/train.py` → `metrics.json`, Insights page |
| Hyperparameter tuning: Optuna | `ml/tune.py` |
| Explainability: SHAP | `ml/explain.py` |
| Deep learning: PyTorch (MLP, backprop, early stopping) | `ml/models/torch_mlp.py` |
| Embeddings, vector DB (Qdrant), hybrid search, RAG | `backend/app/ai/rag.py` |
| Hugging Face | sentence-transformers embeddings (`requirements-ai.txt`) |
| LLM API (Claude), streaming, tool calling | `backend/app/ai/agent.py` |
| Agentic AI: LangGraph, tools, memory, guardrails | `backend/app/ai/agent.py` |
| MLOps: MLflow tracking + model registry, model serving, retraining jobs | `ml/train.py`, `services/recommender.py`, `tasks/jobs.py` |

## Not used here (and what to use them for)

* **Django, Flask, NestJS, Fastify**: alternative backend frameworks; FastAPI and Express cover the same concepts.
* **GraphQL, gRPC**: useful when many clients need flexible queries (GraphQL) or for high-throughput service-to-service calls (gRPC).
* **Kubernetes**: ECS Fargate gives managed containers without running a cluster; the same images run on EKS.
* **Airflow / Prefect / Kubeflow, Ray, KServe/BentoML, Evidently, DVC**: worth adding as data volume and the team grow (scheduled retraining, distributed training, drift monitoring, dataset versioning).
* **Computer vision (OpenCV/YOLO), NLP fine-tuning (BERT/LoRA)**: a natural next feature is crop-disease detection from the uploaded field photos.
