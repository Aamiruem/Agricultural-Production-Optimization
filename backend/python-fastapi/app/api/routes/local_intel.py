"""Local agriculture intelligence API: location, weather, soil, agriculture, dataset matching.

Crop recommendation and yield prediction reuse the existing endpoints
(POST /api/recommend/crop and POST /api/yield/predict).
"""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.local import datasets, matching, providers
from app.services.local.http import UpstreamError

router = APIRouter(tags=["local intelligence"])

Lat = Query(ge=-90, le=90, description="Latitude (WGS84)")
Lon = Query(ge=-180, le=180, description="Longitude (WGS84)")


def _upstream(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except UpstreamError as exc:
        raise HTTPException(status_code=exc.status, detail=str(exc)) from exc


# ---------------------------------------------------------------- location
@router.get("/location/search")
def location_search(q: str = Query(min_length=3, max_length=120)):
    """Villages, towns, colonies and localities in India (OpenStreetMap Nominatim, 1 req/s)."""
    return _upstream(providers.search_places, q.strip())


@router.get("/location/reverse-geocode")
def location_reverse(lat: float = Lat, lon: float = Lon):
    """Nearest named place for a point (OpenStreetMap)."""
    return _upstream(providers.reverse_geocode, lat, lon)


@router.get("/location/boundaries")
def location_boundaries(lat: float = Lat, lon: float = Lon):
    """State / district / sub-district containing the point from bundled boundary files."""
    return providers.admin_lookup(lat, lon)


# ---------------------------------------------------------------- weather
@router.get("/weather/current")
def weather_current(lat: float = Lat, lon: float = Lon):
    return _upstream(providers.current, lat, lon)


@router.get("/weather/forecast")
def weather_forecast(lat: float = Lat, lon: float = Lon):
    """Current conditions, 7-day forecast and modelled soil moisture (Open-Meteo)."""
    return _upstream(providers.forecast, lat, lon)


@router.get("/weather/history")
def weather_history(lat: float = Lat, lon: float = Lon):
    """Ten years of daily ERA5 reanalysis (Open-Meteo archive)."""
    return _upstream(providers.history, lat, lon)


# ---------------------------------------------------------------- soil
@router.get("/soil/local")
def soil_local(lat: float = Lat, lon: float = Lon):
    """SoilGrids 2.0 (modelled, 250 m); nearest non-masked cell within ~2 km if needed."""
    return _upstream(providers.soil, lat, lon)


# ---------------------------------------------------------------- agriculture
@router.get("/agriculture/local")
def agriculture_local(state: str = Query(min_length=2, max_length=80)):
    """State crop statistics from the AgriSmart yield dataset (state level only)."""
    ds = datasets.load_builtin("crop_yield")
    rows, level = datasets.records_for(ds["rows"], state)
    stats = datasets.state_agriculture(rows)
    if not stats:
        raise HTTPException(status_code=404, detail=f"No records for '{state}' in crop_yield.csv.")
    return {**stats, "level": level}


@router.get("/agriculture/market-prices")
def market_prices(
    state: str = Query(min_length=2, max_length=80), district: str | None = Query(default=None, max_length=80)
):
    """Daily mandi prices (AGMARKNET via data.gov.in). Needs DATA_GOV_IN_API_KEY."""
    return _upstream(providers.market_prices, state, district)


class LocalValues(BaseModel):
    lat: float | None = None
    lon: float | None = None
    state: str | None = None
    district: str | None = None
    soilClasses: list[str] = Field(default_factory=list)
    texture: str | None = None
    ph: float | None = None
    N: float | None = None
    P: float | None = None
    K: float | None = None
    nutrientBasis: str | None = None
    oc: float | None = None
    rainfall: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    crops: list[str] = Field(default_factory=list)
    season: str | None = None
    area: float | None = None
    levels: dict[str, int] = Field(default_factory=dict)


class CompareRequest(BaseModel):
    dataset: str = Field(default="crop_yield", pattern="^(crop_yield|crop_data)$")
    local: LocalValues
    weights: dict[str, float] | None = None
    crop: str | None = Field(default=None, max_length=80)


@router.post("/agriculture/compare-dataset")
def compare_dataset(req: CompareRequest) -> dict[str, Any]:
    """Weighted compatibility between a built-in dataset and local-area values."""
    ds = datasets.load_builtin(req.dataset)
    schema = ds["schema"]
    if not schema["hasLocation"]:
        return {
            "dataset": ds["meta"],
            "schema": schema,
            "noLocation": True,
            "message": "This dataset has no location columns, so it cannot be matched to a place.",
        }
    local = req.local.model_dump()
    records, level = datasets.records_for(ds["rows"], local.get("state"), local.get("district"))
    if req.crop:
        records = [r for r in records if str(r.get("crop", "")).lower() == req.crop.lower()]
    profile = matching.dataset_profile(records, level=level)
    result = matching.compare_profiles(
        profile, local, weights=req.weights, not_comparable=ds["meta"].get("notComparable")
    )
    return {
        "dataset": ds["meta"],
        "schema": schema,
        "matchedRecords": len(records),
        "matchLevel": level or "none",
        "profile": profile,
        "comparison": result,
    }


class ValidateRequest(BaseModel):
    dataset: str = Field(default="crop_yield", pattern="^(crop_yield|crop_data)$")


@router.post("/agriculture/validate-data")
def validate_data(req: ValidateRequest):
    """Completeness, duplicates, conflicts, plausible ranges, outliers, consistency, timeliness."""
    ds = datasets.load_builtin(req.dataset)
    return {"dataset": ds["meta"], **matching.validate_dataset(ds["rows"], now=date.today())}


class AnalyzeRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


@router.post("/agriculture/analyze-area")
def analyze_area(req: AnalyzeRequest):
    """One call that gathers location, boundaries, forecast, history, soil and state statistics.
    Sections fail independently; failures are reported, never filled in."""

    def attempt(fn, *args):
        try:
            return {"ok": True, "data": fn(*args)}
        except UpstreamError as exc:
            return {"ok": False, "error": str(exc)}

    admin = providers.admin_lookup(req.lat, req.lon)
    stats = None
    if admin.get("state"):
        ds = datasets.load_builtin("crop_yield")
        stats = datasets.state_agriculture(datasets.records_for(ds["rows"], admin["state"])[0])
    return {
        "point": [req.lat, req.lon],
        "boundaries": admin,
        "place": attempt(providers.reverse_geocode, req.lat, req.lon),
        "forecast": attempt(providers.forecast, req.lat, req.lon),
        "history": attempt(providers.history, req.lat, req.lon),
        "soil": attempt(providers.soil, req.lat, req.lon),
        "agriculture": stats,
    }
