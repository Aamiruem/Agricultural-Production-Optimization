"""Read-only analytics over the bundled Indian state crop-yield records.

The source file contains annual state/crop/season observations from 1997–2020.
These summaries are historical context; they are not current-season forecasts.
"""
import csv
from functools import lru_cache

from fastapi import APIRouter, HTTPException, Query

from AIML.config import YIELD_DATA_PATH as DATA_PATH

router = APIRouter(tags=["yield analytics"])


@lru_cache(maxsize=1)
def _records() -> tuple[dict, ...]:
    if not DATA_PATH.exists():
        return ()
    with DATA_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows = []
        for row in csv.DictReader(handle):
            try:
                rows.append({
                    "crop": row["Crop"].strip(),
                    "season": row["Season"].strip(),
                    "state": row["State"].strip(),
                    "year": int(row["Crop_Year"]),
                    "area_ha": float(row["Area"]),
                    "production_t": float(row["Production"]),
                })
            except (KeyError, TypeError, ValueError):
                continue
    return tuple(rows)


@router.get("/yield/coverage")
def yield_coverage():
    rows = _records()
    if not rows:
        raise HTTPException(status_code=503, detail="Indian historical yield data is not available.")
    return {
        "source": "Indian crop-yield dataset bundled with AgriSmart (historical records)",
        "source_url": "https://github.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset",
        "official_refresh_reference": "https://www.data.gov.in/catalog/district-wise-season-wise-crop-production-statistics-0",
        "first_year": min(row["year"] for row in rows),
        "last_year": max(row["year"] for row in rows),
        "states": sorted({row["state"] for row in rows}),
        "crops": sorted({row["crop"] for row in rows}),
        "seasons": sorted({row["season"] for row in rows}),
        "state_crops": sorted({(row["state"], row["crop"]) for row in rows}),
        "observations": len(rows),
    }


@router.get("/yield/trend")
def yield_trend(
    state: str = Query(min_length=2, max_length=80),
    crop: str = Query(default="All crops", min_length=2, max_length=80),
    season: str = Query(default="All seasons", min_length=2, max_length=20),
):
    rows = [row for row in _records() if row["state"].casefold() == state.casefold()]
    if crop.casefold() != "all crops":
        rows = [row for row in rows if row["crop"].casefold() == crop.casefold()]
    if season.casefold() != "all seasons":
        rows = [row for row in rows if row["season"].casefold() == season.casefold()]
    if not rows:
        return {"state": state, "crop": crop, "season": season, "points": [], "source_years": None}

    yearly = {}
    for row in rows:
        point = yearly.setdefault(row["year"], {"area_ha": 0.0, "production_t": 0.0, "records": 0})
        point["area_ha"] += row["area_ha"]
        point["production_t"] += row["production_t"]
        point["records"] += 1
    points = [
        {"year": year, "production_t": round(item["production_t"], 2),
         "area_ha": round(item["area_ha"], 2),
         "yield_t_ha": round(item["production_t"] / item["area_ha"], 3) if item["area_ha"] else 0,
         "records": item["records"]}
        for year, item in sorted(yearly.items())
    ]
    return {
        "state": state, "crop": crop, "season": season, "points": points,
        "source_years": {"first": min(yearly), "last": max(yearly)},
        "source": "Indian crop-yield dataset bundled with AgriSmart (historical records)",
        "source_url": "https://github.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset",
        "official_refresh_reference": "https://www.data.gov.in/catalog/district-wise-season-wise-crop-production-statistics-0",
    }
