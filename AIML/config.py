"""Shared paths and constants for the ML pipeline."""
import os
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "datasets" / "crop_data.csv"
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

# Serving artefacts read by the FastAPI backend.
MODEL_BUNDLE_PATH = MODELS_DIR / "crop_model.joblib"
METRICS_PATH = MODELS_DIR / "metrics.json"
TORCH_MODEL_PATH = MODELS_DIR / "crop_mlp.pt"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET = "label"
RANDOM_STATE = 42
TEST_SIZE = 0.2

# MLflow: a local SQLite store enables the model registry without a server.
# Point MLFLOW_TRACKING_URI at a tracking server (e.g. http://mlflow:5000) in Docker.
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", f"sqlite:///{(ML_DIR / 'mlflow.db').as_posix()}")
MLFLOW_ARTIFACT_ROOT = (ML_DIR / "mlruns").as_uri()
EXPERIMENT_NAME = "crop-recommendation"
REGISTERED_MODEL_NAME = "crop-recommender"
