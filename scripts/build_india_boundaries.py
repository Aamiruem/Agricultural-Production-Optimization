"""Build simplified India administrative boundaries for the AgriSmart map.

Source: datta07/INDIAN-SHAPEFILES (MIT licence), https://github.com/datta07/INDIAN-SHAPEFILES
  INDIA/INDIA_STATES.geojson        states/UTs with LGD codes
  INDIA/INDIAN_SUB_DISTRICTS.geojson 5,966 sub-districts (tehsil/taluka) with LGD codes
The source states its administrative vintage is primarily 2019; later district splits are not
reflected. Districts are produced by dissolving sub-districts that share a district LGD code.

Usage (repo root; needs shapely):
    pip install shapely
    python scripts/build_india_boundaries.py <download-dir>
where <download-dir> contains the two GeoJSON files above (download them first).

Writes (frontend/react-app/public/geo/):
    india-states.json                  all states/UTs (simplified ~1 km)
    districts/<state-slug>.json        districts of one state (simplified ~300 m)
    subdistricts/<state-slug>.json     sub-districts of one state (simplified ~150 m)
    index.json                         per-state LGD code, bbox, district/sub-district counts
Block, gram panchayat and village boundaries are NOT included: no openly licensed,
verifiable national dataset was available, so the app uses point locations for them.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "react-app" / "public" / "geo"
SOURCE = "datta07/INDIAN-SHAPEFILES (MIT), administrative vintage ~2019"

# Source name -> AgriSmart state name (src/data/indiaAgri.js)
STATE_NAMES = {
    "Andaman & Nicobar": "Andaman & Nicobar Islands",
    "Dadra & Nagar Haveli": "Dadra & Nagar Haveli and Daman & Diu",
    "Daman & Diu": "Dadra & Nagar Haveli and Daman & Diu",
}
SUB_STATE = {  # upper-case sub-district state names -> AgriSmart names
    "ANDAMAN & NICOBAR": "Andaman & Nicobar Islands",
    "CHATTISGARH": "Chhattisgarh",
    "DADAR & NAGAR HAVELI": "Dadra & Nagar Haveli and Daman & Diu",
    "DAMAN & DIU": "Dadra & Nagar Haveli and Daman & Diu",
    "TAMILNADU": "Tamil Nadu",
}


def slug(name: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", name.lower().replace("&", "and")))


def title(name: str) -> str:
    return " ".join(w if w in {"&"} else w.capitalize() for w in name.lower().split())


def rnd(geom: dict, nd: int) -> dict:
    def r(coords):
        if isinstance(coords[0], (int, float)):
            return [round(coords[0], nd), round(coords[1], nd)]
        return [r(c) for c in coords]

    return {"type": geom["type"], "coordinates": r(geom["coordinates"])}


def clean(geom, tol: float):
    g = geom.buffer(0).simplify(tol, preserve_topology=True)
    return g if not g.is_empty else geom


def fc(features: list[dict]) -> dict:
    return {"type": "FeatureCollection", "source": SOURCE, "features": features}


def write(path: Path, data: dict) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    path.write_text(text, encoding="utf-8")
    return len(text)


def main(src_dir: Path) -> None:
    states_src = json.loads((src_dir / "states.geojson").read_text(encoding="utf-8"))
    subs_src = json.loads((src_dir / "subdistricts.geojson").read_text(encoding="utf-8"))

    # States (merge DNH + DD)
    state_geoms: dict[str, list] = defaultdict(list)
    state_lgd: dict[str, list[int]] = defaultdict(list)
    for f in states_src["features"]:
        p = f["properties"]
        name = STATE_NAMES.get(p["STNAME_SH"], p["STNAME_SH"])
        state_geoms[name].append(shape(f["geometry"]))
        state_lgd[name].append(int(p["State_LGD"]))
    state_features = []
    for name, geoms in sorted(state_geoms.items()):
        g = clean(unary_union(geoms), 0.01)
        state_features.append(
            {
                "type": "Feature",
                "properties": {"name": name, "slug": slug(name), "lgd": sorted(state_lgd[name]), "level": "state"},
                "geometry": rnd(mapping(g), 3),
            }
        )
    size = write(OUT / "india-states.json", fc(state_features))
    print(f"states: {len(state_features)} ({size // 1024} KB)")

    # Sub-districts and dissolved districts, per state
    by_state_sub: dict[str, list[dict]] = defaultdict(list)
    district_parts: dict[tuple[str, int], list] = defaultdict(list)
    district_name: dict[tuple[str, int], str] = {}
    for f in subs_src["features"]:
        p = f["properties"]
        state = SUB_STATE.get(p["stname"], title(p["stname"]))
        geom = shape(f["geometry"])
        dist_code = int(p["Dist_LGD"] or 0) or 100000 + int(p["dtcode11"])  # census code if LGD is missing
        key = (state, dist_code)
        district_parts[key].append(geom)
        district_name[key] = p["dtname"].strip()
        by_state_sub[state].append(
            {
                "type": "Feature",
                "properties": {
                    "name": p["sdtname"].strip(),
                    "district": p["dtname"].strip(),
                    "state": state,
                    "lgd": int(p["Subdt_LGD"] or 0) or None,
                    "census_code": p["sdtcode11"],
                    "district_lgd": dist_code,
                    "level": "subdistrict",
                },
                "geometry": rnd(mapping(clean(geom, 0.0015)), 4),
            }
        )

    by_state_dist: dict[str, list[dict]] = defaultdict(list)
    for (state, dlgd), parts in district_parts.items():
        g = clean(unary_union([p.buffer(0) for p in parts]), 0.003)
        by_state_dist[state].append(
            {
                "type": "Feature",
                "properties": {"name": district_name[(state, dlgd)], "state": state, "lgd": dlgd, "level": "district"},
                "geometry": rnd(mapping(g), 4),
            }
        )

    index = {}
    known = {f["properties"]["name"] for f in state_features}
    for state in sorted(set(by_state_sub) | set(by_state_dist)):
        if state not in known:
            print(f"warning: sub-district state '{state}' has no state outline")
        s = slug(state)
        d_size = write(
            OUT / "districts" / f"{s}.json", fc(sorted(by_state_dist[state], key=lambda f: f["properties"]["name"]))
        )
        s_size = write(OUT / "subdistricts" / f"{s}.json", fc(by_state_sub[state]))
        geom = next(shape(f["geometry"]) for f in state_features if f["properties"]["name"] == state)
        minx, miny, maxx, maxy = geom.bounds
        index[state] = {
            "slug": s,
            "lgd": next(f["properties"]["lgd"] for f in state_features if f["properties"]["name"] == state),
            "bbox": [round(minx, 3), round(miny, 3), round(maxx, 3), round(maxy, 3)],
            "districts": len(by_state_dist[state]),
            "subdistricts": len(by_state_sub[state]),
            "kb": [d_size // 1024, s_size // 1024],
        }
    write(
        OUT / "index.json",
        {
            "source": SOURCE,
            "source_url": "https://github.com/datta07/INDIAN-SHAPEFILES",
            "levels_available": ["country", "state", "district", "subdistrict"],
            "levels_unavailable": ["block", "gram_panchayat", "village", "locality"],
            "states": index,
        },
    )
    print(
        f"districts: {sum(v['districts'] for v in index.values())}, subdistricts: {sum(v['subdistricts'] for v in index.values())}"
    )
    print(f"largest files (KB): {sorted(((v['kb'][1], k) for k, v in index.items()), reverse=True)[:3]}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
