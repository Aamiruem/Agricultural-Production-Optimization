"""Dataset ↔ local-area matching score and data-quality validation.

Data Match Score = Σ(weight × similarity) / Σ(weights of comparable parameters) × 100

Missing values and values on a different measurement basis are excluded (never counted as
matches) and reported; `coverage` is the share of total weight that could be compared. This
is a data-compatibility score, not the accuracy of any prediction.

Mirrors frontend/react-app/src/features/local/matching.js; shared/local-intel/matching_cases.json
holds hand-computed cases both implementations must pass.
"""

from __future__ import annotations

import json
import math
import re
from datetime import date
from statistics import median
from typing import Any

DEFAULT_WEIGHTS = {
    "location": 20,
    "soil_type": 10,
    "ph": 10,
    "N": 6,
    "P": 4,
    "K": 4,
    "oc": 4,
    "rainfall": 12,
    "temperature": 8,
    "humidity": 6,
    "crop": 8,
    "season": 6,
    "area": 2,
}
TOLERANCES = {
    "ph": {"abs": 1.0, "unit": "pH"},
    "N": {"abs": 140, "unit": "kg/ha"},
    "P": {"abs": 15, "unit": "kg/ha"},
    "K": {"abs": 140, "unit": "kg/ha"},
    "oc": {"abs": 0.5, "unit": "%"},
    "rainfall": {"rel": 0.25, "unit": "mm/year"},
    "temperature": {"abs": 4, "unit": "°C"},
    "humidity": {"abs": 15, "unit": "%"},
    "area": {"rel": 0.5, "unit": "ha"},
}
LOCATION_KM = 50
LABELS = {
    "location": "Location",
    "soil_type": "Soil type",
    "ph": "Soil pH",
    "N": "Nitrogen (available)",
    "P": "Phosphorus (available)",
    "K": "Potassium (available)",
    "oc": "Organic carbon",
    "rainfall": "Annual rainfall",
    "temperature": "Mean temperature",
    "humidity": "Mean humidity",
    "crop": "Crop types",
    "season": "Season",
    "area": "Land area",
}
SOIL_FAMILY = {
    "alluvial": ["Loam", "Silt loam", "Sandy loam", "Clay loam", "Silty clay loam"],
    "black": ["Clay", "Silty clay", "Clay loam"],
    "red": ["Sandy loam", "Sandy clay loam", "Loam", "Loamy sand"],
    "laterite": ["Sandy clay loam", "Clay loam", "Sandy clay", "Clay"],
    "arid": ["Sand", "Loamy sand", "Sandy loam"],
    "desert": ["Sand", "Loamy sand", "Sandy loam"],
    "sandy": ["Sand", "Loamy sand", "Sandy loam"],
    "loamy": ["Loam", "Silt loam", "Sandy loam", "Clay loam"],
    "clay": ["Clay", "Silty clay", "Clay loam", "Silty clay loam"],
    "peaty": ["Clay", "Silty clay", "Clay loam"],
    "mountain": ["Loam", "Sandy loam", "Silt loam"],
    "forest": ["Loam", "Sandy loam", "Silt loam"],
}
CROP_SYNONYMS = {
    "arhar/tur": "pigeon pea", "tur": "pigeon pea", "arhar": "pigeon pea", "pigeonpeas": "pigeon pea",
    "gram": "chickpea", "rapeseed &mustard": "mustard", "rapeseed & mustard": "mustard",
    "moong(green gram)": "green gram", "mungbean": "green gram", "urad": "black gram", "blackgram": "black gram",
    "bajra": "pearl millet", "jowar": "sorghum", "ragi": "finger millet", "paddy": "rice", "cotton(lint)": "cotton",
    "masoor": "lentil", "kidneybeans": "kidney beans", "mothbeans": "moth bean", "soyabean": "soybean",
    "sesamum": "sesame", "dry chillies": "chilli", "cashewnut": "cashew", "peas & beans (pulses)": "peas",
}  # fmt: skip
STATE_ALIASES = {
    "jammu and kashmir": "jammu & kashmir",
    "andaman and nicobar islands": "andaman & nicobar islands",
    "andaman and nicobar": "andaman & nicobar islands",
    "dadra and nagar haveli": "dadra & nagar haveli and daman & diu",
    "daman and diu": "dadra & nagar haveli and daman & diu",
    "nct of delhi": "delhi",
    "orissa": "odisha",
    "pondicherry": "puducherry",
    "uttaranchal": "uttarakhand",
    "chattisgarh": "chhattisgarh",
}


def r_(v: float | None, d: int = 2) -> float | None:
    """Round half away from zero (matches JS Math.round for positives)."""
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    f = 10**d
    return math.floor(v * f + 0.5) / f if v >= 0 else -math.floor(-v * f + 0.5) / f


def norm_place(name: Any) -> str:
    s = re.sub(r"\s+", " ", str(name or "").lower()).strip()
    return STATE_ALIASES.get(s, s.replace(" and ", " & "))


def norm_season(s: Any) -> str | None:
    v = str(s or "").strip().lower()
    if not v:
        return None
    if v.startswith("kharif"):
        return "Kharif"
    if v.startswith("rabi"):
        return "Rabi"
    if v == "autumn":
        return "Autumn"
    if v == "winter":
        return "Winter"
    if v.startswith(("zaid", "summer")):
        return "Zaid"
    if v.startswith("whole"):
        return "Whole Year"
    return str(s).strip()


def crop_key(name: Any) -> str:
    s = str(name or "").lower().strip()
    return CROP_SYNONYMS.get(s, s)


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(h))


def numeric_similarity(a: float | None, b: float | None, tol: dict) -> float | None:
    if a is None or b is None:
        return None
    t = tol["abs"] if "abs" in tol else tol["rel"] * max(abs(a), abs(b), 1e-9)
    return max(0.0, min(1.0, 1 - abs(a - b) / t))


def _soil_similarity(dataset_soil: Any, classes: list[str], texture: str | None) -> float | None:
    if not dataset_soil or (not classes and not texture):
        return None
    d = str(dataset_soil).lower()
    if any(d in c.lower() or c.lower() in d for c in classes):
        return 1.0
    if texture and d == texture.lower():
        return 1.0
    fam = next((v for k, v in SOIL_FAMILY.items() if k in d), None)
    if fam and texture and texture in fam:
        return 0.5
    for c in classes:
        f = next((v for k, v in SOIL_FAMILY.items() if k in c.lower()), [])
        if any(t.lower() == d for t in f):
            return 0.5
    return 0.0


def _crop_similarity(dataset_crops: list, local_crops: list) -> float | None:
    if not dataset_crops or not local_crops:
        return None
    loc = {crop_key(c) for c in local_crops}
    top = dataset_crops[:10]
    return sum(crop_key(c) in loc for c in top) / len(top)


def _season_similarity(dataset_seasons: list, current: str | None) -> float | None:
    if not dataset_seasons or not current:
        return None
    s = {norm_season(x) for x in dataset_seasons}
    return 1.0 if current in s else 0.5 if "Whole Year" in s else 0.0


def _location_similarity(p: dict, loc: dict) -> dict | None:
    if p.get("lat") is not None and p.get("lon") is not None and loc.get("lat") is not None:
        d = haversine_km((p["lat"], p["lon"]), (loc["lat"], loc["lon"]))
        return {"s": max(0.0, min(1.0, 1 - d / LOCATION_KM)), "distanceKm": r_(d, 1), "basis": "coordinates"}
    if p.get("district") and loc.get("district") and norm_place(p["district"]) == norm_place(loc["district"]):
        return {"s": 0.85, "basis": "same district"}
    if p.get("state") and loc.get("state") and norm_place(p["state"]) == norm_place(loc["state"]):
        return {"s": 0.6, "basis": "same state (dataset has no finer location)"}
    if p.get("state") or p.get("district"):
        return {"s": 0.0, "basis": "different area"}
    return None


def dataset_profile(records: list[dict], level: str | None = None, latest_years: int = 5) -> dict | None:
    if not records:
        return None
    years = [r["year"] for r in records if r.get("year")]
    latest = max(years) if years else None
    recent = [r for r in records if not latest or not r.get("year") or r["year"] >= latest - (latest_years - 1)]

    def med(k: str) -> float | None:
        v = [r[k] for r in recent if r.get(k) is not None]
        return median(v) if v else None

    def mode(k: str) -> Any:
        counts: dict = {}
        for r in recent:
            if r.get(k):
                counts[r[k]] = counts.get(r[k], 0) + 1
        return max(counts.items(), key=lambda kv: kv[1])[0] if counts else None

    crop_area: dict = {}
    for r in recent:
        if r.get("crop"):
            crop_area[r["crop"]] = crop_area.get(r["crop"], 0) + (r.get("area") or 1)
    rain_year = {r["year"]: r["rainfall"] for r in recent if r.get("rainfall") is not None and r.get("year")}
    return {
        "level": level,
        "records": len(records),
        "recentRecords": len(recent),
        "latestYear": latest,
        "state": mode("state"),
        "district": mode("district"),
        "lat": med("lat"),
        "lon": med("lon"),
        "soil_type": mode("soil_type"),
        **{k: med(k) for k in ["ph", "N", "P", "K", "oc", "temperature", "humidity", "area"]},
        "rainfall": median(rain_year.values()) if rain_year else med("rainfall"),
        "crops": [c for c, _ in sorted(crop_area.items(), key=lambda kv: -kv[1])],
        "seasons": sorted({norm_season(r.get("season")) for r in recent if norm_season(r.get("season"))}),
    }


def compare_profiles(
    profile: dict | None,
    local: dict,
    weights: dict | None = None,
    now: date | None = None,
    not_comparable: dict | None = None,
) -> dict:
    weights = {**DEFAULT_WEIGHTS, **(weights or {})}
    forced = not_comparable or {}
    now = now or date.today()
    p = profile or {}
    rows: list[dict] = []

    def add(key: str, dv: Any, lv: Any, s: float | None, **extra: Any) -> None:
        w = float(weights.get(key, 0))
        if extra.pop("notComparable", False):
            status = "not comparable"
        elif s is None:
            status = "missing"
        else:
            sr = r_(s, 3)
            status = "match" if sr >= 0.8 else "partial" if sr >= 0.5 else "mismatch"
        rows.append(
            {
                "key": key,
                "label": LABELS.get(key, key),
                "dataset": dv,
                "local": lv,
                "similarity": None if status in ("missing", "not comparable") else r_(s, 3),
                "status": status,
                "weight": w,
                **extra,
            }
        )

    loc = _location_similarity(p, local) if profile else None
    location_text = ", ".join(x for x in [p.get("district"), p.get("state")] if x) or (
        f"{r_(p['lat'], 4)}, {r_(p['lon'], 4)}" if p.get("lat") is not None else None
    )
    add(
        "location",
        location_text if profile else None,
        ", ".join(x for x in [local.get("district"), local.get("state")] if x) or None,
        loc["s"] if loc else None,
        basis=(loc or {}).get("basis"),
        distanceKm=(loc or {}).get("distanceKm"),
    )
    add(
        "soil_type",
        p.get("soil_type"),
        " / ".join([x for x in [local.get("texture"), *(local.get("soilClasses") or [])] if x]) or None,
        _soil_similarity(p.get("soil_type"), local.get("soilClasses") or [], local.get("texture")),
    )

    for key in ["ph", "N", "P", "K", "oc", "temperature", "humidity", "rainfall", "area"]:
        a, b, tol = p.get(key), local.get(key), TOLERANCES[key]
        nc = bool(forced.get(key)) or (
            key in ("N", "P", "K")
            and b is not None
            and bool(local.get("nutrientBasis"))
            and local.get("nutrientBasis") != "available-kg-ha"
        )
        s = None if nc else numeric_similarity(a, b, tol)
        add(
            key,
            None if a is None else r_(a, 2),
            None if b is None else r_(b, 2),
            s,
            unit=tol["unit"],
            difference=r_(b - a, 2) if a is not None and b is not None else None,
            tolerance=f"±{tol['abs']} {tol['unit']}" if "abs" in tol else f"±{int(tol['rel'] * 100)}%",
            notComparable=nc,
        )

    add(
        "crop",
        ", ".join((p.get("crops") or [])[:6]) or None,
        ", ".join((local.get("crops") or [])[:6]) or None,
        _crop_similarity(p.get("crops") or [], local.get("crops") or []),
    )
    add(
        "season",
        ", ".join(p.get("seasons") or []) or None,
        local.get("season"),
        _season_similarity(p.get("seasons") or [], local.get("season")),
    )

    comparable = [r for r in rows if r["similarity"] is not None and r["weight"] > 0]
    w_total = sum(r["weight"] for r in rows if r["weight"] > 0)
    w_used = sum(r["weight"] for r in comparable)
    score = sum(r["weight"] * r["similarity"] for r in comparable) / w_used * 100 if w_used else None

    age = now.year - p["latestYear"] if p.get("latestYear") else None
    temporal = (
        {"level": "unknown"}
        if age is None
        else {
            "level": "high" if age <= 2 else "medium" if age <= 6 else "low",
            "detail": f"Latest record {p['latestYear']} ({age} yrs old).",
        }
    )
    basis = (loc or {}).get("basis") or ""
    if basis == "coordinates":
        geo = {
            "level": "high" if loc["distanceKm"] <= 5 else "medium" if loc["distanceKm"] <= 25 else "low",
            "detail": f"Dataset point {loc['distanceKm']} km away.",
        }
    elif basis == "same district":
        geo = {"level": "medium-high", "detail": "Matched at district level."}
    elif basis.startswith("same state"):
        geo = {"level": "medium-low", "detail": "Matched at state level only."}
    else:
        geo = {"level": "low", "detail": "No geographic match."}
    lv = [v for v in (local.get("levels") or {}).values() if v]
    avg = sum(lv) / len(lv) if lv else None
    reliability = (
        {"level": "unknown"}
        if avg is None
        else {
            "level": "high" if avg <= 2 else "medium-high" if avg <= 3.5 else "medium" if avg <= 4.5 else "low",
            "averageSourceLevel": r_(avg, 1),
        }
    )

    def keys(st: str) -> list[str]:
        return [r["key"] for r in rows if r["status"] == st]

    return {
        "score": None if score is None else r_(score, 1),
        "coverage": r_(w_used / w_total * 100, 1) if w_total else 0,
        "rows": rows,
        "matched": keys("match"),
        "partial": keys("partial"),
        "mismatched": keys("mismatch"),
        "missing": keys("missing"),
        "notComparable": keys("not comparable"),
        "outdated": ["year"] if age is not None and age > 6 else [],
        "confidence": {"geographic": geo, "temporal": temporal, "reliability": reliability},
        "formula": "Σ(weight × similarity) ÷ Σ(weights of comparable parameters) × 100",
        "disclaimer": "Data compatibility between your dataset and local data — not the accuracy of any crop or yield prediction.",
    }


# ---------------------------------------------------------------- data quality
RANGES = {
    "ph": (3, 10.5), "N": (0, 1500), "P": (0, 400), "K": (0, 1500), "oc": (0, 15), "rainfall": (0, 12000),
    "temperature": (-10, 50), "humidity": (0, 100), "area": (0, 1e9), "production": (0, 1e12), "yield": (0, 1e5),
    "year": (1900, 2100), "lat": (6, 38), "lon": (67, 98),
}  # fmt: skip


def validate_dataset(
    rows: list[dict],
    now: date | None = None,
    key_fields: tuple[str, ...] = ("state", "district", "crop", "season", "year"),
) -> dict:
    now = now or date.today()
    n = len(rows)
    if not n:
        return {"rows": 0, "score": None, "issues": ["Dataset is empty."]}
    fields = sorted({k for r in rows for k in r})
    completeness = {f: sum(1 for r in rows if r.get(f) not in (None, "")) / n for f in fields}
    seen: set = set()
    duplicates = 0
    for r in rows:
        k = json.dumps([r.get(f) for f in fields], default=str)
        duplicates += k in seen
        seen.add(k)
    keys = [f for f in key_fields if f in fields]
    groups: dict = {}
    for r in rows:
        if keys:
            groups.setdefault(tuple(norm_season(r.get(f)) if f == "season" else r.get(f) for f in keys), []).append(r)
    conflicts = sum(
        len(g)
        for g in groups.values()
        if len(g) > 1
        and len({(r.get("production") if r.get("production") is not None else r.get("yield")) for r in g} - {None}) > 1
    )
    invalid = checked = 0
    invalid_by: dict = {}
    for f, (lo, hi) in RANGES.items():
        if f not in fields:
            continue
        for r in rows:
            if r.get(f) is None:
                continue
            checked += 1
            if not lo <= r[f] <= hi:
                invalid += 1
                invalid_by[f] = invalid_by.get(f, 0) + 1
    outliers = cells = 0
    out_by: dict = {}
    for f in ["ph", "N", "P", "K", "oc", "rainfall", "temperature", "humidity", "yield"]:
        v = sorted(r[f] for r in rows if f in r and r[f] is not None)
        if len(v) < 10:
            continue
        q1, q3 = v[int(len(v) * 0.25)], v[int(len(v) * 0.75)]
        iqr = q3 - q1
        o = sum(1 for x in v if x < q1 - 3 * iqr or x > q3 + 3 * iqr)
        out_by[f] = o
        outliers += o
        cells += len(v)
    cons_checked = inconsistent = 0
    for r in rows:
        if (r.get("area") or 0) > 0 and r.get("production") is not None and r.get("yield") is not None:
            cons_checked += 1
            expected = r["production"] / r["area"]
            if abs(expected - r["yield"]) > max(0.05 * abs(expected), 0.01):
                inconsistent += 1
    years = [r["year"] for r in rows if r.get("year")]
    latest = max(years) if years else None
    age = now.year - latest if latest else None
    timeliness = None if age is None else 1 if age <= 2 else 0.7 if age <= 6 else 0.4 if age <= 10 else 0.2
    parts = {
        "completeness": sum(completeness.values()) / len(fields),
        "uniqueness": 1 - duplicates / n,
        "validity": 1 - invalid / checked if checked else 1,
        "outliers": 1 - outliers / cells if cells else 1,
        "consistency": 1 - inconsistent / cons_checked if cons_checked else None,
        "timeliness": timeliness,
    }
    w = {
        "completeness": 0.3,
        "uniqueness": 0.15,
        "validity": 0.2,
        "outliers": 0.15,
        "consistency": 0.1,
        "timeliness": 0.1,
    }
    usable = {k: v for k, v in parts.items() if v is not None}
    score = sum(w[k] * v for k, v in usable.items()) / sum(w[k] for k in usable) * 100
    issues = [f"{f}: {r_((1 - c) * 100, 1)}% missing" for f, c in completeness.items() if c < 0.95]
    if duplicates:
        issues.append(f"{duplicates} exact duplicate rows")
    if conflicts:
        issues.append(f"{conflicts} rows share the same {'/'.join(keys)} but report different values")
    issues += [f"{f}: {c} values outside plausible range" for f, c in invalid_by.items()]
    issues += [f"{f}: {c} extreme outliers (beyond 3×IQR)" for f, c in out_by.items() if c]
    if inconsistent:
        issues.append(f"{inconsistent} rows where production ÷ area differs from yield by >5%")
    if age is not None and age > 6:
        issues.append(f"Latest record is {latest} ({age} years old)")
    return {
        "rows": n,
        "fields": len(fields),
        "score": r_(score, 1),
        "parts": {k: None if v is None else r_(v * 100, 1) for k, v in parts.items()},
        "completeness": {k: r_(v * 100, 1) for k, v in completeness.items()},
        "duplicates": duplicates,
        "conflicts": conflicts,
        "invalid": invalid,
        "outliers": outliers,
        "inconsistent": inconsistent,
        "latestYear": latest,
        "issues": issues,
    }
