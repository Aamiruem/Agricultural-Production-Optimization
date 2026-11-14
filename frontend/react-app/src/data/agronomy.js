// Agronomy reference for the Knowledge hub (/learn): the project's ML pipeline,
// core terms, farming systems, seasons, nutrients, yield factors, field practices,
// formulas (with calculators) and how AI/ML is used — each linked to the app page
// or AIML module that implements it.

export const PIPELINE = [
  {
    title: "Agricultural dataset",
    hi: "कृषि डेटासेट",
    icon: "table_chart",
    text: "Crop recommendation (2,200 rows, 22 crops), state crop yield 1997–2020 (19,689 rows) and daily Ludhiana weather.",
    link: { to: "/data-dashboard", label: "Data studio" },
  },
  {
    title: "Data collection",
    hi: "डेटा संग्रह",
    icon: "download",
    text: "Public datasets plus live Open-Meteo weather, downloaded and versioned by AIML/data/download.py.",
    link: { to: "/weather", label: "Live weather" },
  },
  {
    title: "Data preprocessing",
    hi: "डेटा पूर्व-प्रसंस्करण",
    icon: "filter_alt",
    text: "Clean names, drop impossible yields and outliers, encode state / crop / season, split by year.",
    code: "AIML/preprocessing/",
  },
  {
    title: "Exploratory data analysis",
    hi: "अन्वेषणात्मक विश्लेषण",
    icon: "query_stats",
    text: "Distributions, correlations and yield trends by crop and state.",
    link: { to: "/reports", label: "Reports" },
  },
  {
    title: "Feature engineering",
    hi: "फ़ीचर इंजीनियरिंग",
    icon: "tune",
    text: "Log of cultivated area, annual rainfall, fertilizer and pesticide per hectare, crop-year trend.",
    code: "AIML/preprocessing/yield_features.py",
  },
  {
    title: "Machine learning model",
    hi: "मशीन लर्निंग मॉडल",
    icon: "psychology",
    text: "Linear models, Random Forest, Gradient Boosting and XGBoost compared; the best is served with SHAP explanations.",
    link: { to: "/insights", label: "Model insights" },
  },
  {
    title: "Crop yield prediction",
    hi: "फसल उपज पूर्वानुमान",
    icon: "trending_up",
    text: "XGBoost forecasts t/ha and total production for a state, crop, season, year and field area.",
    link: { to: "/yield-prediction", label: "Yield forecast" },
  },
  {
    title: "Farmer recommendation system",
    hi: "किसान सलाह प्रणाली",
    icon: "agriculture",
    text: "Best crop for the soil and climate, fertilizer doses, irrigation plan and an AI assistant.",
    link: { to: "/crop-recommendation", label: "Crop advisor" },
  },
];

export const GLOSSARY = [
  { term: "Agriculture", hi: "कृषि", text: "Cultivation of crops and rearing of animals for food and other products." },
  {
    term: "Agricultural production",
    hi: "कृषि उत्पादन",
    text: "Process of producing crops, livestock and other agricultural goods.",
  },
  {
    term: "Cropping system",
    hi: "फसल प्रणाली",
    text: "Crops grown on a particular piece of land over a specific period, and how they are managed.",
    example: "Rice–wheat system of the Indo-Gangetic plains",
  },
  {
    term: "Cropping pattern",
    hi: "फसल प्रतिरूप",
    text: "Yearly arrangement and distribution of crops in a region.",
    example: "Kharif rice followed by rabi pulses in Odisha",
  },
  {
    term: "Crop rotation",
    hi: "फसल चक्र",
    text: "Growing different crops one after another on the same land.",
    example: "Cotton → wheat → moong",
    link: "/rotation-planner",
  },
  {
    term: "Mixed cropping",
    hi: "मिश्रित खेती",
    text: "Growing two or more crops together without a distinct row arrangement.",
    example: "Wheat + mustard broadcast together",
  },
  {
    term: "Intercropping",
    hi: "अंतःफसल",
    text: "Growing two or more crops together in a definite row pattern.",
    example: "Soybean + pigeon pea in 4 : 2 rows",
  },
  {
    term: "Monocropping",
    hi: "एकल फसल",
    text: "Growing a single crop repeatedly on the same land.",
    example: "Continuous sugarcane — raises pest and nutrient problems",
  },
  {
    term: "Multiple cropping",
    hi: "बहु फसल",
    text: "Growing more than one crop on the same land in one year.",
    example: "Rice (kharif) → potato (rabi) → moong (zaid)",
  },
  {
    term: "Sustainable agriculture",
    hi: "सतत कृषि",
    text: "Farming that keeps land productive while protecting soil, water and biodiversity.",
  },
];

export const FARMING_SYSTEMS = [
  {
    name: "Subsistence farming",
    hi: "निर्वाह खेती",
    feature: "Production mainly for family consumption",
    example: "Small upland rice farms in Jharkhand and Odisha",
  },
  {
    name: "Commercial farming",
    hi: "वाणिज्यिक खेती",
    feature: "Production for the market",
    example: "Sugarcane in Uttar Pradesh, cotton in Gujarat",
  },
  {
    name: "Intensive farming",
    hi: "गहन खेती",
    feature: "High inputs per unit of land",
    example: "Rice–wheat in Punjab and Haryana",
  },
  {
    name: "Extensive farming",
    hi: "विस्तृत खेती",
    feature: "Large land area, lower input intensity",
    example: "Rainfed bajra in western Rajasthan",
  },
  {
    name: "Organic farming",
    hi: "जैविक खेती",
    feature: "Organic inputs and ecological practices",
    example: "Sikkim — declared fully organic in 2016",
  },
  {
    name: "Mixed farming",
    hi: "मिश्रित कृषि",
    feature: "Crops and livestock together",
    example: "Crops with dairy cattle, common across India",
  },
  {
    name: "Integrated farming",
    hi: "एकीकृत खेती",
    feature: "Several interconnected farm enterprises",
    example: "Rice–fish–duck systems in Assam and West Bengal",
  },
  {
    name: "Precision farming",
    hi: "सटीक खेती",
    feature: "Technology-based, site-specific management",
    example: "Drip fertigation with sensors in Maharashtra horticulture",
  },
  {
    name: "Dryland farming",
    hi: "शुष्क भूमि खेती",
    feature: "Farming with limited rainfall (< 750 mm)",
    example: "Marathwada, Anantapur and western Rajasthan",
  },
  {
    name: "Irrigated farming",
    hi: "सिंचित खेती",
    feature: "Crops supported by assured irrigation",
    example: "Canal-irrigated Punjab and Haryana",
  },
];

export const CROP_SEASONS = [
  {
    season: "Kharif",
    sowing: "June – July",
    harvest: "September – October",
    image: "/images/kharif-season.webp",
    crops: ["Rice", "Maize", "Cotton", "Soybean", "Groundnut", "Pearl Millet"],
    note: "Sown with the south-west monsoon.",
  },
  {
    season: "Rabi",
    sowing: "October – December",
    harvest: "March – April",
    image: "/images/rabi-season.webp",
    crops: ["Wheat", "Mustard", "Chickpea", "Barley", "Lentil", "Peas"],
    note: "Grown on residual moisture and winter irrigation.",
  },
  {
    season: "Zaid",
    sowing: "March – June",
    harvest: "June – July",
    image: "/images/zaid-horticulture.webp",
    crops: ["Watermelon", "Cucumber", "Muskmelon", "Green Gram"],
    note: "Short, irrigated summer season between rabi and kharif.",
  },
];

export const NUTRIENTS = [
  {
    symbol: "N",
    name: "Nitrogen",
    hi: "नाइट्रोजन",
    group: "Primary",
    role: "Leaf and vegetative growth; protein and chlorophyll.",
    deficiency: "Pale yellow older leaves, stunted thin plants.",
    sources: "Urea (46% N), DAP (18% N), compost",
  },
  {
    symbol: "P",
    name: "Phosphorus",
    hi: "फॉस्फोरस",
    group: "Primary",
    role: "Root development, flowering and energy transfer.",
    deficiency: "Purplish older leaves, poor roots, delayed maturity.",
    sources: "DAP (46% P₂O₅), SSP (16% P₂O₅)",
  },
  {
    symbol: "K",
    name: "Potassium",
    hi: "पोटैशियम",
    group: "Primary",
    role: "Water regulation, disease resistance, grain filling.",
    deficiency: "Scorched, brown margins on older leaves; weak stems.",
    sources: "MOP (60% K₂O), SOP",
  },
  {
    symbol: "Ca",
    name: "Calcium",
    hi: "कैल्शियम",
    group: "Secondary",
    role: "Cell wall development and root tips.",
    deficiency: "Tip burn on young leaves; blossom-end rot in tomato.",
    sources: "Gypsum, agricultural lime",
  },
  {
    symbol: "Mg",
    name: "Magnesium",
    hi: "मैग्नीशियम",
    group: "Secondary",
    role: "Central atom of chlorophyll.",
    deficiency: "Yellowing between veins of older leaves.",
    sources: "Magnesium sulphate, dolomite",
  },
  {
    symbol: "S",
    name: "Sulphur",
    hi: "सल्फर",
    group: "Secondary",
    role: "Protein and oil synthesis — vital for oilseeds and pulses.",
    deficiency: "Uniform yellowing of young leaves.",
    sources: "Gypsum, SSP (12% S), bentonite sulphur",
  },
  {
    symbol: "Zn",
    name: "Zinc",
    hi: "जिंक",
    group: "Micronutrient",
    role: "Enzyme activity and growth hormones.",
    deficiency: '"Khaira" in rice — rusty brown spots and stunting.',
    sources: "Zinc sulphate (21% / 33% Zn)",
  },
  {
    symbol: "Fe",
    name: "Iron",
    hi: "आयरन",
    group: "Micronutrient",
    role: "Chlorophyll formation and respiration.",
    deficiency: "Yellow young leaves with green veins, common in calcareous soils.",
    sources: "Ferrous sulphate (19% Fe) foliar spray",
  },
];

export const YIELD_FACTORS = [
  { group: "Soil", icon: "landscape", items: ["Soil fertility", "Soil pH", "Soil moisture"], link: "/soil-analysis" },
  {
    group: "Climate",
    icon: "partly_cloudy_day",
    items: ["Temperature", "Rainfall", "Humidity", "Sunlight"],
    link: "/weather",
  },
  {
    group: "Inputs",
    icon: "compost",
    items: ["Seed quality", "Fertilizer management", "Irrigation facilities"],
    link: "/fertilizer",
  },
  { group: "Protection", icon: "pest_control", items: ["Pest and disease management"], link: "/disease-detection" },
  { group: "Resources", icon: "agriculture", items: ["Agricultural machinery", "Labour availability"] },
  { group: "Market", icon: "savings", items: ["Market demand"] },
];

export const PRACTICES = [
  { step: "Land preparation", tip: "Plough and level; laser levelling saves up to a quarter of irrigation water." },
  {
    step: "Soil testing",
    tip: "Test N-P-K, pH and organic carbon every 2–3 years (Soil Health Card).",
    link: "/soil-analysis",
  },
  {
    step: "Seed selection",
    tip: "Certified seed of a variety recommended for your zone and season.",
    link: "/crop-recommendation",
  },
  { step: "Seed treatment", tip: "Fungicide or Trichoderma, plus Rhizobium for pulses, before sowing." },
  { step: "Sowing", tip: "Sow on time at the right depth and spacing; line sowing eases weeding." },
  {
    step: "Irrigation",
    tip: "Water at critical stages — e.g. crown-root initiation in wheat.",
    link: "/irrigation-optimization",
  },
  { step: "Fertilizer application", tip: "Basal P and K; nitrogen in splits by crop stage.", link: "/fertilizer" },
  { step: "Weed management", tip: "Keep the first 30–45 days weed-free; mulch or pre-emergence herbicide." },
  {
    step: "Pest management",
    tip: "Scout weekly; traps and bio-controls before chemicals.",
    link: "/disease-detection",
  },
  {
    step: "Disease management",
    tip: "Resistant varieties, rotation and timely protective sprays.",
    link: "/disease-detection",
  },
  { step: "Harvesting", tip: "Harvest at physiological maturity to limit shattering and losses." },
  { step: "Storage & marketing", tip: "Dry to safe moisture; check e-NAM and MSP before selling." },
];

// ---------------------------------------------------------------- formulas
const round = (v, d = 2) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : null);
const ratio = (a, b) => (b > 0 ? a / b : NaN);

export const FORMULAS = [
  {
    id: "yield",
    name: "Crop yield",
    formula: "Total production ÷ Cultivated area",
    unit: "t/ha",
    inputs: [
      { key: "production", label: "Total production (t)", value: 45 },
      { key: "area", label: "Cultivated area (ha)", value: 10 },
    ],
    compute: ({ production, area }) => round(ratio(production, area)),
  },
  {
    id: "intensity",
    name: "Cropping intensity",
    formula: "(Gross cropped area ÷ Net sown area) × 100",
    unit: "%",
    inputs: [
      { key: "gross", label: "Gross cropped area (ha)", value: 15 },
      { key: "net", label: "Net sown area (ha)", value: 10 },
    ],
    compute: ({ gross, net }) => round(ratio(gross, net) * 100, 1),
  },
  {
    id: "harvest-index",
    name: "Harvest index",
    formula: "(Economic yield ÷ Biological yield) × 100",
    unit: "%",
    inputs: [
      { key: "economic", label: "Economic (grain) yield (t/ha)", value: 4.5 },
      { key: "biological", label: "Biological (total) yield (t/ha)", value: 10 },
    ],
    compute: ({ economic, biological }) => round(ratio(economic, biological) * 100, 1),
  },
  {
    id: "wue",
    name: "Water use efficiency",
    formula: "Crop yield ÷ Water used",
    unit: "kg/ha per mm",
    inputs: [
      { key: "yieldKg", label: "Crop yield (kg/ha)", value: 4500 },
      { key: "water", label: "Water used (mm)", value: 450 },
    ],
    compute: ({ yieldKg, water }) => round(ratio(yieldKg, water)),
  },
  {
    id: "growth",
    name: "Production growth",
    formula: "((Current − Previous) ÷ Previous) × 100",
    unit: "%",
    inputs: [
      { key: "current", label: "Current production (t)", value: 52 },
      { key: "previous", label: "Previous production (t)", value: 45 },
    ],
    compute: ({ current, previous }) => round(ratio(current - previous, previous) * 100, 1),
  },
  {
    id: "fertilizer",
    name: "Fertilizer requirement",
    formula: "Recommended nutrient dose ÷ Nutrient fraction in fertilizer",
    unit: "kg/ha",
    inputs: [
      { key: "dose", label: "Nutrient dose (kg/ha), e.g. 120 kg N", value: 120 },
      { key: "fraction", label: "Nutrient fraction, e.g. urea = 0.46", value: 0.46, step: 0.01 },
    ],
    compute: ({ dose, fraction }) => round(ratio(dose, fraction), 1),
  },
];

// ---------------------------------------------------------------- AI / ML
// status: live = model served by the API · rules = transparent rule-based tool ·
// code = training code in AIML/ but not served · planned = not built yet
export const ML_APPLICATIONS = [
  {
    task: "Crop yield prediction",
    methods: "Linear Regression, Random Forest, XGBoost",
    status: "live",
    here: "XGBoost served by the API (R² 0.90 on log-yield); 8 models compared on a time split.",
    link: "/yield-prediction",
  },
  {
    task: "Crop recommendation",
    methods: "Decision Tree, Random Forest",
    status: "live",
    here: "Random Forest (99.3% test accuracy) with a SHAP explanation for every prediction.",
    link: "/crop-recommendation",
  },
  {
    task: "Plant disease detection",
    methods: "CNN, transfer learning",
    status: "code",
    here: "In-app: leaf colour screening + symptom and region matcher. CNN training code in AIML/computer_vision/.",
    link: "/disease-detection",
  },
  {
    task: "Soil classification",
    methods: "KNN, SVM, Random Forest",
    status: "rules",
    here: "Soil Health Card scoring of N, P, K, pH, EC and organic carbon.",
    link: "/soil-analysis",
  },
  {
    task: "Weather forecasting",
    methods: "Time series, LSTM",
    status: "code",
    here: "Live Open-Meteo forecasts in the app; LSTM / GRU sequence models in AIML/deep_learning/.",
    link: "/weather",
  },
  {
    task: "Fertilizer recommendation",
    methods: "Classification, regression",
    status: "rules",
    here: "Nutrient-gap calculator for DAP, urea and MOP doses.",
    link: "/fertilizer",
  },
  {
    task: "Market price prediction",
    methods: "Regression, time series",
    status: "planned",
    here: "Not built yet — needs mandi price data (e.g. Agmarknet).",
  },
  {
    task: "Smart irrigation",
    methods: "IoT sensors, ML",
    status: "rules",
    here: "FAO-56 water balance from live evapotranspiration (ET₀).",
    link: "/irrigation-optimization",
  },
];

export const ML_STATUS = {
  live: { label: "Live model", hi: "लाइव मॉडल", tone: "good" },
  rules: { label: "Rule-based", hi: "नियम-आधारित", tone: "info" },
  code: { label: "Training code", hi: "प्रशिक्षण कोड", tone: "warn" },
  planned: { label: "Planned", hi: "योजना में", tone: "muted" },
};
