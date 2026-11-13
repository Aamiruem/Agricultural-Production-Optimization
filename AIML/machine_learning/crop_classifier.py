"""Train and compare crop-recommendation models, tracked with MLflow.

    python -m AIML.data.download   # once
    python -m AIML.machine_learning.crop_classifier                   # train + compare + save best
    mlflow ui --backend-store-uri sqlite:///ml/mlflow.db   # browse runs

Candidates: Logistic Regression, Random Forest, XGBoost (5-fold CV + test
set) and a PyTorch MLP (test set). The best scikit-learn-compatible model by
cross-validated macro-F1 is saved as a bundle the FastAPI backend serves, and
registered in the MLflow model registry.
"""
import argparse
import json
from datetime import datetime, timezone

import joblib
import mlflow
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from AIML.config import (
    EXPERIMENT_NAME,
    FEATURES,
    METRICS_PATH,
    MLFLOW_ARTIFACT_ROOT,
    MLFLOW_TRACKING_URI,
    MODEL_BUNDLE_PATH,
    MODELS_DIR,
    RANDOM_STATE,
    REGISTERED_MODEL_NAME,
    TORCH_MODEL_PATH,
)
from AIML.preprocessing.features import Split, load_dataset, split_dataset


# Types skops must be told to trust when MLflow saves each model. XGBoost
# isn't skops-serialisable, so it is logged with cloudpickle instead (None).
SKOPS_TRUSTED_TYPES: dict[str, list[str] | None] = {
    "logistic_regression": [],
    "random_forest": ["sklearn.tree._tree.Tree"],
    "xgboost": None,
}


def candidate_models() -> dict[str, Pipeline]:
    """Every candidate is a plain scikit-learn Pipeline so it pickles without custom code."""
    return {
        "logistic_regression": Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, C=10.0)),
        ]),
        "random_forest": Pipeline([
            ("clf", RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE, n_jobs=-1)),
        ]),
        "xgboost": Pipeline([
            ("clf", XGBClassifier(
                n_estimators=300, max_depth=6, learning_rate=0.1, subsample=0.9,
                colsample_bytree=0.9, tree_method="hist", eval_metric="mlogloss",
                random_state=RANDOM_STATE, n_jobs=-1,
            )),
        ]),
    }


def test_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        "test_accuracy": accuracy_score(y_true, y_pred),
        "test_f1_macro": f1_score(y_true, y_pred, average="macro"),
        "test_precision_macro": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "test_recall_macro": recall_score(y_true, y_pred, average="macro", zero_division=0),
    }


def evaluate_sklearn(name: str, model: Pipeline, split: Split, cv_folds: int) -> tuple[Pipeline, dict]:
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=RANDOM_STATE)
    scores = cross_validate(
        clone(model), split.X_train, split.y_train, cv=cv,
        scoring={"accuracy": "accuracy", "f1_macro": "f1_macro"},
    )
    fitted = clone(model).fit(split.X_train, split.y_train)
    metrics = {
        "cv_accuracy_mean": float(scores["test_accuracy"].mean()),
        "cv_f1_macro_mean": float(scores["test_f1_macro"].mean()),
        "cv_f1_macro_std": float(scores["test_f1_macro"].std()),
        **test_metrics(split.y_test, fitted.predict(split.X_test)),
    }
    mlflow.log_params({"model": name, "cv_folds": cv_folds, **{
        k: v for k, v in fitted.named_steps["clf"].get_params().items()
        if isinstance(v, (int, float, str, bool)) and v is not None
    }})
    mlflow.log_metrics(metrics)
    return fitted, metrics


def evaluate_torch(split: Split) -> dict:
    """Train the PyTorch MLP; logs per-epoch validation curves to MLflow."""
    import torch

    from AIML.deep_learning.torch_mlp import predict_proba, train_mlp

    result = train_mlp(split.X_train.to_numpy(np.float32), split.y_train, len(split.classes))
    for row in result.history:
        mlflow.log_metrics({"val_loss": row["val_loss"], "val_accuracy": row["val_accuracy"]}, step=row["epoch"])
    probs = predict_proba(result, split.X_test.to_numpy(np.float32))
    metrics = test_metrics(split.y_test, probs.argmax(1))
    mlflow.log_params({"model": "pytorch_mlp", "hidden": 64, "best_epoch": result.best_epoch})
    mlflow.log_metrics(metrics)

    torch.save(
        {"state_dict": result.model.state_dict(), "mean": result.mean, "std": result.std,
         "classes": split.classes, "features": FEATURES},
        TORCH_MODEL_PATH,
    )
    return metrics


def main(cv_folds: int = 5, register: bool = True) -> dict:
    df = load_dataset()
    split = split_dataset(df)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    if mlflow.get_experiment_by_name(EXPERIMENT_NAME) is None:
        mlflow.create_experiment(EXPERIMENT_NAME, artifact_location=MLFLOW_ARTIFACT_ROOT)
    mlflow.set_experiment(EXPERIMENT_NAME)

    leaderboard: dict[str, dict] = {}
    fitted_models: dict[str, Pipeline] = {}
    run_ids: dict[str, str] = {}

    with mlflow.start_run(run_name=f"compare-{datetime.now():%Y%m%d-%H%M%S}") as parent:
        mlflow.log_params({"rows": len(df), "classes": len(split.classes), "features": ",".join(FEATURES)})

        for name, model in candidate_models().items():
            with mlflow.start_run(run_name=name, nested=True) as run:
                fitted_models[name], leaderboard[name] = evaluate_sklearn(name, model, split, cv_folds)
                run_ids[name] = run.info.run_id
            print(f"{name:20s} cv_f1={leaderboard[name]['cv_f1_macro_mean']:.4f} "
                  f"test_acc={leaderboard[name]['test_accuracy']:.4f}")

        try:
            import torch  # noqa: F401
        except (ImportError, OSError) as exc:  # not installed, or native libs blocked by the OS
            print(f"{'pytorch_mlp':20s} skipped: PyTorch unavailable ({exc.__class__.__name__})")
        else:
            with mlflow.start_run(run_name="pytorch_mlp", nested=True):
                leaderboard["pytorch_mlp"] = evaluate_torch(split)
            print(f"{'pytorch_mlp':20s} test_acc={leaderboard['pytorch_mlp']['test_accuracy']:.4f}")

        # Choose among the scikit-learn-compatible models (they share one serving path).
        best_name = max(
            fitted_models,
            key=lambda n: (leaderboard[n]["cv_f1_macro_mean"], leaderboard[n]["test_f1_macro"]),
        )
        best = fitted_models[best_name]
        y_pred = best.predict(split.X_test)

        importances = None
        clf = best.named_steps["clf"]
        if hasattr(clf, "feature_importances_"):
            importances = dict(zip(FEATURES, map(float, clf.feature_importances_)))

        report = {
            "best_model": best_name,
            "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "rows": len(df),
            "classes": split.classes,
            "features": FEATURES,
            "leaderboard": leaderboard,
            "feature_importances": importances,
            "confusion_matrix": confusion_matrix(split.y_test, y_pred).tolist(),
            "classification_report": classification_report(
                split.y_test, y_pred, target_names=split.classes, output_dict=True, zero_division=0
            ),
            "mlflow_run_id": run_ids[best_name],
        }
        mlflow.log_dict(report, "metrics.json")
        mlflow.set_tag("best_model", best_name)

        bundle = {
            "model": best,
            "classes": split.classes,
            "features": FEATURES,
            "name": best_name,
            "metrics": leaderboard[best_name],
            "trained_at": report["trained_at"],
            "sklearn_version": sklearn.__version__,
        }
        joblib.dump(bundle, MODEL_BUNDLE_PATH)
        METRICS_PATH.write_text(json.dumps(report, indent=2))

        if register:
            # Log the winning pipeline in its own run's artifacts and register it.
            # MLflow stores scikit-learn models with skops, which only loads types
            # we explicitly trust; we trained these models ourselves.
            fmt = SKOPS_TRUSTED_TYPES.get(best_name)
            with mlflow.start_run(run_id=run_ids[best_name], nested=True):
                mlflow.sklearn.log_model(
                    best, name="model",
                    input_example=split.X_test.head(3),
                    registered_model_name=REGISTERED_MODEL_NAME,
                    **({"skops_trusted_types": fmt} if fmt is not None else {"serialization_format": "cloudpickle"}),
                )

        print(f"\nBest: {best_name}. Saved {MODEL_BUNDLE_PATH} and {METRICS_PATH}")
        print(f"MLflow parent run: {parent.info.run_id}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--cv-folds", type=int, default=5)
    parser.add_argument("--no-register", action="store_true", help="skip the MLflow model registry")
    args = parser.parse_args()
    main(cv_folds=args.cv_folds, register=not args.no_register)
