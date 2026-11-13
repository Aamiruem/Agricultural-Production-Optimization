# Agricultural-Production-Optimization
Indian crop fertilizer growth

Full-stack project for optimizing agricultural production with machine learning:
crop recommendations from soil and climate readings, fertilizer dose planning,
a crop library and a farm planner.

## Structure

| Folder | Contents |
|---|---|
| `frontend/web` | **Next.js 16 + TypeScript** app (Tailwind, shadcn/ui, MUI, Redux Toolkit, Zustand, TanStack Query, React Hook Form, Zod, Framer Motion, Sass; Vitest, Jest, Playwright). See [frontend/web/README.md](frontend/web/README.md) for where each technology is used. |
| `frontend/react-app` | Original Vite + React starter template (superseded by `frontend/web`) |
| `backend` | FastAPI REST API + pytest tests |
| `ml` | Datasets, notebooks, preprocessing and training scripts |
| `docs` | Project documentation |

## Getting started

### 1. Backend (port 8000)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest                        # run API tests
```
API docs: http://localhost:8000/docs. CORS allows `http://localhost:3000` by default.
Set `CORS_ORIGINS` (comma-separated) to change it.

### 2. Frontend (port 3000)
```bash
cd frontend/web
npm install
npm run dev
```

### 3. ML (optional)
Place your dataset at `ml/datasets/crop_data.csv`, then:
```bash
python ml/train.py
```
When `ml/models/crop_model.joblib` exists, the API uses it for crop
recommendations (`"method": "ml-model"`). Until then it ranks crops by how
closely the readings match each crop's reference profile (`"profile-similarity"`).

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/crops?season=rabi` | Crop profiles (optionally by season) |
| GET | `/api/crops/{name}` | One crop's ideal conditions |
| POST | `/api/recommend/crop?top=3` | Top crops for N, P, K, temperature, humidity, ph, rainfall |
| POST | `/api/recommend/fertilizer` | Nutrient gaps + DAP / Urea / MOP doses for a crop and field area |
