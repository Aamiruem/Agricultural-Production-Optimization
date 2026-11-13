// Common crop health problems in India with the visual signature used by the
// leaf-image screening and symptom matcher. Management notes are general
// integrated-pest-management guidance; confirm with a KVK / plant clinic before spraying.

// signature: expected dominant colour classes from analyzeLeafPixels()
export const SYMPTOMS = [
  { id: "spots", en: "Leaf spots or lesions", hi: "पत्तियों पर धब्बे" },
  { id: "yellowing", en: "Yellowing leaves", hi: "पत्तियों का पीला पड़ना" },
  { id: "wilting", en: "Wilting / drooping", hi: "मुरझाना" },
  { id: "powdery", en: "White powdery growth", hi: "सफ़ेद पाउडर जैसी परत" },
  { id: "rust", en: "Orange-brown pustules (rust)", hi: "नारंगी-भूरे फफोले (रतुआ)" },
  { id: "curl", en: "Leaf curling / mosaic", hi: "पत्ती मुड़ना / चितकबरापन" },
  { id: "blight", en: "Large dead / burnt patches", hi: "बड़े झुलसे हुए हिस्से" },
  { id: "holes", en: "Holes / chewing damage", hi: "छेद / कीट द्वारा खाना" },
  { id: "rot", en: "Fruit or stem rot", hi: "फल या तना सड़न" },
];

export const DISEASES = [
  { id: "blast", en: "Rice blast", hi: "धान का झोंका रोग", crops: ["Rice"], symptoms: ["spots", "blight"], signature: ["brown", "white"], type: "Fungal",
    care: ["Avoid excess nitrogen; split urea", "Use resistant varieties and treated seed", "Fungicide only on expert advice (e.g. tricyclazole)"] },
  { id: "bacterial-blight", en: "Bacterial leaf blight", hi: "जीवाणु पत्ती झुलसा", crops: ["Rice"], symptoms: ["yellowing", "blight", "wilting"], signature: ["yellow", "brown"], type: "Bacterial",
    care: ["Drain field periodically", "Avoid excess N; apply potash", "Remove infected stubble"] },
  { id: "brown-spot", en: "Brown spot", hi: "भूरा धब्बा रोग", crops: ["Rice"], symptoms: ["spots"], signature: ["brown", "dark"], type: "Fungal",
    care: ["Correct nutrient deficiency (K, Si)", "Use healthy treated seed", "Maintain field moisture"] },
  { id: "rust", en: "Rust (yellow / brown / black)", hi: "रतुआ रोग", crops: ["Wheat", "Barley", "Groundnut", "Soybean", "Pea"], symptoms: ["rust", "spots", "yellowing"], signature: ["yellow", "brown"], type: "Fungal",
    care: ["Grow rust-resistant varieties", "Timely sowing", "Fungicide (e.g. propiconazole) on expert advice at first appearance"] },
  { id: "powdery-mildew", en: "Powdery mildew", hi: "चूर्णिल आसिता", crops: ["Wheat", "Pea", "Mango", "Grapes", "Cucumber", "Okra", "Chilli"], symptoms: ["powdery", "yellowing"], signature: ["white", "yellow"], type: "Fungal",
    care: ["Improve air flow; avoid dense canopy", "Wettable sulphur sprays on expert advice", "Remove infected leaves"] },
  { id: "early-blight", en: "Early blight", hi: "अगेती झुलसा", crops: ["Tomato", "Potato", "Brinjal"], symptoms: ["spots", "yellowing"], signature: ["brown", "yellow"], type: "Fungal",
    care: ["Crop rotation (non-solanaceous)", "Remove lower infected leaves", "Mulch to stop soil splash"] },
  { id: "late-blight", en: "Late blight", hi: "पछेती झुलसा", crops: ["Potato", "Tomato"], symptoms: ["blight", "rot", "wilting"], signature: ["dark", "brown"], type: "Oomycete",
    care: ["Use certified disease-free seed tubers", "Avoid overhead irrigation in cool humid weather", "Protective fungicide schedule on expert advice"] },
  { id: "leaf-curl", en: "Leaf curl virus", hi: "पत्ती मोड़क विषाणु", crops: ["Tomato", "Chilli", "Cotton", "Papaya"], symptoms: ["curl", "yellowing"], signature: ["yellow", "healthy"], type: "Viral (whitefly-borne)",
    care: ["Control whitefly with yellow sticky traps", "Remove and destroy infected plants early", "Use tolerant hybrids; no cure once infected"] },
  { id: "mosaic", en: "Mosaic virus", hi: "मोज़ेक विषाणु", crops: ["Okra", "Cucumber", "Bottle gourd", "Papaya", "Soybean", "Tomato"], symptoms: ["curl", "yellowing"], signature: ["yellow", "healthy"], type: "Viral",
    care: ["Control aphids / whitefly vectors", "Rogue infected plants", "Grow resistant varieties"] },
  { id: "wilt", en: "Fusarium / bacterial wilt", hi: "उकठा / म्लानि रोग", crops: ["Chickpea", "Tomato", "Brinjal", "Banana", "Cotton", "Pigeon pea"], symptoms: ["wilting", "yellowing"], signature: ["yellow", "brown"], type: "Soil-borne",
    care: ["Seed treatment with Trichoderma", "Long crop rotation", "Avoid waterlogging; use resistant varieties"] },
  { id: "anthracnose", en: "Anthracnose", hi: "एन्थ्रेक्नोज़", crops: ["Mango", "Chilli", "Banana", "Grapes", "Soybean"], symptoms: ["spots", "rot"], signature: ["dark", "brown"], type: "Fungal",
    care: ["Prune and destroy infected twigs", "Avoid wetting foliage", "Copper fungicide on expert advice"] },
  { id: "pest-chewing", en: "Chewing insects (caterpillars, borers)", hi: "चबाने वाले कीट (इल्ली, छेदक)", crops: ["Maize", "Cotton", "Rice", "Tomato", "Brinjal", "Cabbage", "Chickpea"], symptoms: ["holes"], signature: ["healthy", "brown"], type: "Insect pest",
    care: ["Scout and use pheromone traps", "Hand-pick egg masses / larvae", "Neem-based or biological controls first (Bt, NPV)"] },
  { id: "nitrogen", en: "Nitrogen deficiency", hi: "नाइट्रोजन की कमी", crops: ["*"], symptoms: ["yellowing"], signature: ["yellow"], type: "Nutrient",
    care: ["Uniform yellowing of older leaves suggests N deficiency", "Top-dress urea in splits", "Confirm with leaf colour chart / soil test"] },
  { id: "water-stress", en: "Water stress", hi: "पानी की कमी", crops: ["*"], symptoms: ["wilting"], signature: ["yellow", "brown"], type: "Abiotic",
    care: ["Check soil moisture at root depth", "Irrigate in morning/evening", "Mulch to retain moisture"] },
];

export const DISEASE_CROPS = [...new Set(DISEASES.flatMap((d) => d.crops).filter((c) => c !== "*"))].sort();

/** Rank likely problems from crop, reported symptoms and image colour shares. */
export function rankDiseases({ crop, symptoms = [], pct }) {
  return DISEASES.map((d) => {
    let score = 0;
    if (d.crops.includes(crop)) score += 3; else if (d.crops.includes("*")) score += 1; else score -= 2;
    score += symptoms.filter((s) => d.symptoms.includes(s)).length * 3;
    if (pct) {
      const dominant = Object.entries(pct).filter(([k]) => k !== "healthy").sort((a, b) => b[1] - a[1]);
      d.signature.forEach((sig, i) => { if (sig !== "healthy") score += Math.min(pct[sig] ?? 0, 40) / (10 * (i + 1)); });
      if (dominant[0] && d.signature[0] === dominant[0][0] && dominant[0][1] > 3) score += 1.5;
    }
    return { ...d, score };
  }).filter((d) => d.score > 1).sort((a, b) => b.score - a.score).slice(0, 4);
}
