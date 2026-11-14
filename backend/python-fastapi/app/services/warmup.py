"""Warm a worker in the background right after it starts.

Loading the model bundles, importing XGBoost/SHAP and parsing the analytics CSV
takes several seconds on a cold process. Doing it in a daemon thread at startup
means the first real user request doesn't pay that cost, while the worker still
answers health checks immediately (so the load balancer isn't kept waiting).
Each step is independent and best-effort: a failure is recorded, never raised.
"""
from __future__ import annotations

import logging
import threading
import time

logger = logging.getLogger("agrioptima.warmup")
_state: dict = {"status": "pending", "steps": {}, "seconds": None}


def _crop_model():
    from app.services.recommender import get_bundle

    return get_bundle() is not None


def _explainer():
    from app.services.recommender import get_bundle

    bundle = get_bundle()
    if bundle is None:
        return False
    from AIML.advanced_ml.attribution import explain_crop

    explain_crop(bundle, {"N": 90, "P": 42, "K": 43, "temperature": 20.8, "humidity": 82, "ph": 6.5, "rainfall": 202}, top=1)
    return True


def _yield_model():
    from AIML.agentic_ai.tools import _bundle, _typical_areas
    from AIML.config import YIELD_MODEL_PATH

    if not YIELD_MODEL_PATH.exists():
        return False
    _bundle(str(YIELD_MODEL_PATH))
    _typical_areas()
    return True


def _analytics():
    from app.api.routes.yield_analytics import _records

    return len(_records()) > 0


STEPS = {"crop_model": _crop_model, "explainer": _explainer, "yield_model": _yield_model, "analytics": _analytics}


def _run() -> None:
    started = time.perf_counter()
    _state["status"] = "running"
    for name, step in STEPS.items():
        try:
            _state["steps"][name] = "ready" if step() else "skipped"
        except Exception as exc:  # optional dependency missing, model absent, …
            _state["steps"][name] = f"failed: {type(exc).__name__}"
            logger.warning("warm-up step %s failed: %s", name, exc)
    _state["seconds"] = round(time.perf_counter() - started, 2)
    _state["status"] = "done"
    logger.info("worker warm-up finished in %ss: %s", _state["seconds"], _state["steps"])


def start_warmup() -> None:
    if _state["status"] == "pending":
        threading.Thread(target=_run, name="warmup", daemon=True).start()


def warmup_state() -> dict:
    return {**_state, "steps": dict(_state["steps"])}
