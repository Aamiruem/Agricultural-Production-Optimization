import numpy as np
import pandas as pd
import pytest

from ml.config import FEATURES
from ml.models.torch_mlp import predict_proba, train_mlp
from ml.preprocessing.features import DatasetError, split_dataset, validate_dataframe
from ml.train import candidate_models


def synthetic(n_per_class: int = 30) -> pd.DataFrame:
    """Two clearly separable fake crops (test fixture only, never used for training real models)."""
    rng = np.random.default_rng(0)
    rows = []
    for label, center in {"rice": [80, 45, 40, 24, 82, 6.4, 230], "chickpea": [40, 68, 80, 19, 17, 7.3, 80]}.items():
        rows.append(pd.DataFrame(rng.normal(center, [3, 3, 3, 1, 2, 0.1, 5], (n_per_class, 7)), columns=FEATURES)
                    .assign(label=label))
    return pd.concat(rows, ignore_index=True)


def test_validation_rejects_bad_data():
    df = synthetic()
    validate_dataframe(df)
    with pytest.raises(DatasetError, match="Missing columns"):
        validate_dataframe(df.drop(columns=["ph"]))
    with pytest.raises(DatasetError, match="outside"):
        validate_dataframe(df.assign(ph=20.0))


def test_split_is_stratified_and_encoded():
    split = split_dataset(synthetic())
    assert split.classes == ["chickpea", "rice"]
    assert set(np.unique(split.y_test)) == {0, 1}


@pytest.mark.parametrize("name", ["logistic_regression", "random_forest", "xgboost"])
def test_candidates_learn_separable_data(name):
    split = split_dataset(synthetic())
    model = candidate_models()[name].fit(split.X_train, split.y_train)
    assert (model.predict(split.X_test) == split.y_test).mean() == 1.0
    assert model.predict_proba(split.X_test).shape == (len(split.X_test), 2)


def test_torch_mlp_learns_separable_data():
    split = split_dataset(synthetic())
    result = train_mlp(split.X_train.to_numpy(np.float32), split.y_train, 2, epochs=60)
    probs = predict_proba(result, split.X_test.to_numpy(np.float32))
    assert np.allclose(probs.sum(1), 1, atol=1e-5)
    assert (probs.argmax(1) == split.y_test).mean() >= 0.95
