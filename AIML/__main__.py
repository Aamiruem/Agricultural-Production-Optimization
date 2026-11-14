"""AIML command line — which technology powers which part of the web app.

    python -m AIML            status: every technology, its trained artefact, and where the app uses it
    python -m AIML train      retrain the models the web app serves, then refresh the browser fallbacks
    python -m AIML serve      start the FastAPI service that loads these models (http://localhost:8000)
    python -m AIML mcp        start the MCP tool server (stdio; add --http for http://localhost:8100/mcp)

You never need to run AIML for the web app to work: FastAPI imports this package
and serves the trained models in AIML/models. Run `train` only to rebuild them.
"""

from __future__ import annotations

import argparse
import importlib.util
import os
import subprocess
import sys
from pathlib import Path

from AIML.config import DATA_PATH, MODELS_DIR, REPO_ROOT, YIELD_DATA_PATH

FRONTEND_GENERATED = REPO_ROOT / "frontend" / "react-app" / "src" / "data" / "generated"
API_DIR = REPO_ROOT / "backend" / "python-fastapi"

# name, artefact (None = no file), how it is used by the app (API endpoint → page)
TECHNOLOGIES = [
    (
        "Crop recommendation · Random Forest / XGBoost",
        MODELS_DIR / "crop_model.joblib",
        "POST /api/recommend/crop, WS /api/ws/recommend → Crop advisor, Dashboard AI Studio",
    ),
    (
        "Explainable AI · TreeSHAP (advanced_ml/attribution.py)",
        None,
        "POST /api/ml/explain → Dashboard AI Studio 'Why this crop?'",
    ),
    (
        "Yield prediction · XGBoost regression",
        MODELS_DIR / "yield_model.joblib",
        "POST /api/yield/predict → Yield forecast, Dashboard Yield analytics",
    ),
    (
        "Model leaderboards (metrics)",
        MODELS_DIR / "metrics.json",
        "GET /api/ml/model, /api/ml/yield-model → Model insights, Dashboard Models",
    ),
    ("Yield analytics dataset", YIELD_DATA_PATH, "GET /api/yield/trend, /api/yield/coverage → Dashboard, Yield pages"),
    ("RAG knowledge search (rag/pipeline.py)", None, "POST /api/assistant/search, /chat → AI assistant"),
    ("Agents + MCP tools (agentic_ai/)", None, "MCP server :8100/mcp → Dashboard MCP tools, Claude clients"),
    ("Intent classifier · TF-IDF (nlp/)", MODELS_DIR / "intent_model.joblib", "multi-agent supervisor routing"),
    (
        "Browser fallback models (scripts/export_browser_models.py)",
        FRONTEND_GENERATED / "recommendModel.json",
        "React app tools when the API is offline (e.g. Vercel)",
    ),
]

# Teaching / experiment modules: run them directly, they are not served.
EXPERIMENTS = {
    "EDA": "AIML.eda.crop_eda, AIML.eda.yield_eda",
    "Classic ML": "AIML.machine_learning.clustering",
    "Advanced ML": "AIML.advanced_ml.boosting / tuning / imbalanced / explain",
    "Deep learning (PyTorch)": "AIML.deep_learning.torch_mlp / cnn / sequence_models / attention",
    "Computer vision": "AIML.computer_vision.leaf_analysis / train_classifier / yolo_detect",
    "NLP": "AIML.nlp.word2vec / sentiment / bert_finetune",
    "Big data": "AIML.big_data.spark_job, AIML.big_data.hadoop.run_local",
    "Generative AI": "AIML.generative_ai.prompting / lora_finetune",
}


def _torch_status() -> str:
    if importlib.util.find_spec("torch") is None:
        return "not installed (deep-learning experiments only; the web app does not need it)"
    try:
        import torch  # noqa: F401
    except OSError:
        return (
            "blocked by Windows Smart App Control (unsigned torch DLL) — deep-learning experiments "
            "only; the web app does not need it"
        )
    return "available"


def status() -> int:
    print("AIML technologies used by the web app\n")
    for name, artefact, used_by in TECHNOLOGIES:
        if artefact is None:
            mark = "code "
        else:
            mark = "ready" if artefact.exists() else "MISSING"
        print(f"  [{mark:7s}] {name}\n            used by: {used_by}")
        if artefact is not None and not artefact.exists():
            print("            fix: python -m AIML train")
    print("\nExperiments and coursework (run with `python -m <module>`):")
    for area, modules in EXPERIMENTS.items():
        print(f"  {area:24s} {modules}")
    print(f"\nPyTorch: {_torch_status()}")
    return 0


def _run(args: list[str], cwd: Path = REPO_ROOT) -> None:
    print(f"\n▶ {' '.join(args)}", flush=True)
    env = {**os.environ, "PYTHONPATH": str(REPO_ROOT)}
    subprocess.run([sys.executable, *args], cwd=cwd, env=env, check=True)


def train() -> int:
    if not (DATA_PATH.exists() and YIELD_DATA_PATH.exists()):
        _run(["-m", "AIML.data.download", "crop", "yield"])
    _run(["-m", "AIML.machine_learning.crop_classifier"])
    _run(["-m", "AIML.machine_learning.yield_regression"])
    _run(["-m", "AIML.nlp.intent_classifier"])
    _run(["scripts/export_browser_models.py"])
    print("\nDone. Restart the API (or POST /api/ml/reload as admin) to serve the new models.")
    return 0


def serve(port: int) -> int:
    _run(["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)], cwd=API_DIR)
    return 0


def mcp(http: bool, port: int) -> int:
    from AIML.agentic_ai import mcp_server

    mcp_server.main(["--transport", "http", "--port", str(port)] if http else ["--transport", "stdio"])
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m AIML", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("status", help="show technologies, artefacts and where the app uses them")
    sub.add_parser("train", help="retrain the served models and browser fallbacks")
    p_serve = sub.add_parser("serve", help="start the FastAPI service")
    p_serve.add_argument("--port", type=int, default=8000)
    p_mcp = sub.add_parser("mcp", help="start the MCP tool server")
    p_mcp.add_argument("--http", action="store_true", help="streamable HTTP instead of stdio")
    p_mcp.add_argument("--port", type=int, default=8100)
    args = parser.parse_args(argv)

    try:
        if args.command == "train":
            return train()
        if args.command == "serve":
            return serve(args.port)
        if args.command == "mcp":
            return mcp(args.http, args.port)
        return status()
    except subprocess.CalledProcessError as exc:
        print(f"\nStep failed with exit code {exc.returncode}: {' '.join(map(str, exc.cmd))}", file=sys.stderr)
        return exc.returncode
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
