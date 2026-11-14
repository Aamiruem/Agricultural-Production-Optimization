// Food & nutrition: /food-and-nutrition. Educational only. Plain data (no imports).

export const NUTRITION_CATEGORIES = [
  {
    id: "healthy-fruits",
    name: "Healthy Fruits",
    image: "nutrition/healthy-fruits",
    alt: "An assortment of fresh fruits including apples, mango, bananas, kiwis and limes",
    nutrients: ["Vitamin C", "Potassium", "Dietary fibre", "Antioxidants", "Natural sugars"],
    benefits: [
      "Support immunity and healthy skin",
      "Fibre aids digestion and helps control blood sugar",
      "Potassium helps maintain healthy blood pressure",
    ],
    source:
      "Orchards and horticulture farms — mango, banana, guava, citrus, papaya, apple and grapes are major Indian fruit crops.",
    storage: [
      "Store ripe fruits in the refrigerator; ripen mangoes and bananas at room temperature",
      "Keep bananas and apples apart — their ethylene speeds ripening of others",
      "Wash just before eating, not before storing",
    ],
  },
  {
    id: "fresh-vegetables",
    name: "Fresh Vegetables",
    image: "nutrition/fresh-vegetables",
    alt: "Fresh carrots, onions, garlic, peppers and root vegetables on a wooden table",
    nutrients: ["Vitamins A, C and K", "Folate", "Iron (leafy greens)", "Fibre", "Minerals"],
    benefits: [
      "Low in calories and high in micronutrients",
      "Leafy greens help prevent anaemia",
      "Regular intake lowers the risk of heart disease",
    ],
    source: "Vegetable farms, kitchen gardens and peri-urban farms; many are short-duration Zaid and Rabi crops.",
    storage: [
      "Refrigerate leafy greens wrapped in a damp cloth and use within a few days",
      "Keep onions and potatoes in a cool, dark, airy place — not together",
      "Do not over-wash or soak cut vegetables; cook lightly to retain vitamins",
    ],
  },
  {
    id: "organic-food",
    name: "Organic Food",
    image: "nutrition/organic-food",
    alt: "Certified organic strawberries on sale at a farmers market",
    nutrients: ["Same core nutrients as conventional food", "Often lower pesticide residues"],
    benefits: [
      "Grown without synthetic pesticides and fertilizers",
      "Supports soil health and biodiversity",
      "Look for the Jaivik Bharat / India Organic logo to verify",
    ],
    source: "Certified organic farms (NPOP or PGS-India) using compost, crop rotation and biological pest control.",
    storage: [
      "Store like conventional produce",
      "Organic produce may spoil faster without preservatives — buy fresh and use soon",
    ],
  },
  {
    id: "cereals-grains",
    name: "Cereals and Grains",
    image: "nutrition/cereals-grains",
    alt: "A woman winnowing harvested millet grain by pouring it from a container",
    nutrients: [
      "Complex carbohydrates",
      "B-vitamins",
      "Fibre (whole grains)",
      "Iron and calcium (millets such as ragi)",
    ],
    benefits: [
      "Main energy source for physical work",
      "Whole grains and millets keep you full and steady blood sugar",
      "Millets are climate-resilient and nutrient-dense",
    ],
    source: "Rice, wheat, maize and millets (bajra, jowar, ragi) from Kharif and Rabi seasons.",
    storage: [
      "Store dry grain in clean, airtight containers in a cool place",
      "Sun-dry before storing if moisture is suspected",
      "Neem leaves are a traditional household protectant for stored grain",
    ],
  },
  {
    id: "pulses-legumes",
    name: "Pulses and Legumes",
    image: "nutrition/pulses-legumes",
    alt: "Sacks of lentils, pulses and dried red chillies at a market in Ooty",
    nutrients: ["Plant protein", "Fibre", "Iron", "Folate", "Magnesium"],
    benefits: [
      "Key protein source in vegetarian diets",
      "Cereal + pulse combinations (dal–rice, khichdi) give better-quality protein",
      "Low glycaemic index — good for diabetes management",
    ],
    source: "Gram, arhar, moong, urad, masoor and peas — legumes that also enrich soil with nitrogen.",
    storage: [
      "Keep in airtight containers away from moisture",
      "Soaking and sprouting improve digestibility and nutrient absorption",
    ],
  },
  {
    id: "dairy-products",
    name: "Dairy Products",
    image: "nutrition/dairy-products",
    alt: "Milk, yoghurt, cheese and butter arranged on a table",
    nutrients: ["Calcium", "High-quality protein", "Vitamin B12", "Vitamin D (if fortified)"],
    benefits: [
      "Strong bones and teeth",
      "Curd (dahi) supports gut health",
      "B12 is important, especially for vegetarians",
    ],
    source: "Dairy farming — cattle and buffaloes on mixed farms; India is the world's largest milk producer.",
    storage: [
      "Boil raw milk before use and refrigerate within two hours",
      "Keep curd and paneer refrigerated in covered containers",
      "Check packaging dates and FSSAI licence numbers on packed products",
    ],
  },
  {
    id: "balanced-diet",
    name: "Balanced Diet",
    image: "nutrition/balanced-diet",
    alt: "An Indian thali with rice, dal, vegetables, roti and curd",
    nutrients: ["Carbohydrates", "Proteins", "Fats", "Vitamins", "Minerals", "Water and fibre"],
    benefits: [
      "Provides all nutrients in the right proportions",
      "Maintains healthy weight and energy for work",
      "Reduces the risk of diet-related diseases",
    ],
    source:
      "A traditional thali combines cereals, pulses, vegetables, curd and a little fat — food from many farm systems.",
    storage: ["Eat freshly cooked food; refrigerate leftovers promptly and reheat thoroughly"],
    guide:
      "ICMR–National Institute of Nutrition's Dietary Guidelines for Indians (2024) suggest filling about half the plate with vegetables and fruits, with the rest from cereals and millets, pulses or other protein foods, nuts and seeds, and milk or curd.",
  },
  {
    id: "nutritional-benefits",
    name: "Nuts, Seeds and Healthy Fats",
    image: "nutrition/nutritional-benefits",
    alt: "Piles of almonds, cashews and other nuts on sale at a bazaar",
    nutrients: ["Healthy fats", "Protein", "Vitamin E", "Zinc and magnesium"],
    benefits: [
      "Good for heart health when eaten in moderation",
      "Energy-dense snacks for long working days",
      "Seeds like flax and sesame add omega-3 and calcium",
    ],
    source: "Groundnut, sesame, mustard and coconut farms, and dry-fruit orchards.",
    storage: [
      "Store in airtight jars in a cool, dark place to prevent rancidity",
      "Buy small quantities that you can use within a few weeks",
    ],
  },
];

export const NUTRITION_SOURCES = [
  { name: "ICMR–National Institute of Nutrition", href: "https://www.nin.res.in/" },
  { name: "WHO – Healthy diet fact sheet", href: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  { name: "Food Safety and Standards Authority of India (FSSAI)", href: "https://www.fssai.gov.in/" },
];
