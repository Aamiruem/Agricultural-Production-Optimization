"""Location, boundaries, weather, soil and market data providers.

Response shapes match the browser fallbacks in frontend/react-app/src/features/local/services.js,
so the frontend treats both paths identically.
"""

from __future__ import annotations

import json
import math
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path

from app.core.config import get_settings

from .http import UpstreamError, get_json, now_iso

REPO_ROOT = Path(__file__).resolve().parents[5]
GEO_DIR = REPO_ROOT / "frontend" / "react-app" / "public" / "geo"

PLACE_KEYS = [
    "hamlet",
    "village",
    "suburb",
    "neighbourhood",
    "quarter",
    "town",
    "city_district",
    "city",
    "municipality",
]


# ---------------------------------------------------------------- location
def _normalize(r: dict) -> dict:
    a = r.get("address") or {}
    place = next((a[k] for k in PLACE_KEYS if a.get(k)), None)
    return {
        "name": r.get("name") or place or (r.get("display_name") or "").split(",")[0],
        "displayName": r.get("display_name"),
        "lat": float(r["lat"]),
        "lon": float(r["lon"]),
        "type": r.get("addresstype") or r.get("type"),
        "locality": a.get("neighbourhood") or a.get("suburb") or a.get("quarter"),
        "village": a.get("village") or a.get("hamlet"),
        "town": a.get("town") or a.get("city") or a.get("municipality"),
        "tehsil": a.get("county") or a.get("subdistrict"),
        "district": a.get("state_district") or a.get("district"),
        "state": a.get("state"),
        "postcode": a.get("postcode"),
        "bbox": [float(x) for x in r["boundingbox"]] if r.get("boundingbox") else None,
    }


def search_places(q: str) -> dict:
    data = get_json(
        "https://nominatim.openstreetmap.org/search",
        {"format": "jsonv2", "addressdetails": 1, "countrycodes": "in", "limit": 8, "accept-language": "en", "q": q},
    )
    return {"results": [_normalize(r) for r in data], "source": "nominatim", "retrievedAt": now_iso()}


def reverse_geocode(lat: float, lon: float) -> dict:
    data = get_json(
        "https://nominatim.openstreetmap.org/reverse",
        {"format": "jsonv2", "addressdetails": 1, "zoom": 18, "accept-language": "en", "lat": lat, "lon": lon},
    )
    if isinstance(data, dict) and data.get("error"):
        return {"place": None, "error": data["error"], "retrievedAt": now_iso()}
    return {"place": _normalize(data), "source": "nominatim", "retrievedAt": now_iso()}


# ---------------------------------------------------------------- boundaries
@lru_cache(maxsize=64)
def _geo(path: str) -> dict:
    return json.loads((GEO_DIR / path).read_text(encoding="utf-8"))


def _in_ring(lon: float, lat: float, ring: list) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _contains(geometry: dict, lat: float, lon: float) -> bool:
    polys = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return any(_in_ring(lon, lat, p[0]) and not any(_in_ring(lon, lat, h) for h in p[1:]) for p in polys)


def admin_lookup(lat: float, lon: float) -> dict:
    """State / district / sub-district containing a point (boundary vintage ~2019)."""
    state = next((f for f in _geo("india-states.json")["features"] if _contains(f["geometry"], lat, lon)), None)
    if not state:
        return {"state": None, "district": None, "subdistrict": None, "inIndia": False}
    slug = state["properties"]["slug"]
    dist = next((f for f in _geo(f"districts/{slug}.json")["features"] if _contains(f["geometry"], lat, lon)), None)
    sub = next((f for f in _geo(f"subdistricts/{slug}.json")["features"] if _contains(f["geometry"], lat, lon)), None)
    return {
        "inIndia": True,
        "state": state["properties"]["name"],
        "stateSlug": slug,
        "district": dist["properties"]["name"] if dist else None,
        "districtLgd": dist["properties"]["lgd"] if dist else None,
        "subdistrict": sub["properties"]["name"] if sub else None,
        "subdistrictLgd": sub["properties"].get("lgd") if sub else None,
        "source": "datta07/INDIAN-SHAPEFILES (MIT), ~2019 administrative vintage",
        "unavailableLevels": ["block", "gram_panchayat", "village"],
    }


# ---------------------------------------------------------------- weather
FORECAST = "https://api.open-meteo.com/v1/forecast"
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
CURRENT = "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,shortwave_radiation"
DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,shortwave_radiation_sum"
SOIL_MOISTURE = "soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm"


def forecast(lat: float, lon: float) -> dict:
    data = get_json(
        FORECAST,
        {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "current": CURRENT,
            "daily": DAILY,
            "hourly": SOIL_MOISTURE,
            "forecast_days": 7,
            "timezone": "Asia/Kolkata",
        },
    )
    return {**data, "source": "openMeteoForecast", "retrievedAt": now_iso()}


def current(lat: float, lon: float) -> dict:
    f = forecast(lat, lon)
    return {
        "current": f.get("current"),
        "current_units": f.get("current_units"),
        "source": f["source"],
        "retrievedAt": f["retrievedAt"],
    }


def history(lat: float, lon: float, today: date | None = None) -> dict:
    """Ten complete years of daily ERA5 history plus the current year (archive lags ~5 days)."""
    today = today or date.today()
    data = get_json(
        ARCHIVE,
        {
            "latitude": round(lat, 2),
            "longitude": round(lon, 2),
            "start_date": f"{today.year - 10}-01-01",
            "end_date": (today - timedelta(days=6)).isoformat(),
            "daily": "precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean",
            "timezone": "Asia/Kolkata",
        },
        timeout=60,
    )
    return {
        "daily": data.get("daily"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "source": "openMeteoArchive",
        "retrievedAt": now_iso(),
    }


# ---------------------------------------------------------------- soil
SOILGRIDS = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPS = ["phh2o", "clay", "sand", "silt", "soc", "nitrogen", "cec", "bdod"]


def _soil_query(lat: float, lon: float) -> dict:
    params = [
        ("lon", f"{lon:.5f}"),
        ("lat", f"{lat:.5f}"),
        *[("property", p) for p in PROPS],
        ("depth", "0-5cm"),
        ("depth", "5-15cm"),
        ("depth", "15-30cm"),
        ("value", "mean"),
    ]
    timeout = get_settings().soilgrids_timeout_s
    try:
        return get_json(SOILGRIDS, params, timeout=timeout)
    except UpstreamError as exc:
        if exc.status not in (502, 504):
            raise
        return get_json(SOILGRIDS, params, timeout=timeout)  # one retry: SoilGrids is often slow


def _empty(data: dict | None) -> bool:
    layers = (data or {}).get("properties", {}).get("layers", [])
    return not any(d["values"].get("mean") is not None for layer in layers for d in layer["depths"])


def soil(lat: float, lon: float) -> dict:
    """SoilGrids at the point; if masked (built-up/water), up to four cells ~2 km away."""
    data = _soil_query(lat, lon)
    sample = [lat, lon]
    for dn, de in [(2, 0), (0, 2), (-2, 0), (0, -2)]:
        if not _empty(data):
            break
        la = lat + dn / 111.32
        lo = lon + de / (111.32 * math.cos(math.radians(lat)))
        data = _soil_query(la, lo)
        sample = [la, lo]
    return {"json": None if _empty(data) else data, "sample": sample, "source": "soilgrids", "retrievedAt": now_iso()}


# ---------------------------------------------------------------- market prices
AGMARKNET_RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070"  # data.gov.in: daily mandi prices


def market_prices(state: str, district: str | None = None) -> dict:
    key = get_settings().data_gov_in_api_key
    if not key:
        raise UpstreamError("Mandi prices need DATA_GOV_IN_API_KEY (free from data.gov.in) on the API server.", 503)
    params = {"api-key": key, "format": "json", "limit": 50, "filters[state]": state}
    if district:
        params["filters[district]"] = district
    data = get_json(f"https://api.data.gov.in/resource/{AGMARKNET_RESOURCE}", params)
    return {
        "records": data.get("records", []),
        "source": "AGMARKNET via data.gov.in",
        "sourceUrl": f"https://data.gov.in/resource/{AGMARKNET_RESOURCE}",
        "retrievedAt": now_iso(),
    }
