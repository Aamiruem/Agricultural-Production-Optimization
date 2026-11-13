# Agricultural-Production-Optimization
Indian crop fertilizer growth

Full-stack project for optimizing agricultural production with machine learning.

## Structure

| Folder | Contents |
|---|---|
| `frontend/react-app` | React + Vite UI |
| `backend` | FastAPI REST API |
| `ml` | Datasets, notebooks, preprocessing and training scripts |
| `docs` | Project documentation |

## Getting started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API runs at http://localhost:8000 (docs at `/docs`).

### Frontend
```bash
cd frontend/react-app
npm install
npm run dev
```
UI runs at http://localhost:5173 (the backend allows CORS from this origin).

### ML
Place your dataset at `ml/datasets/crop_data.csv`, then:
```bash
python ml/train.py
```
