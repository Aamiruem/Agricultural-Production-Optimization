"""Download the public Crop Recommendation dataset (2,200 rows, 22 crops).

    python -m ml.data.download_dataset

The file is checked against a pinned SHA-256 and validated before it is
written to ml/datasets/crop_data.csv, so a changed or tampered upstream file
is rejected instead of silently training a different model.
"""
import hashlib
import sys
import urllib.request

from ml.config import DATA_PATH
from ml.preprocessing.features import validate_dataframe

URL = (
    "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/"
    "Data-processed/crop_recommendation.csv"
)
SHA256 = "808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c"


def main() -> int:
    if DATA_PATH.exists():
        print(f"Dataset already present at {DATA_PATH}")
        return 0

    print(f"Downloading {URL}")
    with urllib.request.urlopen(URL, timeout=60) as resp:  # noqa: S310 - fixed https URL
        content = resp.read()

    digest = hashlib.sha256(content).hexdigest()
    if digest != SHA256:
        print(f"Checksum mismatch: expected {SHA256}, got {digest}. Not saving.", file=sys.stderr)
        return 1

    import io

    import pandas as pd

    validate_dataframe(pd.read_csv(io.BytesIO(content)))
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_bytes(content)
    print(f"Saved {len(content):,} bytes to {DATA_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
