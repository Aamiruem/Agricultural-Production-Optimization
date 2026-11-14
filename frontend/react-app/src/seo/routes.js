// Single source of truth for per-URL SEO: <title>, meta description, canonical,
// Open Graph image, breadcrumbs, schema type and sitemap settings.
//
// Used at runtime by useDocumentTitle (client navigation) and at build time by
// vite.config.js, which writes a static HTML head for every indexable URL, plus
// sitemap.xml, robots.txt and 404.html. Keep this file free of "@/" imports so Node
// can load it during the build.

import { CROP_PROFILES } from "../data/cropProfiles.js";
import { PRODUCTION_SYSTEM_INDEX as PRODUCTION_SYSTEMS } from "../data/content/productionSystemsIndex.js";
import { BRAND } from "../data/site.js";

const UPDATED = BRAND.contentUpdated;

// Hero photo per page: preloaded in the static HTML (faster LCP) and listed in the
// image sitemap. Keys are /images/<key>-640|1200.webp; values starting with "/" are files.
const HERO = {
  "/": "machines/agricultural-drone",
  "/features": "ai/satellite-monitoring",
  "/app": "/images/india-agriculture-hero.webp",
  "/about": "education/farmers-in-field",
  "/developer": "education/farmers-in-field",
  "/agricultural-production-systems": "systems/crop-production-systems",
  "/smart-agricultural-machines": "machines/combine-harvester",
  "/ai-in-agriculture": "ai/satellite-monitoring",
  "/crops-and-food": "food/harvesting",
  "/farmer-health": "health/doctor-consultation",
  "/food-and-nutrition": "nutrition/healthy-fruits",
  "/farmer-education": "education/modern-farming",
  "/services": "machines/crop-sensors",
  "/projects": "ai/soil-analysis",
  "/contact": "education/agri-economics",
};

/**
 * @typedef {object} RouteSeo
 * @property {string} path
 * @property {string} title        Full <title>, ~50–60 characters.
 * @property {string} description  ~120–160 characters, unique per page.
 * @property {string} crumb        Short breadcrumb label.
 * @property {string} [parent]     Parent path for breadcrumbs ("/" by default).
 * @property {string} [image]      Open Graph image (1200×630 JPEG under /og/).
 * @property {string} [type]       schema.org page type.
 * @property {number} [priority]   Sitemap priority.
 * @property {string} [changefreq] Sitemap change frequency.
 * @property {boolean} [noindex]   Exclude from search and sitemap.
 * @property {string} [hero]       Hero photo key (see HERO) for preload and the image sitemap.
 */

/** @type {RouteSeo[]} */
const STATIC_ROUTES = [
  {
    path: "/",
    title: "AgriSmart – Smart Agriculture & AI Farming Solutions for India",
    description:
      "Smart agriculture made practical: learn production systems, modern farm machines and AI crop yield prediction, and use free crop, soil and weather tools.",
    crumb: "Home",
    image: "/og/home.jpg",
    type: "WebPage",
    priority: 1.0,
    changefreq: "weekly",
  },
  {
    path: "/about",
    title: "About AgriSmart – Mission, Vision & Smart Farming Values",
    description:
      "Why AgriSmart exists: agricultural production systems, sustainable farming, AI-driven solutions, farmer empowerment and food security — our mission, vision and values.",
    crumb: "About",
    image: "/og/about.jpg",
    type: "AboutPage",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/agricultural-production-systems",
    title: "Agricultural Production Systems – Types, Methods & Examples",
    description:
      "A complete guide to agricultural production systems: subsistence, commercial, intensive, organic, integrated and precision farming, irrigation, soil, pests and crop rotation.",
    crumb: "Agriculture",
    image: "/og/agriculture.jpg",
    type: "CollectionPage",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/smart-agricultural-machines",
    title: "Smart Agricultural Machines – Tractors, Drones & Farm Robots",
    description:
      "Modern farming equipment explained: smart tractors, combine harvesters, agricultural drones, seed drills, sprayers, smart irrigation, soil testing tools and farm robots.",
    crumb: "Smart Machines",
    image: "/og/machines.jpg",
    type: "CollectionPage",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/ai-in-agriculture",
    title: "AI in Agriculture – Machine Learning for Smart Farming",
    description:
      "How AI and machine learning improve farming: crop recommendation, crop yield prediction, plant disease detection, weather and price forecasting, satellite crop monitoring.",
    crumb: "AI Solutions",
    image: "/og/ai.jpg",
    type: "Article",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/crops-and-food",
    title: "Crops & Food Production in India – Kharif, Rabi, Zaid",
    description:
      "Indian crop seasons and categories, from rice and wheat to fruits and vegetables, plus food production, post-harvest management, storage, supply chains and food security.",
    crumb: "Crops & Food",
    image: "/og/crops-food.jpg",
    type: "Article",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/farmer-health",
    title: "Farmer Health & Rural Healthcare – Safety, Heat & First Aid",
    description:
      "Health information for farming communities: rural healthcare, preventive care, first aid, clean water, heat stress, pesticide safety and mental wellness. Not medical advice.",
    crumb: "Healthcare",
    image: "/og/health.jpg",
    type: "Article",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/food-and-nutrition",
    title: "Food & Nutrition Guide – Balanced Diet, Fruits, Grains, Pulses",
    description:
      "Nutrition from farm to plate: fruits, vegetables, organic food, cereals, pulses and dairy — nutrients, health benefits, agricultural sources and storage tips.",
    crumb: "Food & Nutrition",
    image: "/og/nutrition.jpg",
    type: "Article",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/farmer-education",
    title: "Farmer Education & Resources – Techniques and Govt Schemes",
    description:
      "Practical farmer education: modern farming techniques, soil testing, seed selection, irrigation, crop protection, farm economics and official government agriculture schemes.",
    crumb: "Farmer Education",
    image: "/og/education.jpg",
    type: "Article",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/services",
    title: "AgriTech, AI/ML & Software Development Services | AgriSmart",
    description:
      "Agricultural technology, AI/ML development, crop prediction systems, data analytics and website development by Aamir Hussain Azad — with clear availability for each.",
    crumb: "Services",
    image: "/og/services.jpg",
    type: "WebPage",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/projects",
    title: "Projects by Aamir Hussain Azad – AI/ML & Full-Stack Portfolio",
    description:
      "Verified AI/ML and full-stack projects: crop yield prediction, mental wellness scoring, RAG chatbot, retail analytics, real estate prediction and more, with GitHub links.",
    crumb: "Projects",
    image: "/og/projects.jpg",
    type: "CollectionPage",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/developer",
    title: "Aamir Hussain Azad – AI/ML Engineer & Full-Stack Developer",
    description:
      "Meet the developer behind AgriSmart: Aamir Hussain Azad, AI/ML engineer and full-stack developer in Gurugram — skills, education and links to portfolio and GitHub.",
    crumb: "Developer",
    image: "/og/developer.jpg",
    type: "ProfilePage",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/contact",
    title: "Contact AgriSmart – WhatsApp, Call or Email",
    description:
      "Contact Aamir Hussain Azad, AgriSmart's developer, in Gurugram: WhatsApp or call +91 99318 79953, email, LinkedIn and GitHub. Questions and project requests welcome.",
    crumb: "Contact",
    image: "/og/contact.jpg",
    type: "ContactPage",
    priority: 0.6,
    changefreq: "yearly",
  },
  {
    path: "/app",
    title: "AgriSmart Web App – Free AI Farming Tools, Install on Phone",
    description:
      "Use AgriSmart's free web app on any phone: crop advisor, yield forecast, soil, fertilizer, irrigation and weather tools. Install it to your home screen in two taps.",
    crumb: "Web App",
    image: "/og/app.jpg",
    type: "WebPage",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/local-intelligence",
    title: "Analyze My Farm Location – Local Weather, Soil & Crop AI India",
    description:
      "Select your village or farm on an India map to get local weather, 10-year rainfall, soil estimates, dataset comparison, crop suitability and yield prediction.",
    crumb: "Local analysis",
    parent: "/app",
    image: "/og/ai.jpg",
    type: "WebPage",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    path: "/features",
    title: "AgriSmart Features – Weather, Soil, Crop & Yield AI Tools",
    description:
      "Every AgriSmart feature in one place: India agriculture map, location analysis, weather intelligence, soil analysis, crop recommendation, yield prediction and reports.",
    crumb: "Features",
    image: "/og/ai.jpg",
    type: "WebPage",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/terms",
    title: "Terms and Conditions | AgriSmart",
    description:
      "The rules for using the AgriSmart website, account and agricultural tools: accounts, acceptable use, data ownership, predictions and liability.",
    crumb: "Terms",
    type: "WebPage",
    priority: 0.2,
    changefreq: "yearly",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | AgriSmart",
    description:
      "How AgriSmart handles your data: account details, hashed passwords, sessions, location analysis, third-party services and how to request deletion.",
    crumb: "Privacy Policy",
    type: "WebPage",
    priority: 0.2,
    changefreq: "yearly",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer | AgriSmart",
    description:
      "Important limits of AgriSmart's agricultural, AI model, health and nutrition information. Educational content only — confirm decisions with qualified experts.",
    crumb: "Disclaimer",
    type: "WebPage",
    priority: 0.2,
    changefreq: "yearly",
  },
  {
    path: "/image-credits",
    title: "Image Credits & Licences | AgriSmart",
    description:
      "Authors, licences and sources of the photographs used on AgriSmart, mostly from Wikimedia Commons under Creative Commons and public-domain licences.",
    crumb: "Image Credits",
    type: "WebPage",
    priority: 0.2,
    changefreq: "yearly",
  },

  // Existing AI tools and explorers
  {
    path: "/dashboard",
    title: "Smart Farming Dashboard – Weather, Yield & Crop Analytics",
    description:
      "Live farm dashboard for India: state crop production trends, weather, seasonal advice and AI model insights in one view.",
    crumb: "Dashboard",
    parent: "/app",
    priority: 0.7,
    changefreq: "daily",
  },
  {
    path: "/data-dashboard",
    title: "Agricultural Data Studio – Upload & Analyse Farm Data",
    description:
      "Upload CSV or Excel farm data and explore it with charts, summaries and crop-yield analytics directly in your browser.",
    crumb: "Data studio",
    parent: "/app",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/crop-recommendation",
    title: "AI Crop Recommendation – Best Crop for Your Soil & Climate",
    description:
      "Free AI crop recommendation from soil N, P, K, pH, temperature, humidity and rainfall. Get ranked crops with reasons, trained on Indian data.",
    crumb: "Crop advisor",
    parent: "/app",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/seasonal-advisor",
    title: "Seasonal Crop Advisor – Kharif, Rabi & Zaid Crops by State",
    description:
      "Find suitable Kharif, Rabi and Zaid crops for your state and soil, with sowing windows and water needs.",
    crumb: "Season advisor",
    parent: "/app",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/rotation-planner",
    title: "Crop Rotation Planner – Plan Healthy Crop Sequences",
    description:
      "Plan a crop rotation that restores soil nitrogen, breaks pest cycles and spreads income across seasons.",
    crumb: "Rotation planner",
    parent: "/app",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/planner",
    title: "Field Planner – Plan Crops, Area and Inputs Offline",
    description: "Plan fields, crops and areas for the season; works offline and saves to your device.",
    crumb: "Field planner",
    parent: "/app",
    priority: 0.5,
    changefreq: "monthly",
  },
  {
    path: "/soil-analysis",
    title: "Soil Health Analysis – Soil Testing, NPK & pH Interpretation",
    description:
      "Interpret soil test results: N, P, K, pH, EC and organic carbon ratings with Soil Health Card style recommendations.",
    crumb: "Soil health",
    parent: "/app",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/fertilizer",
    title: "Fertilizer Calculator – Urea, DAP & MOP Doses by Crop",
    description: "Calculate urea, DAP and MOP quantities from your soil test and crop to close the exact nutrient gap.",
    crumb: "Fertilizer planner",
    parent: "/app",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/irrigation-optimization",
    title: "Smart Irrigation Planner – FAO-56 Crop Water Requirement",
    description:
      "Smart irrigation and water management: estimate crop water need from live evapotranspiration and plan drip or sprinkler schedules.",
    crumb: "Irrigation planner",
    parent: "/app",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/disease-detection",
    title: "Crop Disease Detection – Leaf Photo Screening & Pest Library",
    description:
      "AI crop monitoring and disease detection: screen leaf photos and browse a region-wise library of crop diseases and pests with IPM advice.",
    crumb: "Disease scanner",
    parent: "/app",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/weather",
    title: "Farm Weather Forecast – 7-Day Weather for Indian States",
    description:
      "Live 7-day farm weather for every Indian state: rain, temperature, humidity and wind with farming alerts.",
    crumb: "Weather",
    parent: "/app",
    priority: 0.7,
    changefreq: "daily",
  },
  {
    path: "/yield-prediction",
    title: "Crop Yield Prediction – AI Yield Forecast for Indian Farms",
    description:
      "Predict crop yield (t/ha) and production by state, season and crop with a machine-learning model, including the historical range.",
    crumb: "Yield forecast",
    parent: "/app",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/reports",
    title: "Agricultural Reports – Crop Production Analytics & Export",
    description: "Generate crop production reports with charts and export them for planning and presentations.",
    crumb: "Reports",
    parent: "/app",
    priority: 0.5,
    changefreq: "monthly",
  },
  {
    path: "/insights",
    title: "AI Model Insights – Accuracy, Metrics & Feature Importance",
    description:
      "How AgriSmart's machine-learning models perform: accuracy, error metrics, model comparison and feature importance.",
    crumb: "Model insights",
    parent: "/app",
    priority: 0.5,
    changefreq: "monthly",
  },
  {
    path: "/crops",
    title: "Crop Library – Growing Conditions for 22 Indian Crops",
    description:
      "Ideal N, P, K, pH, temperature, humidity and rainfall for 22 major Indian crops, with links to fertilizer planning.",
    crumb: "Crop library",
    parent: "/crops-and-food",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/crop-gallery",
    title: "Indian Crop Gallery – Photo Guide to 45 Crops",
    description:
      "Photo guide to 45 Indian crops with English and Hindi names, seasons, soils, water needs and growing regions.",
    crumb: "Crop gallery",
    parent: "/crops-and-food",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/states",
    title: "State-wise Agriculture Guide – Major Crops of Indian States",
    description: "Agriculture in every Indian state and UT: climate, soils, major crops and production trends.",
    crumb: "State guide",
    parent: "/crops-and-food",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/soil-types",
    title: "Soil Types of India – Alluvial, Black, Red & Laterite Soils",
    description: "Major soil types of India, where they occur, their properties and the crops they suit best.",
    crumb: "Soil types",
    parent: "/farmer-education",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/learn",
    title: "Agriculture Knowledge Hub – Seasons, Nutrients & Formulas",
    description: "Crop seasons, soil nutrients and their deficiency signs, and key farm formulas explained simply.",
    crumb: "Knowledge hub",
    parent: "/farmer-education",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/assistant",
    title: "AI Farm Assistant – Ask Farming Questions",
    description: "Ask AgriSmart's AI assistant about crops, soil, fertilizer, irrigation and seasons.",
    crumb: "AI assistant",
    parent: "/app",
    priority: 0.5,
    changefreq: "monthly",
  },
  {
    path: "/farms",
    title: "My Farms – Fields and Activities Saved on This Device",
    description: "Record farms, fields and activities in your browser.",
    crumb: "My farms",
    parent: "/app",
    noindex: true,
  },
];

const ACCOUNT_ROUTES = [
  ["/login", "Login | AgriSmart", "Sign in to your AgriSmart account to open your dashboard and tools.", "Login"],
  [
    "/register",
    "Create Account | AgriSmart",
    "Create a free AgriSmart account to use the farm analysis tools.",
    "Create account",
  ],
  [
    "/forgot-password",
    "Forgot Password | AgriSmart",
    "Request a link to reset your AgriSmart password.",
    "Forgot password",
  ],
  [
    "/reset-password",
    "Reset Password | AgriSmart",
    "Choose a new password for your AgriSmart account.",
    "Reset password",
  ],
  ["/settings", "Settings | AgriSmart", "Manage your AgriSmart profile, password and preferences.", "Settings"],
  ["/admin", "Admin | AgriSmart", "AgriSmart administration.", "Admin"],
].map(([path, title, description, crumb]) => ({ path, title, description, crumb, noindex: true }));

/**
 * The signed-in app: every tool needs an account, so search engines would only see the login
 * screen. These stay out of the index and sitemap; the public pages describe them instead.
 */
export const PRIVATE_PATHS = new Set([
  "/dashboard",
  "/data-dashboard",
  "/local-intelligence",
  "/crop-recommendation",
  "/seasonal-advisor",
  "/rotation-planner",
  "/planner",
  "/soil-analysis",
  "/fertilizer",
  "/irrigation-optimization",
  "/disease-detection",
  "/weather",
  "/yield-prediction",
  "/reports",
  "/insights",
  "/crops",
  "/crop-gallery",
  "/states",
  "/soil-types",
  "/learn",
  "/farms",
  "/assistant",
  "/settings",
  "/admin",
]);

const SYSTEM_ROUTES = PRODUCTION_SYSTEMS.map((s) => ({
  path: `/agricultural-production-systems/${s.slug}`,
  title:
    `${s.title}: Definition, Process, Pros & Cons`.length <= 62
      ? `${s.title}: Definition, Process, Pros & Cons`
      : `${s.title}: Definition & Examples`,
  description: `${s.summary} Definition, process, pros and cons, with Indian examples.`,
  crumb: s.title,
  parent: "/agricultural-production-systems",
  image: `/og/systems-${s.slug}.jpg`,
  type: "Article",
  priority: 0.8,
  changefreq: "monthly",
  hero: s.image,
}));

// Crop detail pages are thin (a table of averages), so they stay out of the index.
const CROP_ROUTES = Object.keys(CROP_PROFILES).map((name) => ({
  path: `/crops/${name}`,
  title: `${name.charAt(0).toUpperCase()}${name.slice(1)} – Ideal Growing Conditions | AgriSmart`,
  description: `Average soil and climate conditions where ${name} grows well: N, P, K, pH, temperature, humidity and rainfall.`,
  crumb: name,
  parent: "/crops",
  noindex: true,
}));

export const SEO_ROUTES = [...STATIC_ROUTES, ...ACCOUNT_ROUTES, ...SYSTEM_ROUTES, ...CROP_ROUTES].map((r) => ({
  parent: r.path === "/" ? undefined : "/",
  type: "WebPage",
  image: "/og/home.jpg",
  updated: UPDATED,
  hero: HERO[r.path],
  ...r,
  ...(PRIVATE_PATHS.has(r.path) ? { noindex: true } : null),
}));

/** Absolute-path URL of a route's hero image (1200 px), or undefined. */
export function heroUrl(route) {
  if (!route?.hero) return undefined;
  return route.hero.startsWith("/") ? route.hero : `/images/${route.hero}-1200.webp`;
}

const BY_PATH = new Map(SEO_ROUTES.map((r) => [r.path, r]));

/** SEO entry for a pathname (trailing slash ignored), or undefined. */
export function routeSeo(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return BY_PATH.get(clean);
}

/** Breadcrumb trail [{name, path}] from the home page to `pathname`. */
export function breadcrumbTrail(pathname) {
  const trail = [];
  let r = routeSeo(pathname);
  const seen = new Set();
  while (r && !seen.has(r.path)) {
    seen.add(r.path);
    trail.unshift({ name: r.crumb, path: r.path });
    r = r.parent ? BY_PATH.get(r.parent) : undefined;
  }
  return trail;
}

/** Old URLs → canonical URLs (301/308 redirects on the host, client redirects in the app). */
export const REDIRECTS = {
  "/recommend": "/crop-recommendation",
  "/yield": "/yield-prediction",
  "/soil": "/soil-analysis",
  "/irrigation": "/irrigation-optimization",
  "/disease": "/disease-detection",
  "/agriculture": "/agricultural-production-systems",
  "/machines": "/smart-agricultural-machines",
  "/ai-solutions": "/ai-in-agriculture",
  "/healthcare": "/farmer-health",
  "/nutrition": "/food-and-nutrition",
};
