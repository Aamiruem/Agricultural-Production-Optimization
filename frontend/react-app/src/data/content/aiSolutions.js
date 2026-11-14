// AI & machine learning in agriculture: /ai-in-agriculture. Plain data (no imports).
// `icon` is a lucide-react icon name (mapped in the page); `tool` links to a working AgriSmart tool.

export const ML_WORKFLOW = [
  {
    step: "Data Collection",
    detail: "Soil tests, weather records, satellite images, crop-yield statistics, market prices and field photos.",
  },
  {
    step: "Data Preprocessing",
    detail:
      "Clean missing values and outliers, fix units, remove duplicates and split data by season for honest testing.",
  },
  {
    step: "Feature Engineering",
    detail: "Create useful signals such as growing-degree days, rainfall anomalies, NDVI trends and nutrient ratios.",
  },
  {
    step: "ML Model Training",
    detail: "Train models such as Random Forest, gradient boosting, CNNs or LSTMs on historical examples.",
  },
  {
    step: "Model Evaluation",
    detail: "Measure accuracy, MAE, RMSE or R² on unseen data and check errors by region and crop.",
  },
  {
    step: "Prediction",
    detail: "Serve the model through an API (FastAPI) or app (Streamlit/React) for new farm inputs.",
  },
  {
    step: "Farmer Recommendations",
    detail:
      "Turn predictions into clear actions — what to sow, how much fertilizer, when to irrigate — with reasons and ranges.",
  },
];

export const AI_TECH = [
  { name: "Python", role: "Core language for data science and ML" },
  { name: "NumPy", role: "Fast numerical arrays and maths" },
  { name: "Pandas", role: "Data cleaning, joins and feature tables" },
  { name: "Scikit-learn", role: "Classical ML: Random Forest, SVM, pipelines" },
  { name: "TensorFlow", role: "Deep learning for images and time series" },
  { name: "Keras", role: "High-level API to build neural networks" },
  { name: "FastAPI", role: "Serve models as fast, typed REST APIs" },
  { name: "Streamlit", role: "Interactive data apps and dashboards" },
];

export const AI_SOLUTIONS = [
  {
    slug: "crop-recommendation",
    name: "Crop Recommendation System",
    icon: "Sprout",
    problem: "Which crop will grow best on this soil and in this climate?",
    inputs: ["Soil N, P, K", "Soil pH", "Temperature", "Humidity", "Rainfall"],
    model: "Multi-class classifier (Random Forest / gradient boosting)",
    output: "Ranked list of suitable crops with confidence and reasons",
    example:
      "A field with high nitrogen, pH 6.5 and 200 mm rainfall is matched to rice, while low-rainfall, neutral soil points to pulses such as chickpea.",
    tool: { to: "/crop-recommendation", label: "Try the crop advisor" },
  },
  {
    slug: "crop-yield-prediction",
    name: "Crop Yield Prediction",
    icon: "TrendingUp",
    problem: "How much will this field produce this season?",
    inputs: [
      "Crop and season",
      "State/district",
      "Area",
      "Rainfall and temperature",
      "Fertilizer and pesticide use",
      "Past yields",
    ],
    model: "Regression (gradient boosting, Random Forest, neural networks)",
    output: "Expected yield (t/ha) and production with an uncertainty range",
    example:
      "Using historical state-wise records, the model estimates wheat yield for a Punjab Rabi season and shows the historical range for comparison.",
    tool: { to: "/yield-prediction", label: "Try yield prediction" },
  },
  {
    slug: "soil-classification",
    name: "Soil Classification",
    icon: "Layers",
    problem: "What type of soil is this and what does it suit?",
    inputs: ["Texture (sand/silt/clay)", "Colour", "pH and EC", "Soil photos or spectra"],
    model: "Classifier or CNN on soil images/spectra",
    output: "Soil type (alluvial, black, red, laterite…) with management tips",
    example:
      "A dark, clay-rich soil with high water-holding capacity is classified as black (regur) soil, well suited to cotton.",
    tool: { to: "/soil-types", label: "Explore soil types" },
  },
  {
    slug: "soil-nutrient-analysis",
    name: "Soil Nutrient Analysis",
    icon: "FlaskConical",
    problem: "Which nutrients are deficient and by how much?",
    inputs: ["Soil test values: N, P, K, OC, pH, EC, micronutrients"],
    model: "Rules from soil-test ratings combined with ML scoring",
    output: "Nutrient status (low/medium/high) and corrective actions",
    example: "Organic carbon of 0.4% is rated low, triggering advice to add compost or green manure.",
    tool: { to: "/soil-analysis", label: "Check soil health" },
  },
  {
    slug: "plant-disease-detection",
    name: "Plant Disease Detection",
    icon: "ScanSearch",
    problem: "What is wrong with this leaf?",
    inputs: ["Leaf photo from a phone camera"],
    model: "Convolutional neural network (CNN) trained on labelled leaf images",
    output: "Likely disease or pest with confidence and treatment guidance",
    example:
      "A tomato leaf with concentric brown rings is flagged as likely early blight, with IPM steps to confirm and manage it.",
    tool: { to: "/disease-detection", label: "Open the disease scanner" },
    image: "ai/plant-disease",
    alt: "Sweet potato leaves showing damage spots used to train plant-health image models",
  },
  {
    slug: "weather-forecasting",
    name: "Weather Forecasting",
    icon: "CloudSun",
    problem: "Will it rain, and is there heat or frost risk this week?",
    inputs: ["Numerical weather model output", "Station observations", "Historical climate"],
    model: "Forecast APIs plus ML post-processing and risk rules",
    output: "7-day forecast with farm alerts (spray windows, irrigation, heat)",
    example: "Rain forecast for tomorrow delays a planned spray and irrigation, saving inputs.",
    tool: { to: "/weather", label: "See live weather" },
    image: "ai/weather-forecasting",
    alt: "A compact automatic weather station with wind and rain sensors",
  },
  {
    slug: "fertilizer-recommendation",
    name: "Fertilizer Recommendation",
    icon: "Beaker",
    problem: "How much urea, DAP and MOP does this crop need?",
    inputs: ["Crop", "Soil N, P, K", "Target yield", "Field area"],
    model: "Nutrient-gap calculation with crop requirement tables",
    output: "Fertilizer quantities, timing and split doses",
    example:
      "For maize on low-phosphorus soil, the planner calculates DAP for basal application and split urea top-dressing.",
    tool: { to: "/fertilizer", label: "Plan fertilizer" },
  },
  {
    slug: "smart-irrigation-prediction",
    name: "Smart Irrigation Prediction",
    icon: "Droplets",
    problem: "When should I irrigate and how much water is needed?",
    inputs: ["Reference evapotranspiration (ET0)", "Crop coefficient (Kc)", "Rainfall forecast", "Soil moisture"],
    model: "FAO-56 water balance with forecast data (optionally ML-tuned)",
    output: "Irrigation schedule and water depth per application",
    example: "During peak growth, high evapotranspiration and no rain trigger a 35 mm irrigation recommendation.",
    tool: { to: "/irrigation-optimization", label: "Plan irrigation" },
  },
  {
    slug: "production-forecasting",
    name: "Agricultural Production Forecasting",
    icon: "BarChart3",
    problem: "What will regional or national production look like?",
    inputs: ["Sown area", "Yield trends", "Monsoon progress", "Satellite crop indices"],
    model: "Time-series and regression models (ARIMA, gradient boosting, LSTM)",
    output: "Production estimates for planning procurement, storage and trade",
    example:
      "Below-normal monsoon rainfall in a state lowers the forecast for pulses production, signalling storage and price planning.",
    tool: { to: "/reports", label: "View reports" },
  },
  {
    slug: "market-price-prediction",
    name: "Market Price Prediction",
    icon: "IndianRupee",
    problem: "Should I sell now or store and sell later?",
    inputs: ["Historical mandi prices", "Arrivals", "Season", "Festivals and policy events"],
    model: "Time-series forecasting (Prophet, LSTM, gradient boosting)",
    output: "Price trend and range for the coming weeks",
    example: "A forecast rise in onion prices after arrivals fall helps a farmer with storage decide when to sell.",
    image: "ai/market-prices",
    alt: "A busy vegetable market in Hyderabad with traders and fresh produce",
    status: "concept",
  },
  {
    slug: "satellite-crop-monitoring",
    name: "Satellite-Based Crop Monitoring",
    icon: "Satellite",
    problem: "How healthy is the crop across the whole field or region?",
    inputs: ["Sentinel-2 / Landsat multispectral images", "Field boundaries"],
    model: "Vegetation indices (NDVI, NDWI) and CNN-based crop classification",
    output: "Crop-health maps, crop-type maps and stress alerts",
    example:
      "A patch of low NDVI in a field highlights water stress or pest damage before it is visible from the ground.",
    image: "ai/satellite-monitoring",
    alt: "Satellite image showing a patchwork of agricultural fields",
    status: "concept",
  },
  {
    slug: "ai-agricultural-chatbot",
    name: "AI Agricultural Chatbot",
    icon: "Bot",
    problem: "Where can I get an answer to my farming question right now?",
    inputs: ["Farmer's question in text", "Curated agricultural knowledge base"],
    model: "Retrieval-augmented generation (RAG) with a large language model",
    output: "Answers grounded in the knowledge base, with sources",
    example:
      "Asked about the right time to sow mustard, the assistant retrieves the seasonal guide and answers with dates and seed rate.",
    tool: { to: "/assistant", label: "Ask the AI assistant" },
  },
];
