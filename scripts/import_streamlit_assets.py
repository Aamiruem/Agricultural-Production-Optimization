"""Import crop images and reference tables from the companion Streamlit project.

Source: https://github.com/Aamiruem/Indian-Crop-Optimization-Production (same author).
Usage (repo root):  python scripts/import_streamlit_assets.py <path-to-cloned-repo>

* Copies the 45 crop photos (.webp) to frontend/react-app/public/images/crops/
* Re-encodes the four large PNG artworks to compact .webp (max 1600 px wide)
* Writes frontend/react-app/src/data/generated/atlas.json with crop profiles,
  soil guide, crop-rotation guide and state climate/major-crop references.
"""
from __future__ import annotations

import csv
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "frontend" / "react-app" / "public" / "images"
OUT = ROOT / "frontend" / "react-app" / "src" / "data" / "generated" / "atlas.json"

# The Streamlit tables use "and"; this app's state list uses "&".
STATE_NAMES = {
    "Andaman and Nicobar Islands": "Andaman & Nicobar Islands",
    "Jammu and Kashmir": "Jammu & Kashmir",
    "Dadra and Nagar Haveli and Daman and Diu": "Dadra & Nagar Haveli and Daman & Diu",
}
split = lambda s: [x.strip() for x in s.split("|") if x.strip()]  # noqa: E731


def rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def main(src: Path) -> None:
    ref = src / "data" / "reference"
    (PUBLIC / "crops").mkdir(parents=True, exist_ok=True)

    crops = []
    for r in rows(ref / "india_crop_catalog.csv"):
        image = Path(r["image_file"]).name
        shutil.copy2(src / r["image_file"], PUBLIC / "crops" / image)
        crops.append({
            "name": r["crop"], "hi": r["crop_hindi"], "group": r["crop_group"],
            "seasons": split(r["typical_seasons"]), "soils": split(r["suitable_soils"]),
            "yield": float(r["reference_yield_t_ha"]), "rain": float(r["optimum_rainfall_mm"]),
            "temp": float(r["optimum_temperature_c"]), "water": r["water_need"], "image": f"/images/crops/{image}",
        })

    for name in ("india-agriculture-hero", "kharif-season", "rabi-season", "zaid-horticulture"):
        img = Image.open(src / "assets" / "images" / f"{name}.png").convert("RGB")
        if img.width > 1600:
            img = img.resize((1600, round(img.height * 1600 / img.width)), Image.LANCZOS)
        img.save(PUBLIC / f"{name}.webp", "WEBP", quality=78, method=6)

    soils = [{"id": r["soil_type"], "hi": r["soil_type_hindi"], "texture": r["texture"], "strength": r["strength"], "focus": r["focus"]}
             for r in rows(ref / "india_soil_guide.csv")]
    rotation = [{"prev": r["previous_crop"], "next": r["recommended_crop"], "season": r["next_season"], "soil": r["preferred_soil"],
                 "score": int(r["base_score"]), "reason": r["reason"]} for r in rows(ref / "crop_rotation_guide.csv")]
    states = {STATE_NAMES.get(r["state"], r["state"]): {
        "crops": split(r["major_crops"]), "soils": split(r["dominant_soils"]),
        "rain": float(r["reference_annual_rainfall_mm"]), "temp": float(r["reference_mean_temperature_c"]),
        "zone": r["agro_climate_zone"],
    } for r in rows(ref / "india_states_and_uts.csv")}

    OUT.write_text(json.dumps({"crops": crops, "soils": soils, "rotation": rotation, "states": states}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(crops)} crops, {len(soils)} soils, {len(rotation)} rotations, {len(states)} states -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
