"""Build 1200x630 Open Graph / social-share JPEGs for AgriSmart pages.

Usage (repo root, after scripts/fetch_commons_images.py):
    python scripts/build_og_images.py

Writes frontend/react-app/public/og/<key>.jpg. WhatsApp, LinkedIn and Facebook do
not render SVG previews, so every page gets a JPEG with its own photo and headline.
Each key matches the `image` field in frontend/react-app/src/seo/routes.js.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "frontend" / "react-app"
IMAGES = APP / "public" / "images"
OUT = APP / "public" / "og"
ICON = APP / "public" / "icons" / "icon-192.png"
W, H = 1200, 630

# key -> (photo relative to public/images, headline, subline)
PAGES: dict[str, tuple[str, str, str]] = {
    "home": (
        "india-agriculture-hero.webp",
        "Transforming Agriculture Through Smart Technology",
        "Production systems · Smart machines · AI farming tools",
    ),
    "about": (
        "education/farmers-in-field-1200.webp",
        "About AgriSmart",
        "Empowering agriculture through technology, knowledge and sustainable innovation",
    ),
    "agriculture": (
        "systems/crop-production-systems-1200.webp",
        "Agricultural Production Systems",
        "16 farming systems explained: definitions, process, pros & cons",
    ),
    "machines": (
        "machines/combine-harvester-1200.webp",
        "Smart Agricultural Machines",
        "Tractors, harvesters, drones, robots and smart irrigation",
    ),
    "ai": (
        "ai/satellite-monitoring-1200.webp",
        "AI in Agriculture",
        "Crop recommendation, yield prediction and disease detection",
    ),
    "crops-food": (
        "food/harvesting-1200.webp",
        "Crops & Food Production in India",
        "Kharif, Rabi, Zaid · post-harvest · food security",
    ),
    "health": (
        "health/doctor-consultation-1200.webp",
        "Farmer Health & Rural Healthcare",
        "First aid, heat stress, pesticide safety and wellness",
    ),
    "nutrition": ("nutrition/healthy-fruits-1200.webp", "Food & Nutrition Guide", "Balanced diet from farm to plate"),
    "education": (
        "education/modern-farming-1200.webp",
        "Farmer Education & Resources",
        "Techniques, soil testing and official government schemes",
    ),
    "services": ("machines/crop-sensors-1200.webp", "AgriTech, AI/ML & Software Services", "By Aamir Hussain Azad"),
    "projects": ("ai/soil-analysis-1200.webp", "Projects by Aamir Hussain Azad", "AI/ML and full-stack portfolio"),
    "developer": (
        "education/farmers-in-field-1200.webp",
        "Aamir Hussain Azad",
        "AI/ML Engineer & Full-Stack Developer · Gurugram",
    ),
    "contact": ("education/agri-economics-1200.webp", "Contact AgriSmart", "WhatsApp or call +91 99318 79953"),
    "app": ("india-agriculture-hero.webp", "AgriSmart Web App", "Free AI farming tools on any phone"),
}

SYSTEM_TITLES = {
    "crop-production-systems": "Crop Production Systems",
    "subsistence-farming": "Subsistence Farming",
    "commercial-farming": "Commercial Farming",
    "intensive-farming": "Intensive Farming",
    "extensive-farming": "Extensive Farming",
    "organic-farming": "Organic Farming",
    "integrated-farming": "Integrated Farming",
    "mixed-farming": "Mixed Farming",
    "precision-agriculture": "Precision Agriculture",
    "sustainable-agriculture": "Sustainable Agriculture",
    "irrigation-systems": "Irrigation Systems",
    "soil-management": "Soil Management",
    "fertilizer-management": "Fertilizer Management",
    "pest-disease-management": "Pest & Disease Management",
    "crop-rotation": "Crop Rotation",
    "intercropping": "Intercropping & Multiple Cropping",
}


def font(bold: bool, size: int) -> ImageFont.FreeTypeFont:
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    )
    for c in candidates:
        if Path(c).exists():
            return ImageFont.truetype(c, size)
    return ImageFont.load_default(size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=f) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def render(key: str, photo: str, headline: str, sub: str) -> None:
    img = ImageOps.fit(Image.open(IMAGES / photo).convert("RGB"), (W, H), Image.LANCZOS, centering=(0.6, 0.5))
    # left-to-right forest-green gradient for legible text
    shade = Image.new("RGBA", (W, H))
    px = shade.load()
    for x in range(W):
        a = int(235 * max(0.0, 1 - x / (W * 0.82)) ** 0.9)
        for y in range(H):
            px[x, y] = (5, 46, 22, a)
    img = Image.alpha_composite(img.convert("RGBA"), shade)
    d = ImageDraw.Draw(img)

    icon = Image.open(ICON).convert("RGBA").resize((76, 76), Image.LANCZOS)
    img.alpha_composite(icon, (64, 56))
    d.text((156, 62), "AgriSmart", font=font(True, 44), fill="white")
    d.text((158, 112), "Smart Agriculture & Production Systems", font=font(False, 22), fill=(253, 230, 138))

    hf = font(True, 62)
    lines = wrap(d, headline, hf, 760)
    if len(lines) > 3:
        hf = font(True, 50)
        lines = wrap(d, headline, hf, 780)
    y = H - 150 - len(lines) * (hf.size + 10)
    d.rounded_rectangle((64, y - 26, 150, y - 18), radius=4, fill=(250, 204, 21))
    for ln in lines:
        d.text((64, y), ln, font=hf, fill="white")
        y += hf.size + 10
    d.text((66, y + 12), sub, font=font(False, 28), fill=(220, 252, 231))
    img.convert("RGB").save(OUT / f"{key}.jpg", "JPEG", quality=82, optimize=True, progressive=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, (photo, headline, sub) in PAGES.items():
        render(key, photo, headline, sub)
    manifest = json.loads((ROOT / "scripts" / "commons_images.json").read_text(encoding="utf-8"))
    for slug in manifest["systems"]:
        render(
            f"systems-{slug}",
            f"systems/{slug}-1200.webp",
            SYSTEM_TITLES[slug],
            "Definition · process · advantages · limitations",
        )
    print(f"{len(list(OUT.glob('*.jpg')))} images -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
