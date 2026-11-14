"""Hyperparameter tuning for XGBoost with Optuna; every trial is an MLflow run.

python -m AIML.tune --trials 30
"""

import argparse
import json

import mlflow
import optuna
from sklearn.model_selection import StratifiedKFold, cross_val_score
from xgboost import XGBClassifier

from AIML.config import EXPERIMENT_NAME, MLFLOW_TRACKING_URI, RANDOM_STATE, REPORTS_DIR
from AIML.preprocessing.features import load_dataset, split_dataset


def main(trials: int = 30) -> dict:
    split = split_dataset(load_dataset())
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 600, step=50),
            "max_depth": trial.suggest_int("max_depth", 2, 10),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "min_child_weight": trial.suggest_float("min_child_weight", 1, 10),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-3, 10, log=True),
        }
        model = XGBClassifier(
            **params, tree_method="hist", eval_metric="mlogloss", random_state=RANDOM_STATE, n_jobs=-1
        )
        score = cross_val_score(model, split.X_train, split.y_train, cv=cv, scoring="f1_macro").mean()
        with mlflow.start_run(run_name=f"optuna-trial-{trial.number}", nested=True):
            mlflow.log_params(params)
            mlflow.log_metric("cv_f1_macro_mean", score)
        return score

    with mlflow.start_run(run_name="xgboost-optuna"):
        study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE))
        study.optimize(objective, n_trials=trials, show_progress_bar=False)
        mlflow.log_params({f"best_{k}": v for k, v in study.best_params.items()})
        mlflow.log_metric("best_cv_f1_macro", study.best_value)

    result = {"best_params": study.best_params, "best_cv_f1_macro": study.best_value, "trials": trials}
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "xgboost_tuning.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--trials", type=int, default=30)
    main(parser.parse_args().trials)
