"""Download the licensed Wikimedia Commons photos used by AgriSmart's content pages.

Usage (repo root):  python scripts/fetch_commons_images.py

* Reads scripts/commons_images.json  ({section: {slug: "File:<exact Commons title>"}}).
* Downloads each original, centre-crops to 3:2 and writes responsive WebP files:
  frontend/react-app/public/images/<section>/<slug>-640.webp and <slug>-1200.webp
* Writes frontend/react-app/src/data/generated/imageCredits.json with the author,
  licence and source page of every photo. The site shows these on /image-credits,
  which CC BY and CC BY-SA licences require.

Only freely licensed files (CC0, public domain, CC BY, CC BY-SA) are accepted.
"""

from __future__ import annotations

import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = Path(__file__).with_name("commons_images.json")
PUBLIC = ROOT / "frontend" / "react-app" / "public" / "images"
CREDITS = ROOT / "frontend" / "react-app" / "src" / "data" / "generated" / "imageCredits.json"
UA = "AgriSmartImageFetcher/1.0 (https://github.com/Aamiruem/Agricultural-Production-Optimization)"
WIDTHS = (640, 1200)
RATIO = 3 / 2
FREE = ("cc0", "public domain", "pd", "cc by", "cc-by")


def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:  # network hiccup or rate limit: back off and retry
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("unreachable")


def _text(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()


def info(title: str) -> dict:
    params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": 2000,
    }
    data = json.loads(_get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    page = next(iter(data["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    md = ii.get("extmetadata", {})
    lic = _text(md.get("LicenseShortName", {}).get("value", ""))
    if not lic.lower().startswith(FREE):
        raise ValueError(f"{title}: licence '{lic}' is not on the allow-list")
    return {
        "title": title.removeprefix("File:"),
        "download": ii.get("thumburl") or ii["url"],
        "page": ii["descriptionurl"],
        "author": _text(md.get("Artist", {}).get("value", "")) or "Unknown author",
        "license": lic,
        "licenseUrl": _text(md.get("LicenseUrl", {}).get("value", "")),
    }


def crop_3x2(img: Image.Image) -> Image.Image:
    w, h = img.size
    if w / h > RATIO:  # too wide: trim the sides
        nw = int(h * RATIO)
        return img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = int(w / RATIO)  # too tall: keep a bit more of the top (subjects sit high)
    top = int((h - nh) * 0.4)
    return img.crop((0, top, w, top + nh))


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    for section, items in manifest.items():
        out_dir = PUBLIC / section
        out_dir.mkdir(parents=True, exist_ok=True)
        for slug, title in items.items():
            key = f"{section}/{slug}"
            done = all((out_dir / f"{slug}-{w}.webp").exists() for w in WIDTHS)
            if done and credits.get(key, {}).get("title") == title.removeprefix("File:"):
                continue
            meta = info(title)
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(_get(meta.pop("download"))))).convert("RGB")
            img = crop_3x2(img)
            for w in WIDTHS:
                img.resize((w, round(w / RATIO)), Image.LANCZOS).save(
                    out_dir / f"{slug}-{w}.webp", "WEBP", quality=72 if w > 640 else 70, method=6
                )
            credits[key] = meta
            print(f"ok  {key}  ({meta['license']})")
            time.sleep(0.5)
    CREDITS.write_text(json.dumps(dict(sorted(credits.items())), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(credits)} credits -> {CREDITS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
