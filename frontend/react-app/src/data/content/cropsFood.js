// Crops & food production: /crops-and-food. Plain data (no imports).

export const CROP_SEASONS = [
  {
    id: "kharif",
    name: "Kharif",
    hindi: "खरीफ",
    months: "Sown June–July with the monsoon · harvested September–October",
    image: "/images/kharif-season.webp",
    alt: "Lush green Kharif paddy fields during the monsoon season",
    about: "Monsoon crops that need warm temperatures and plenty of water during growth.",
    crops: ["Rice", "Maize", "Soybean", "Cotton", "Groundnut", "Pigeon pea (arhar)", "Bajra", "Jowar"],
  },
  {
    id: "rabi",
    name: "Rabi",
    hindi: "रबी",
    months: "Sown October–December · harvested March–April",
    image: "/images/rabi-season.webp",
    alt: "Golden Rabi wheat fields ready for harvest in spring",
    about: "Winter crops that grow in cool weather and ripen as temperatures rise in spring.",
    crops: ["Wheat", "Mustard", "Gram (chickpea)", "Barley", "Lentil", "Peas"],
  },
  {
    id: "zaid",
    name: "Zaid",
    hindi: "ज़ायद",
    months: "Sown March–April · harvested June",
    image: "/images/zaid-horticulture.webp",
    alt: "Summer horticulture with melons and vegetables in the Zaid season",
    about: "Short summer crops grown between Rabi and Kharif, usually with irrigation.",
    crops: ["Watermelon", "Cucumber", "Muskmelon", "Bitter gourd", "Moong", "Fodder crops"],
  },
];

export const CROP_CATEGORIES = [
  {
    name: "Cereals",
    icon: "Wheat",
    examples: "Rice, wheat, maize, barley, millets (bajra, jowar, ragi)",
    note: "Staple sources of energy (carbohydrates) for most Indian diets.",
  },
  {
    name: "Pulses",
    icon: "Bean",
    examples: "Gram, arhar (tur), moong, urad, lentil (masoor), peas",
    note: "Protein-rich legumes that also fix nitrogen and improve soil.",
  },
  {
    name: "Oilseeds",
    icon: "Droplet",
    examples: "Mustard, groundnut, soybean, sunflower, sesame, linseed",
    note: "Sources of edible oil, oilcake for animal feed and industrial uses.",
  },
  {
    name: "Fruits",
    icon: "Apple",
    examples: "Mango, banana, citrus, guava, papaya, apple, grapes",
    note: "Rich in vitamins, minerals and fibre; high-value horticulture.",
  },
  {
    name: "Vegetables",
    icon: "Carrot",
    examples: "Potato, onion, tomato, brinjal, okra, cabbage, leafy greens",
    note: "Short-duration, high-income crops essential for balanced diets.",
  },
  {
    name: "Commercial Crops",
    icon: "Factory",
    examples: "Sugarcane, cotton, jute, tobacco, rubber",
    note: "Grown mainly for sale and industrial processing.",
  },
  {
    name: "Horticultural Crops",
    icon: "Flower2",
    examples: "Fruits, vegetables, flowers, spices, plantation crops (tea, coffee, coconut)",
    note: "A fast-growing sector offering higher returns per hectare.",
  },
];

export const FOOD_GALLERY = [
  { image: "food/rice-field", alt: "Ripe golden rice paddy field in Coorg, Karnataka", caption: "Rice fields" },
  { image: "food/wheat-field", alt: "A green wheat field in Punjab", caption: "Wheat fields" },
  { image: "food/fresh-vegetables", alt: "Tomatoes, cabbages and cauliflowers stacked at an Indian roadside stall", caption: "Fresh vegetables" },
  { image: "food/fruits", alt: "A colourful market stall full of fresh fruits", caption: "Fruits" },
  { image: "food/organic-food", alt: "Organic greens and vegetables on sale at a street fair", caption: "Organic food" },
  { image: "nutrition/pulses-legumes", alt: "Sacks of pulses and dried red chillies at a market in Ooty", caption: "Grains & pulses" },
  { image: "food/harvesting", alt: "A woman harvesting ripe rice by hand in Raichur, Karnataka", caption: "Harvesting" },
  { image: "food/food-processing", alt: "Workers spreading rice to dry at a rice processing mill", caption: "Processing" },
  { image: "food/food-storage", alt: "A Central Warehousing Corporation godown used to store food grains", caption: "Storage" },
];

export const FOOD_CHAIN = [
  { step: "Production", detail: "Farmers grow crops and raise livestock using seed, water, nutrients and labour." },
  { step: "Harvest", detail: "Crops are harvested at the right maturity to protect quality and yield." },
  { step: "Post-harvest handling", detail: "Threshing, drying, cleaning, sorting and grading prepare produce for market." },
  { step: "Storage", detail: "Warehouses, silos, cold stores and hermetic bags protect food from pests and spoilage." },
  { step: "Processing", detail: "Milling, packaging and value addition turn raw produce into food products." },
  { step: "Distribution", detail: "Mandis, e-NAM, FPOs, wholesalers, retailers and the public distribution system move food to people." },
  { step: "Consumption", detail: "Households use food for nutrition; reducing waste at this stage matters too." },
];

export const POST_HARVEST = [
  {
    title: "Harvest at the right time",
    text: "Harvest at physiological maturity and in dry weather. Early or late harvest reduces quality and increases losses.",
  },
  {
    title: "Dry to safe moisture",
    text: "Dry grain to safe moisture levels before storage (roughly 12–14% for most cereals) to prevent mould and insect growth.",
  },
  {
    title: "Clean, sort and grade",
    text: "Remove stones, chaff and damaged grains. Graded produce earns better prices and stores longer.",
  },
  {
    title: "Store safely",
    text: "Use clean, dry, pest-proof stores, raised platforms, hermetic bags or metal bins. Inspect regularly.",
  },
  {
    title: "Cold chain for perishables",
    text: "Fruits, vegetables, milk and fish need cooling soon after harvest. Pack carefully to avoid bruising.",
  },
  {
    title: "Add value locally",
    text: "Processing, packing and branding through FPOs and village units increase income and reduce wastage.",
  },
];

export const FOOD_SECURITY = [
  { pillar: "Availability", text: "Enough food produced, stored and imported to meet needs." },
  { pillar: "Access", text: "People can afford and physically reach enough food." },
  { pillar: "Utilisation", text: "Safe, nutritious food, clean water and health care so the body can use nutrients." },
  { pillar: "Stability", text: "Access stays secure through droughts, price shocks and other crises." },
];
