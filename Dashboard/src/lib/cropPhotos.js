// Crop photos are stored once, in frontend/react-app/public/images/crops, and shared:
// the Vite dev proxy (vite.config.js) and the gateway (infra/nginx) serve /images/*
// from the React app. Names come from the ML model ("mungbean"), the yield dataset
// ("Moong(Green Gram)", "Arhar/Tur") or the UI, so they are normalised first.

const PHOTOS = new Set([
  "apple", "arecanut", "banana", "barley", "black-gram", "black-pepper", "cardamom", "cashew", "chickpea", "chilli",
  "coconut", "coffee", "cotton", "cucumber", "finger-millet", "ginger", "green-gram", "groundnut", "jute", "lentil",
  "maize", "mango", "mustard", "onion", "orange", "pearl-millet", "peas", "pigeon-pea", "pineapple", "potato", "rice",
  "rubber", "saffron", "sesame", "sorghum", "soybean", "sugarcane", "sunflower", "tapioca", "tea", "tobacco",
  "tomato", "turmeric", "watermelon", "wheat",
]);

// normalised name (letters only) -> photo slug
const ALIASES = {
  mungbean: "green-gram", moong: "green-gram", moonggreengram: "green-gram",
  blackgram: "black-gram", urad: "black-gram",
  pigeonpeas: "pigeon-pea", pigeonpea: "pigeon-pea", arhartur: "pigeon-pea", tur: "pigeon-pea",
  gram: "chickpea", masoor: "lentil", bajra: "pearl-millet", jowar: "sorghum", ragi: "finger-millet",
  rapeseedmustard: "mustard", sesamum: "sesame", soyabean: "soybean", drychillies: "chilli", chillies: "chilli",
  cottonlint: "cotton", blackpepper: "black-pepper", cashewnut: "cashew", peasbeanspulses: "peas",
  fingermillet: "finger-millet", pearlmillet: "pearl-millet", greengram: "green-gram",
};

const normalise = (name) => String(name ?? "").toLowerCase().replace(/[^a-z]/g, "");

/** URL of the crop's photo, or null when the library has none (e.g. grapes, papaya). */
export function cropPhotoUrl(name) {
  const key = normalise(name);
  if (!key) return null;
  const slug = ALIASES[key] ?? [...PHOTOS].find((s) => s.replace(/-/g, "") === key);
  return slug && PHOTOS.has(slug) ? `/images/crops/${slug}.webp` : null;
}
