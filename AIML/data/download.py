"""Download the real datasets used across AIML.

    python -m AIML.data.download            # all
    python -m AIML.data.download crop yield # some

* crop    — Crop Recommendation (2,200 rows, 22 crops), SHA-256 pinned.
* yield   — Crop Yield in Indian States 1997-2020 (19,689 rows), SHA-256 pinned.
* weather — Daily ERA5 reanalysis for Ludhiana, Punjab (2015-2024) from the free
            Open-Meteo archive API: temperature, rainfall and FAO-56 ET0.

Downloaded files are validated before being written, so a changed or tampered
upstream file is rejected instead of silently training on different data.
"""

import argparse
import hashlib
import io
import json
import sys
import urllib.parse
import urllib.request

import pandas as pd

from AIML.config import DATA_PATH, WEATHER_DATA_PATH, YIELD_DATA_PATH

SOURCES = {
    "crop": {
        "url": "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv",
        "sha256": "808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c",
        "path": DATA_PATH,
    },
    "yield": {
        # Mirror of Kaggle "Agricultural Crop Yield in Indian States" (akshatgupta7)
        "url": "https://raw.githubusercontent.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset/main/crop_yield.csv",
        "sha256": "ab9bc356b1f8107d490376cec24450a0e2906322ad25788ab22fb32537ab1f8f",
        "path": YIELD_DATA_PATH,
    },
}

WEATHER = {
    "latitude": 30.90,
    "longitude": 75.85,
    "start_date": "2015-01-01",
    "end_date": "2024-12-31",
    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,relative_humidity_2m_mean",
    "timezone": "Asia/Kolkata",
}


def _fetch(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "AgriSmart-AIML/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 - fixed https URLs
        return resp.read()


def download_csv(name: str) -> None:
    spec = SOURCES[name]
    if spec["path"].exists():
        print(f"[{name}] already present: {spec['path']}")
        return
    content = _fetch(spec["url"])
    digest = hashlib.sha256(content).hexdigest()
    if digest != spec["sha256"]:
        raise SystemExit(f"[{name}] checksum mismatch ({digest}); not saving.")
    pd.read_csv(io.BytesIO(content))  # must parse as CSV
    spec["path"].parent.mkdir(parents=True, exist_ok=True)
    spec["path"].write_bytes(content)
    print(f"[{name}] saved {len(content):,} bytes to {spec['path']}")


def download_weather() -> None:
    if WEATHER_DATA_PATH.exists():
        print(f"[weather] already present: {WEATHER_DATA_PATH}")
        return
    url = "https://archive-api.open-meteo.com/v1/archive?" + urllib.parse.urlencode(WEATHER)
    payload = json.loads(_fetch(url))
    daily = pd.DataFrame(payload["daily"]).rename(columns={"time": "date"})
    if len(daily) < 3000 or daily["precipitation_sum"].isna().mean() > 0.05:
        raise SystemExit("[weather] unexpected response; not saving.")
    WEATHER_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    daily.to_csv(WEATHER_DATA_PATH, index=False)
    print(f"[weather] saved {len(daily):,} days to {WEATHER_DATA_PATH}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("datasets", nargs="*", choices=["crop", "yield", "weather"], default=None)
    names = parser.parse_args(argv).datasets or ["crop", "yield", "weather"]
    for name in names:
        download_weather() if name == "weather" else download_csv(name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
