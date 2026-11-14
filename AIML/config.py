"""Shared paths and constants for the AIML package.

Run any module from the repository root, e.g. `python -m AIML.machine_learning.yield_regression`.
"""

import os
from pathlib import Path

AIML_DIR = Path(__file__).resolve().parent
REPO_ROOT = AIML_DIR.parent
DATASETS_DIR = AIML_DIR / "datasets"
MODELS_DIR = AIML_DIR / "models"
REPORTS_DIR = AIML_DIR / "reports"

# --- Datasets (downloaded by `python -m AIML.data.download`) ---------------
DATA_PATH = DATASETS_DIR / "crop_data.csv"  # crop recommendation (2,200 rows, 22 crops)
YIELD_DATA_PATH = DATASETS_DIR / "crop_yield.csv"  # Indian state crop yield 1997-2020 (19,689 rows)
WEATHER_DATA_PATH = DATASETS_DIR / "weather_ludhiana.csv"  # daily ERA5 weather from Open-Meteo
YIELD_DB_PATH = DATASETS_DIR / "agri_warehouse.db"  # SQLite warehouse built by the ETL

# --- Crop recommendation ------------------------------------------------------
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET = "label"
RANDOM_STATE = 42
TEST_SIZE = 0.2

# --- Serving artefacts read by the FastAPI backend ---------------------------
MODEL_BUNDLE_PATH = MODELS_DIR / "crop_model.joblib"
METRICS_PATH = MODELS_DIR / "metrics.json"
TORCH_MODEL_PATH = MODELS_DIR / "crop_mlp.pt"
YIELD_MODEL_PATH = MODELS_DIR / "yield_model.joblib"
YIELD_METRICS_PATH = MODELS_DIR / "yield_metrics.json"
INTENT_MODEL_PATH = MODELS_DIR / "intent_model.joblib"

# --- MLflow ------------------------------------------------------------------
# A local SQLite store enables the model registry without a server.
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", f"sqlite:///{(AIML_DIR / 'mlflow.db').as_posix()}")
MLFLOW_ARTIFACT_ROOT = (AIML_DIR / "mlruns").as_uri()
EXPERIMENT_NAME = "crop-recommendation"
REGISTERED_MODEL_NAME = "crop-recommender"
YIELD_EXPERIMENT_NAME = "yield-prediction"

# Knowledge base shared with the FastAPI assistant (RAG)
KNOWLEDGE_DIR = REPO_ROOT / "backend" / "python-fastapi" / "app" / "ai" / "knowledge"
