// Crop health problems that matter in India, with where and when they strike.
//
// Each entry:
//   type        Fungal · Bacterial · Viral · Oomycete · Insect pest · Nutrient · Abiotic
//   pathogen    causal organism (scientific name)
//   crops       affected crops ("*" = any crop)
//   seasons     Kharif · Rabi · Zaid · Year-round
//   states      known hotspot states/UTs (names match STATES in indiaAgri.js; "*" = everywhere)
//   conditions  weather/field conditions that favour it
//   signs       what to look for in the field
//   spread      how it moves between plants and fields
//   symptoms    ids from SYMPTOMS (used by the symptom matcher)
//   signature   expected dominant colour classes from analyzeLeafPixels()
//   care        integrated management, least-toxic options first
//
// Hotspots summarise ICAR / state agriculture department reports of where a problem
// is historically common — they are not live outbreak data. Management notes are
// general guidance: confirm with your KVK or plant clinic before spraying.

export const SEASON_ORDER = ["Kharif", "Rabi", "Zaid", "Year-round"];

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

const NW_PLAINS = ["Punjab", "Haryana", "Delhi", "Chandigarh"];
const RICE_BELT = [
  "West Bengal",
  "Odisha",
  "Andhra Pradesh",
  "Telangana",
  "Tamil Nadu",
  "Bihar",
  "Uttar Pradesh",
  "Chhattisgarh",
  "Assam",
  "Punjab",
];
const NORTH_HILLS = ["Himachal Pradesh", "Uttarakhand", "Jammu & Kashmir"];

export const DISEASES = [
  // ---------------------------------------------------------------- rice
  {
    id: "blast",
    en: "Rice blast",
    hi: "धान का झोंका रोग",
    type: "Fungal",
    pathogen: "Magnaporthe oryzae",
    crops: ["Rice"],
    seasons: ["Kharif", "Rabi"],
    states: [
      ...NORTH_HILLS,
      "Karnataka",
      "Tamil Nadu",
      "Andhra Pradesh",
      "Telangana",
      "Odisha",
      "West Bengal",
      "Assam",
      "Manipur",
      "Meghalaya",
      "Chhattisgarh",
    ],
    conditions: "Cool nights (20–25 °C), long dew periods, high humidity and excess nitrogen.",
    signs:
      "Spindle-shaped spots with grey centres and brown edges on leaves; neck turns black and the panicle breaks (neck blast).",
    spread: "Airborne spores from infected stubble and weeds; seed-borne.",
    symptoms: ["spots", "blight"],
    signature: ["brown", "white"],
    care: [
      "Avoid excess nitrogen; split urea",
      "Use resistant varieties and treated seed",
      "Fungicide only on expert advice (e.g. tricyclazole)",
    ],
  },
  {
    id: "bacterial-blight",
    en: "Bacterial leaf blight",
    hi: "जीवाणु पत्ती झुलसा",
    type: "Bacterial",
    pathogen: "Xanthomonas oryzae pv. oryzae",
    crops: ["Rice"],
    seasons: ["Kharif"],
    states: [
      "Punjab",
      "Haryana",
      "Bihar",
      "Uttar Pradesh",
      "Andhra Pradesh",
      "Telangana",
      "Tamil Nadu",
      "Odisha",
      "West Bengal",
      "Chhattisgarh",
    ],
    conditions: "Warm (25–34 °C) weather with heavy rain, strong wind and flooding.",
    signs:
      "Wavy yellow-to-white stripes from the leaf tip down the margins; leaves dry to straw colour; seedlings wilt (kresek).",
    spread: "Rain splash, irrigation water and wounds; survives on stubble and weeds.",
    symptoms: ["yellowing", "blight", "wilting"],
    signature: ["yellow", "brown"],
    care: ["Drain field periodically", "Avoid excess N; apply potash", "Remove infected stubble"],
  },
  {
    id: "brown-spot",
    en: "Brown spot",
    hi: "भूरा धब्बा रोग",
    type: "Fungal",
    pathogen: "Bipolaris oryzae",
    crops: ["Rice"],
    seasons: ["Kharif"],
    states: ["Odisha", "West Bengal", "Bihar", "Jharkhand", "Chhattisgarh", "Assam", "Madhya Pradesh"],
    conditions: "Nutrient-poor or drought-stressed soils, especially upland rice; warm humid spells.",
    signs: "Oval brown spots with grey centres, like sesame seeds, scattered over leaves and grain husks.",
    spread: "Seed-borne and airborne; worse where potassium or silicon is low.",
    symptoms: ["spots"],
    signature: ["brown", "dark"],
    care: ["Correct nutrient deficiency (K, Si)", "Use healthy treated seed", "Maintain field moisture"],
  },
  {
    id: "sheath-blight",
    en: "Sheath blight",
    hi: "आच्छद झुलसा",
    type: "Fungal",
    pathogen: "Rhizoctonia solani",
    crops: ["Rice"],
    seasons: ["Kharif"],
    states: [...RICE_BELT, "Haryana", "Kerala"],
    conditions: "Hot humid weather (28–32 °C), dense planting and high nitrogen.",
    signs: "Oval greenish-grey blotches with brown borders on leaf sheaths near the water line, spreading upward.",
    spread: "Soil-borne sclerotia floating in irrigation water; plant-to-plant contact.",
    symptoms: ["spots", "blight"],
    signature: ["brown", "white"],
    care: [
      "Wider spacing and balanced N",
      "Remove weed hosts on bunds",
      "Validamycin / hexaconazole only on expert advice",
    ],
  },
  {
    id: "brown-planthopper",
    en: "Brown planthopper",
    hi: "भूरा फुदका",
    type: "Insect pest",
    pathogen: "Nilaparvata lugens",
    crops: ["Rice"],
    seasons: ["Kharif"],
    states: [
      "Andhra Pradesh",
      "Telangana",
      "Tamil Nadu",
      "Odisha",
      "West Bengal",
      "Kerala",
      "Karnataka",
      "Punjab",
      "Haryana",
    ],
    conditions: "Dense canopy, standing water, excess nitrogen and humid late-season weather (Sept–Oct).",
    signs:
      'Circular patches of yellowing then dried plants ("hopper burn"); brown insects cluster at the base of tillers.',
    spread: "Adults fly between fields; populations explode after misuse of broad-spectrum insecticides.",
    symptoms: ["yellowing", "wilting", "blight"],
    signature: ["yellow", "brown"],
    care: [
      "Alternate wetting and drying; make 30 cm alleys every 2 m",
      "Avoid excess N and synthetic pyrethroids",
      "Spray at the base only on expert advice when above threshold",
    ],
  },
  {
    id: "stem-borer",
    en: "Yellow stem borer",
    hi: "पीला तना छेदक",
    type: "Insect pest",
    pathogen: "Scirpophaga incertulas",
    crops: ["Rice"],
    seasons: ["Kharif"],
    states: RICE_BELT,
    conditions: "Continuous rice cropping and stubble left in the field.",
    signs: 'Central shoot dries ("dead heart") in young crops; empty white panicles ("white ear") at heading.',
    spread: "Moths lay egg masses on leaf tips; larvae bore into stems.",
    symptoms: ["wilting", "holes"],
    signature: ["healthy", "brown"],
    care: [
      "Clip seedling tips before transplanting",
      "Pheromone traps; collect egg masses",
      "Release Trichogramma; insecticide only above threshold",
    ],
  },

  // ---------------------------------------------------------------- wheat, barley, mustard
  {
    id: "rust",
    en: "Rust (yellow / brown / black)",
    hi: "रतुआ रोग",
    type: "Fungal",
    pathogen: "Puccinia spp.",
    crops: ["Wheat", "Barley", "Groundnut", "Soybean", "Pea"],
    seasons: ["Rabi", "Kharif"],
    states: [...NW_PLAINS, ...NORTH_HILLS, "Uttar Pradesh", "Madhya Pradesh", "Maharashtra", "Karnataka", "Gujarat"],
    conditions:
      "Yellow rust: cool 10–15 °C in the north-west plains and hills. Brown rust: 15–25 °C, everywhere. Black rust: warm 20–30 °C in central and peninsular India.",
    signs:
      "Powdery pustules — yellow in stripes, brown scattered, or black elongated on stems — that rub off on fingers.",
    spread: "Wind carries spores long distances; first foci often appear in the foothills.",
    symptoms: ["rust", "spots", "yellowing"],
    signature: ["yellow", "brown"],
    care: [
      "Grow rust-resistant varieties",
      "Timely sowing",
      "Fungicide (e.g. propiconazole) on expert advice at first appearance",
    ],
  },
  {
    id: "karnal-bunt",
    en: "Karnal bunt",
    hi: "करनाल बंट",
    type: "Fungal",
    pathogen: "Tilletia indica",
    crops: ["Wheat"],
    seasons: ["Rabi"],
    states: [...NW_PLAINS, "Uttar Pradesh", "Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir", "Rajasthan"],
    conditions: "Cloudy, humid weather with light rain during ear emergence (Feb–Mar).",
    signs: "Grains partly turned into black powder along the groove; crushed grain smells fishy.",
    spread: "Soil- and seed-borne; spores infect at flowering. A quarantine disease that affects grain trade.",
    symptoms: ["rot"],
    signature: ["dark", "brown"],
    care: [
      "Use certified clean seed",
      "Avoid irrigation during heading in cloudy weather",
      "Propiconazole at ear emergence only on expert advice",
    ],
  },
  {
    id: "powdery-mildew",
    en: "Powdery mildew",
    hi: "चूर्णिल आसिता",
    type: "Fungal",
    pathogen: "Erysiphales (e.g. Blumeria graminis, Oidium mangiferae)",
    crops: ["Wheat", "Pea", "Mango", "Grapes", "Cucumber", "Okra", "Chilli"],
    seasons: ["Rabi", "Zaid"],
    states: [
      "Himachal Pradesh",
      "Uttarakhand",
      "Punjab",
      "Haryana",
      "Uttar Pradesh",
      "Maharashtra",
      "Karnataka",
      "Andhra Pradesh",
    ],
    conditions: "Dry days with cool nights and moderate humidity; shaded, crowded canopy.",
    signs: "White talc-like patches on leaves, stems and young fruit; leaves yellow and curl.",
    spread: "Airborne spores; does not need free water to infect.",
    symptoms: ["powdery", "yellowing"],
    signature: ["white", "yellow"],
    care: [
      "Improve air flow; avoid dense canopy",
      "Wettable sulphur sprays on expert advice",
      "Remove infected leaves",
    ],
  },
  {
    id: "white-rust",
    en: "White rust of mustard",
    hi: "सरसों का सफ़ेद रतुआ",
    type: "Oomycete",
    pathogen: "Albugo candida",
    crops: ["Mustard"],
    seasons: ["Rabi"],
    states: ["Rajasthan", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Punjab", "West Bengal", "Gujarat"],
    conditions: "Cool (12–18 °C), humid or foggy weather in December–January.",
    signs: 'Raised white blisters on the underside of leaves; swollen, twisted flower stalks ("stag head").',
    spread: "Soil-borne oospores and airborne spores; worse with late sowing.",
    symptoms: ["powdery", "spots", "curl"],
    signature: ["white", "yellow"],
    care: [
      "Sow on time (October)",
      "Seed treatment with metalaxyl",
      "Remove stag-head plants; spray only on expert advice",
    ],
  },

  // ---------------------------------------------------------------- vegetables
  {
    id: "early-blight",
    en: "Early blight",
    hi: "अगेती झुलसा",
    type: "Fungal",
    pathogen: "Alternaria solani",
    crops: ["Tomato", "Potato", "Brinjal"],
    seasons: ["Kharif", "Rabi"],
    states: ["Maharashtra", "Karnataka", "Andhra Pradesh", "Madhya Pradesh", "Uttar Pradesh", "Gujarat", "West Bengal"],
    conditions: "Warm (24–29 °C) weather alternating between wet and dry; stressed, older plants.",
    signs: 'Brown spots with concentric "target" rings on older leaves first, with a yellow halo.',
    spread: "Soil and crop debris; rain splash.",
    symptoms: ["spots", "yellowing"],
    signature: ["brown", "yellow"],
    care: ["Crop rotation (non-solanaceous)", "Remove lower infected leaves", "Mulch to stop soil splash"],
  },
  {
    id: "late-blight",
    en: "Late blight",
    hi: "पछेती झुलसा",
    type: "Oomycete",
    pathogen: "Phytophthora infestans",
    crops: ["Potato", "Tomato"],
    seasons: ["Rabi", "Kharif"],
    states: [
      ...NW_PLAINS,
      "Uttar Pradesh",
      "Bihar",
      "West Bengal",
      "Himachal Pradesh",
      "Uttarakhand",
      "Meghalaya",
      "Tamil Nadu",
    ],
    conditions:
      "Cool (10–20 °C), foggy or cloudy weather with humidity above 90% — plains in Dec–Jan, hills in the monsoon.",
    signs: "Water-soaked dark patches that spread fast; white mould on the leaf underside; tubers rot.",
    spread: "Infected seed tubers and airborne spores; can destroy a field within a week.",
    symptoms: ["blight", "rot", "wilting"],
    signature: ["dark", "brown"],
    care: [
      "Use certified disease-free seed tubers",
      "Avoid overhead irrigation in cool humid weather",
      "Protective fungicide schedule on expert advice",
    ],
  },
  {
    id: "leaf-curl",
    en: "Leaf curl virus",
    hi: "पत्ती मोड़क विषाणु",
    type: "Viral",
    pathogen: "Begomoviruses (ToLCV, CLCuV)",
    crops: ["Tomato", "Chilli", "Cotton", "Papaya"],
    seasons: ["Kharif", "Zaid"],
    states: ["Punjab", "Haryana", "Rajasthan", "Karnataka", "Andhra Pradesh", "Telangana", "Maharashtra", "Tamil Nadu"],
    conditions: "Hot, dry weather that favours whitefly build-up.",
    signs: "Leaves curl upward, thicken and turn leathery; plants are stunted with few fruits.",
    spread:
      "Whitefly (Bemisia tabaci); not seed-borne. Cotton leaf curl is concentrated in the north-west cotton zone.",
    symptoms: ["curl", "yellowing"],
    signature: ["yellow", "healthy"],
    care: [
      "Control whitefly with yellow sticky traps",
      "Remove and destroy infected plants early",
      "Use tolerant hybrids; no cure once infected",
    ],
  },
  {
    id: "mosaic",
    en: "Yellow mosaic / mosaic viruses",
    hi: "पीला मोज़ेक / मोज़ेक विषाणु",
    type: "Viral",
    pathogen: "Begomoviruses and potyviruses (YVMV, MYMV, PRSV)",
    crops: ["Okra", "Cucumber", "Bottle gourd", "Papaya", "Soybean", "Tomato", "Green Gram", "Black Gram"],
    seasons: ["Kharif", "Zaid"],
    states: ["Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Bihar", "Punjab", "Rajasthan", "Andhra Pradesh"],
    conditions: "Warm weather with high whitefly or aphid populations.",
    signs: "Bright yellow and green mottled leaves, vein clearing; small, deformed pods or fruit.",
    spread: "Whiteflies (okra, pulses, soybean) or aphids (papaya, cucurbits).",
    symptoms: ["curl", "yellowing"],
    signature: ["yellow", "healthy"],
    care: ["Control aphids / whitefly vectors", "Rogue infected plants", "Grow resistant varieties"],
  },
  {
    id: "wilt",
    en: "Fusarium / bacterial wilt",
    hi: "उकठा / म्लानि रोग",
    type: "Soil-borne",
    pathogen: "Fusarium oxysporum, Ralstonia solanacearum",
    crops: ["Chickpea", "Tomato", "Brinjal", "Banana", "Cotton", "Pigeon Pea"],
    seasons: ["Rabi", "Kharif"],
    states: [
      "Madhya Pradesh",
      "Maharashtra",
      "Rajasthan",
      "Uttar Pradesh",
      "Karnataka",
      "Kerala",
      "Odisha",
      "West Bengal",
      "Bihar",
    ],
    conditions: "Warm soil; Fusarium in drier chickpea and pigeon-pea areas, bacterial wilt in acidic, humid soils.",
    signs: "Plants droop and yellow from the bottom up; split stem shows brown vascular streaks.",
    spread: "Soil, water and infected seed or planting material; survives for years in soil.",
    symptoms: ["wilting", "yellowing"],
    signature: ["yellow", "brown"],
    care: ["Seed treatment with Trichoderma", "Long crop rotation", "Avoid waterlogging; use resistant varieties"],
  },
  {
    id: "anthracnose",
    en: "Anthracnose",
    hi: "एन्थ्रेक्नोज़",
    type: "Fungal",
    pathogen: "Colletotrichum spp.",
    crops: ["Mango", "Chilli", "Banana", "Grapes", "Soybean"],
    seasons: ["Kharif", "Year-round"],
    states: ["Uttar Pradesh", "Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "Kerala", "Tamil Nadu"],
    conditions: "Warm, humid and rainy weather, especially at flowering and fruit set.",
    signs: "Sunken dark spots on fruit and leaves; blossoms turn black; twigs die back from the tip.",
    spread: "Rain splash from infected twigs and fruit.",
    symptoms: ["spots", "rot"],
    signature: ["dark", "brown"],
    care: ["Prune and destroy infected twigs", "Avoid wetting foliage", "Copper fungicide on expert advice"],
  },

  // ---------------------------------------------------------------- field & cash crops
  {
    id: "fall-armyworm",
    en: "Fall armyworm",
    hi: "फॉल आर्मीवर्म",
    type: "Insect pest",
    pathogen: "Spodoptera frugiperda",
    crops: ["Maize", "Sorghum"],
    seasons: ["Kharif", "Rabi"],
    states: [
      "Karnataka",
      "Andhra Pradesh",
      "Telangana",
      "Tamil Nadu",
      "Maharashtra",
      "Madhya Pradesh",
      "Gujarat",
      "Bihar",
      "Rajasthan",
      "Odisha",
      "West Bengal",
    ],
    conditions: "Warm weather; an invasive pest first reported in Karnataka in 2018 and now nationwide.",
    signs: 'Ragged holes and sawdust-like droppings in the whorl; larvae have an inverted "Y" on the head.',
    spread: "Strong-flying moths travel hundreds of kilometres.",
    symptoms: ["holes"],
    signature: ["healthy", "brown"],
    care: [
      "Timely sowing and pheromone traps (15/ha)",
      "Put sand + lime in the whorl; release egg parasitoids",
      "Biopesticides (Bt, Metarhizium) first; chemicals only on expert advice",
    ],
  },
  {
    id: "pink-bollworm",
    en: "Pink bollworm",
    hi: "गुलाबी सुंडी",
    type: "Insect pest",
    pathogen: "Pectinophora gossypiella",
    crops: ["Cotton"],
    seasons: ["Kharif"],
    states: [
      "Maharashtra",
      "Gujarat",
      "Telangana",
      "Andhra Pradesh",
      "Karnataka",
      "Madhya Pradesh",
      "Punjab",
      "Haryana",
      "Rajasthan",
    ],
    conditions: "Long-duration and late cotton, leftover stalks and gin trash; resistant to Bt cotton.",
    signs: "Flowers stay closed like a rosette; bolls have small exit holes and stained, damaged lint.",
    spread: "Moths emerge from previous season's debris and cotton seed stores.",
    symptoms: ["holes", "rot"],
    signature: ["healthy", "brown"],
    care: [
      "Terminate the crop on time; no ratoon",
      "Pheromone traps / mating disruption",
      "Destroy stalks and gin waste before the next season",
    ],
  },
  {
    id: "red-rot",
    en: "Red rot of sugarcane",
    hi: "गन्ने का लाल सड़न",
    type: "Fungal",
    pathogen: "Colletotrichum falcatum",
    crops: ["Sugarcane"],
    seasons: ["Kharif", "Year-round"],
    states: ["Uttar Pradesh", "Bihar", "Punjab", "Haryana", "Uttarakhand", "Tamil Nadu", "Andhra Pradesh"],
    conditions: "Monsoon rain, waterlogging and repeated planting of a susceptible variety.",
    signs: "Upper leaves dry from the edges; split cane is red inside with white cross-bands and smells sour.",
    spread: "Infected setts, irrigation water and rain splash.",
    symptoms: ["wilting", "rot", "yellowing"],
    signature: ["yellow", "brown"],
    care: [
      "Plant healthy setts of resistant varieties",
      "Hot-water / moist hot air sett treatment",
      "Uproot and burn affected clumps; rotate the field",
    ],
  },
  {
    id: "tikka",
    en: "Tikka leaf spot of groundnut",
    hi: "मूंगफली का टिक्का रोग",
    type: "Fungal",
    pathogen: "Cercospora arachidicola, Nothopassalora personata",
    crops: ["Groundnut"],
    seasons: ["Kharif"],
    states: ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Maharashtra", "Rajasthan"],
    conditions: "Warm humid weather with long leaf-wetness periods.",
    signs: "Round brown (early) or black (late) spots, often with a yellow halo; heavy leaf drop before harvest.",
    spread: "Crop debris and volunteer plants; wind and rain splash.",
    symptoms: ["spots", "yellowing"],
    signature: ["brown", "dark"],
    care: ["Rotate with cereals", "Grow tolerant varieties", "Carbendazim + mancozeb only on expert advice"],
  },
  {
    id: "downy-mildew-bajra",
    en: "Downy mildew (green ear) of pearl millet",
    hi: "बाजरे का हरित बाली रोग",
    type: "Oomycete",
    pathogen: "Sclerospora graminicola",
    crops: ["Pearl Millet"],
    seasons: ["Kharif"],
    states: ["Rajasthan", "Gujarat", "Haryana", "Maharashtra", "Uttar Pradesh"],
    conditions: "Humid weather and repeated bajra cropping with the same hybrid.",
    signs: "Pale yellow streaks with downy growth under the leaf; ears turn into twisted green leafy structures.",
    spread: "Soil-borne oospores and seed; airborne spores within the field.",
    symptoms: ["yellowing", "powdery", "curl"],
    signature: ["yellow", "white"],
    care: ["Seed treatment with metalaxyl", "Rotate hybrids; grow resistant ones", "Rogue infected plants early"],
  },
  {
    id: "sigatoka",
    en: "Sigatoka leaf spot of banana",
    hi: "केले का सिगाटोका पत्ती धब्बा",
    type: "Fungal",
    pathogen: "Pseudocercospora musae",
    crops: ["Banana"],
    seasons: ["Kharif", "Year-round"],
    states: ["Kerala", "Tamil Nadu", "Karnataka", "Maharashtra", "Assam", "West Bengal"],
    conditions: "High rainfall and humidity; dense plantations.",
    signs: "Pale yellow streaks that become brown spots with grey centres; leaves dry early and bunches stay small.",
    spread: "Wind and rain-borne spores from infected leaves.",
    symptoms: ["spots", "yellowing", "blight"],
    signature: ["brown", "yellow"],
    care: [
      "Remove and destroy infected leaves",
      "Good drainage and spacing",
      "Mineral-oil based fungicide sprays on expert advice",
    ],
  },
  {
    id: "pest-chewing",
    en: "Chewing insects (caterpillars, borers)",
    hi: "चबाने वाले कीट (इल्ली, छेदक)",
    type: "Insect pest",
    pathogen: "Helicoverpa, Spodoptera, Leucinodes and others",
    crops: ["Maize", "Cotton", "Rice", "Tomato", "Brinjal", "Cabbage", "Chickpea"],
    seasons: ["Kharif", "Rabi", "Zaid"],
    states: ["*"],
    conditions: "Warm weather; outbreaks after cloudy, humid spells.",
    signs: "Holes in leaves, pods or fruit; droppings near the feeding site; bored shoots wither.",
    spread: "Moths lay eggs on host plants; larvae move between neighbouring plants.",
    symptoms: ["holes"],
    signature: ["healthy", "brown"],
    care: [
      "Scout and use pheromone traps",
      "Hand-pick egg masses / larvae",
      "Neem-based or biological controls first (Bt, NPV)",
    ],
  },

  // ---------------------------------------------------------------- non-infectious
  {
    id: "nitrogen",
    en: "Nitrogen deficiency",
    hi: "नाइट्रोजन की कमी",
    type: "Nutrient",
    pathogen: "—",
    crops: ["*"],
    seasons: ["Kharif", "Rabi", "Zaid"],
    states: ["*"],
    conditions: "Sandy or low-organic-matter soils, heavy rain leaching, or skipped top-dressing.",
    signs: "Uniform pale-yellow colour starting on the oldest (lower) leaves; slow, thin growth.",
    spread: "Not contagious — a soil nutrient problem.",
    symptoms: ["yellowing"],
    signature: ["yellow"],
    care: [
      "Uniform yellowing of older leaves suggests N deficiency",
      "Top-dress urea in splits",
      "Confirm with leaf colour chart / soil test",
    ],
  },
  {
    id: "water-stress",
    en: "Water stress",
    hi: "पानी की कमी",
    type: "Abiotic",
    pathogen: "—",
    crops: ["*"],
    seasons: ["Kharif", "Rabi", "Zaid"],
    states: ["*"],
    conditions: "Dry spells, heat waves, or irrigation gaps at critical stages.",
    signs: "Leaves roll or droop in the afternoon and recover at night; edges scorch in severe cases.",
    spread: "Not contagious.",
    symptoms: ["wilting"],
    signature: ["yellow", "brown"],
    care: ["Check soil moisture at root depth", "Irrigate in morning/evening", "Mulch to retain moisture"],
  },
];

export const DISEASE_TYPES = [...new Set(DISEASES.map((d) => d.type))].sort();
export const DISEASE_CROPS = [...new Set(DISEASES.flatMap((d) => d.crops).filter((c) => c !== "*"))].sort();

/** True when a problem is known to occur in `state` (any state if empty). */
export const occursIn = (disease, state) => !state || disease.states.includes("*") || disease.states.includes(state);

/** Problems for a state, season, crop and type (each filter optional). */
export function filterDiseases({ state = "", season = "", crop = "", type = "" } = {}) {
  return DISEASES.filter(
    (d) =>
      occursIn(d, state) &&
      (!season || d.seasons.includes(season) || d.seasons.includes("Year-round")) &&
      (!crop || d.crops.includes(crop) || d.crops.includes("*")) &&
      (!type || d.type === type),
  );
}

/**
 * Rank likely problems from crop, reported symptoms and image colour shares.
 * State and season add a small boost for problems known to occur there and then.
 */
export function rankDiseases({ crop, symptoms = [], pct, state = "", season = "" }) {
  return DISEASES.map((d) => {
    let score = 0;
    if (d.crops.includes(crop)) score += 3;
    else if (d.crops.includes("*")) score += 1;
    else score -= 2;
    score += symptoms.filter((s) => d.symptoms.includes(s)).length * 3;
    if (pct) {
      const dominant = Object.entries(pct)
        .filter(([k]) => k !== "healthy")
        .sort((a, b) => b[1] - a[1]);
      d.signature.forEach((sig, i) => {
        if (sig !== "healthy") score += Math.min(pct[sig] ?? 0, 40) / (10 * (i + 1));
      });
      if (dominant[0] && d.signature[0] === dominant[0][0] && dominant[0][1] > 3) score += 1.5;
    }
    if (state && !d.states.includes("*")) score += d.states.includes(state) ? 1.5 : -1;
    if (season && !d.seasons.includes("Year-round")) score += d.seasons.includes(season) ? 1 : -1;
    return { ...d, score };
  })
    .filter((d) => d.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}
