"""Trained model artefacts (joblib bundles) and helpers for serving them."""


def prepare_for_serving(model):
    """Make a trained estimator cheap to call from many concurrent requests.

    Training uses ``n_jobs=-1`` (all cores), but at serving time each request
    predicts one row: fanning that out over every core costs more in thread
    start-up and contention than it saves (measured on the 300-tree forest:
    65 ms -> 25 ms per request, 15 -> 26 req/s at 25 concurrent requests).
    Concurrency comes from API workers and replicas instead.
    """
    steps = getattr(model, "steps", None)
    estimators = [est for _, est in steps] if steps else [model]
    inner = getattr(model, "regressor_", None)  # TransformedTargetRegressor
    if inner is not None:
        estimators += [est for _, est in getattr(inner, "steps", [(None, inner)])]
    for est in estimators:
        if hasattr(est, "n_jobs"):
            try:
                est.set_params(n_jobs=1)
            except ValueError:
                est.n_jobs = 1
    return model
