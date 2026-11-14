"""Live check of the local-intelligence data sources for agricultural regions across India.

Usage (repo root):  python scripts/check_local_intel_live.py
Calls the real public APIs through the backend providers (rate limits respected: Nominatim
1/s, SoilGrids 5/min — expect ~15 minutes) and writes docs/local-intelligence-live-check.md.
Every row reports what was actually returned; failures are recorded as failures.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "backend" / "python-fastapi"), str(ROOT)]

from app.services.local import datasets, matching, providers  # noqa: E402
from app.services.local.http import UpstreamError  # noqa: E402

# One rural agricultural point per state (chosen away from towns), plus one urban point.
POINTS = [
    ("Punjab", 30.80, 75.70),
    ("Haryana", 29.40, 76.40),
    ("Bihar", 25.90, 85.60),
    ("Uttar Pradesh", 26.85, 80.40),
    ("Rajasthan", 26.30, 73.50),
    ("Maharashtra", 19.70, 75.30),
    ("Madhya Pradesh", 23.20, 77.10),
    ("Gujarat", 22.70, 72.20),
    ("West Bengal", 23.20, 88.10),
    ("Karnataka", 15.40, 75.00),
    ("Tamil Nadu", 10.80, 79.30),
    ("Kerala", 10.30, 76.40),
    ("Assam", 26.30, 92.20),
    ("Punjab (urban Ludhiana)", 30.9010, 75.8573),
]


def soil_summary(res: dict) -> str:
    if not res.get("json"):
        return "no data (masked)"
    layers = {layer["name"]: layer for layer in res["json"]["properties"]["layers"]}

    def mean(name: str, factor: float) -> float | None:
        vals = [d["values"]["mean"] for d in layers.get(name, {}).get("depths", []) if d["values"]["mean"] is not None]
        return round(sum(vals) / len(vals) / factor, 1) if vals else None

    moved = res["sample"] != [res["_lat"], res["_lon"]]
    return f"pH {mean('phh2o', 10)}, clay {mean('clay', 10)}%, SOC {mean('soc', 10)} g/kg" + (
        " (cell ~2 km away)" if moved else ""
    )


def main() -> None:
    yield_ds = datasets.load_builtin("crop_yield")
    rows = []
    for label, lat, lon in POINTS:
        row = {"label": label, "lat": lat, "lon": lon}
        t0 = time.time()
        admin = providers.admin_lookup(lat, lon)
        row["boundaries"] = f"{admin.get('state')} / {admin.get('district')} / {admin.get('subdistrict')}"
        try:
            place = providers.reverse_geocode(lat, lon)["place"] or {}
            row["place"] = place.get("village") or place.get("town") or place.get("name") or "—"
        except UpstreamError as exc:
            row["place"] = f"FAILED: {exc}"
        try:
            f = providers.forecast(lat, lon)
            row["weather"] = (
                f"{f['current']['temperature_2m']} °C, RH {f['current']['relative_humidity_2m']}%, 7-day rain {round(sum(x or 0 for x in f['daily']['precipitation_sum']), 1)} mm"
            )
        except (UpstreamError, KeyError) as exc:
            row["weather"] = f"FAILED: {exc}"
        try:
            h = providers.history(lat, lon)["daily"]
            years = sorted({t[:4] for t in h["time"]})
            full = [y for y in years if sum(1 for t in h["time"] if t.startswith(y)) >= 360]
            annual = [
                sum(p or 0 for t, p in zip(h["time"], h["precipitation_sum"], strict=True) if t.startswith(y))
                for y in full
            ]
            row["history"] = f"{len(full)} yrs, mean {round(sum(annual) / len(annual))} mm/yr"
            local_rain = sum(annual) / len(annual)
        except (UpstreamError, KeyError, ZeroDivisionError) as exc:
            row["history"] = f"FAILED: {exc}"
            local_rain = None
        try:
            s = providers.soil(lat, lon)
            s["_lat"], s["_lon"] = lat, lon
            row["soil"] = soil_summary(s)
        except UpstreamError as exc:
            row["soil"] = f"FAILED: {exc}"
        if admin.get("state"):
            recs, level = datasets.records_for(yield_ds["rows"], admin["state"])
            prof = matching.dataset_profile(recs, level=level)
            cmp = matching.compare_profiles(
                prof,
                {
                    "lat": lat,
                    "lon": lon,
                    "state": admin["state"],
                    "district": admin.get("district"),
                    "rainfall": local_rain,
                    "crops": [],
                    "season": "Rabi",
                    "levels": {},
                },
                not_comparable={"area": "state total"},
            )
            row["dataset"] = (
                f"{len(recs)} records ({level}), dataset rain {round(prof['rainfall']) if prof and prof['rainfall'] else '—'} mm, match {cmp['score']}% over {cmp['coverage']}%"
            )
        else:
            row["dataset"] = "outside India boundary data"
        row["seconds"] = round(time.time() - t0, 1)
        print(json.dumps(row, ensure_ascii=False))
        rows.append(row)

    out = ROOT / "docs" / "local-intelligence-live-check.md"
    stamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Local intelligence — live data check",
        "",
        f"Run: {stamp} with `python scripts/check_local_intel_live.py`. Each row is what the real services returned for that point; failures are shown as failures.",
        "",
        "| Region | Point | Boundaries (state / district / tehsil) | OSM place | Weather now | ERA5 history | SoilGrids (0–30 cm) | Dataset match (state level) |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            f"| {r['label']} | {r['lat']}, {r['lon']} | {r['boundaries']} | {r['place']} | {r['weather']} | {r['history']} | {r['soil']} | {r['dataset']} |"
        )
    lines += [
        "",
        "Dataset match uses only location and annual rainfall here (no soil test or crop list), so coverage is low by design.",
        "Not tested live: AGMARKNET mandi prices (needs `DATA_GOV_IN_API_KEY`).",
    ]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
