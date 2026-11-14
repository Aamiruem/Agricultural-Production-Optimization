// Smart suggestions, split into rule-based guidance (published thresholds) and
// model-generated suggestions. No fertilizer doses without a soil test.
import { recommendRotation } from "@/lib/atlas";
import { soilHealth } from "@/lib/agriModels";

import { round } from "./geo";

export function buildSuggestions(local, suitability, { previousCrop } = {}) {
  const verified = [];
  const generated = [];
  const c = local.conditions;
  const user = local.soilUser ?? {};
  const v = (k) => user[k]?.value;

  if (c) {
    const deficit = round((c.et07 ?? 0) - (c.rain7 ?? 0), 0);
    if (deficit > 15)
      verified.push({
        topic: "Irrigation scheduling",
        text: `Crop water demand (reference ET₀) exceeds forecast rain by about ${deficit} mm this week. Irrigate at critical growth stages; drip or sprinkler saves water.`,
        basis: "FAO-56 water balance with Open-Meteo ET₀",
      });
    else
      verified.push({
        topic: "Irrigation scheduling",
        text: `Forecast rain (${c.rain7} mm) roughly covers this week's crop water demand (${c.et07} mm ET₀); check soil moisture before irrigating.`,
        basis: "FAO-56 water balance with Open-Meteo ET₀",
      });
    for (const f of c.flags) {
      if (f.id === "waterlogging")
        verified.push({
          topic: "Rainfall precaution",
          text: "Heavy rain is forecast: clear field drains, delay fertilizer top-dressing and spraying until after the rain.",
          basis: "IMD heavy-rain threshold (≥ 64.5 mm/day)",
        });
      if (f.id === "heat")
        verified.push({
          topic: "Heat stress",
          text: "Irrigate in the evening, mulch to keep soil cool and avoid field work at midday.",
          basis: "IMD heat-wave criterion (≥ 40 °C in plains)",
        });
      if (f.id === "cold")
        verified.push({
          topic: "Frost precaution",
          text: "Light irrigation in the evening and covering nurseries reduce frost damage.",
          basis: "Forecast minimum temperature",
        });
      if (f.id === "drought")
        verified.push({
          topic: "Rainfall deficit",
          text: "Season rainfall is below normal: prefer short-duration, drought-tolerant varieties and conserve soil moisture.",
          basis: "IMD departure categories vs 10-year ERA5 normal",
        });
      if (f.id === "humid")
        verified.push({
          topic: "Disease watch",
          text: "High humidity favours fungal diseases — scout fields twice a week.",
          basis: "Relative humidity ≥ 75%",
        });
    }
  }

  // Soil: full Soil Health Card -> rated issues; otherwise only pH-based indicators.
  const hasCard = ["N", "P", "K", "oc", "ph"].every((k) => v(k) != null);
  if (hasCard) {
    const sh = soilHealth({ N: v("N"), P: v("P"), K: v("K"), oc: v("oc"), ph: v("ph"), ec: v("ec") ?? 0.3 });
    verified.push({
      topic: "Soil health",
      text: `Soil health score ${sh.score}/100 (${sh.grade}).`,
      basis: "Soil Health Card rating limits",
    });
    for (const i of sh.issues)
      verified.push({ topic: "Soil improvement", text: i.text, basis: "Soil Health Card rating limits (your test)" });
    verified.push({
      topic: "Fertilizer guidance",
      text: "Use the fertilizer planner with your soil-test values for crop-specific doses, and confirm with your Soil Health Card recommendation.",
      basis: "Your soil test",
      link: "/fertilizer",
    });
  } else {
    const ph = v("ph") ?? local.soil?.ph?.value;
    if (ph != null && ph > 8.5)
      verified.push({
        topic: "Soil improvement",
        text: `Soil pH around ${ph} suggests alkalinity — a soil test is needed to decide gypsum requirement.`,
        basis: v("ph") ? "Your pH value" : "SoilGrids estimate (confirm with a test)",
      });
    if (ph != null && ph < 5.5)
      verified.push({
        topic: "Soil improvement",
        text: `Soil pH around ${ph} is strongly acidic — liming may be needed; dose only from a soil test.`,
        basis: v("ph") ? "Your pH value" : "SoilGrids estimate (confirm with a test)",
      });
    verified.push({
      topic: "Fertilizer guidance",
      text: "No exact doses without a soil test. Get a Soil Health Card test (N, P, K, OC, pH, EC, S, Zn, Fe, B) before deciding fertilizer quantities.",
      basis: "Soil Health Card scheme guidance",
    });
  }
  for (const i of local.soilIndicators ?? [])
    if (i.deficient)
      verified.push({
        topic: "Nutrient deficiency",
        text: `${i.label}: ${i.detail}. Apply only as recommended on your Soil Health Card.`,
        basis: "SHC critical limits",
      });

  const rain = local.history?.annualMean;
  if (rain != null && rain < 750)
    verified.push({
      topic: "Water conservation",
      text: `Low annual rainfall (~${rain} mm): farm ponds, mulching and micro-irrigation help (PMKSY 'Per Drop More Crop' supports drip/sprinkler).`,
      basis: "ERA5 10-year mean",
    });
  for (const d of (local.agriculture?.pests ?? []).slice(0, 3))
    verified.push({
      topic: "Pest & disease risk",
      text: `${d.en} (${d.crops.join(", ")}): ${d.conditions}`,
      basis: "AgriSmart hotspot library (historical reports)",
    });
  verified.push({
    topic: "Sustainable practice",
    text: "Rotate cereals with legumes, keep residues on the field instead of burning and use integrated pest management.",
    basis: "General ICAR / FAO good practice",
  });

  if (suitability?.top?.length) {
    generated.push({
      topic: "Best crops",
      text: `${suitability.top
        .slice(0, 3)
        .map((t) => `${t.crop} (${t.score}/100)`)
        .join(", ")} for ${suitability.season}.`,
      basis: "AgriSmart suitability engine",
    });
    const avoid = suitability.avoid.filter((a) => !a.reason.startsWith("Not a")).slice(0, 3);
    if (avoid.length)
      generated.push({
        topic: "Crops to avoid",
        text: avoid.map((a) => `${a.crop}: ${a.reason}`).join("; "),
        basis: "AgriSmart suitability engine",
      });
  }
  if (previousCrop) {
    const rot = recommendRotation({
      previous: previousCrop,
      season: suitability?.season,
      soil: local.soilRegional?.value?.[0],
      topN: 3,
    });
    if (rot?.length)
      generated.push({
        topic: "Crop rotation",
        text: rot.map((r) => `${r.next} (${r.reason ?? ""})`).join("; "),
        basis: "AgriSmart rotation guide",
      });
  }
  return { verified, generated };
}
