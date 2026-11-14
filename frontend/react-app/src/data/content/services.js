// Services offered by Aamir Hussain Azad through AgriSmart: /services.
// status: "available" = offered today; "on-request" = scoped per project; "planned" = future capability.

export const SERVICE_STATUS = {
  available: { label: "Available now", tone: "green" },
  "on-request": { label: "Available on request", tone: "gold" },
  planned: { label: "Planned / future", tone: "grey" },
};

export const SERVICES = [
  {
    id: "agritech-solutions",
    icon: "Tractor",
    title: "Agricultural Technology Solutions",
    status: "available",
    text: "Web and mobile-friendly tools for farms, FPOs and agri-businesses — crop advisories, field records, dashboards and reports.",
    includes: ["Crop and field management apps", "Advisory dashboards", "Integration with weather and soil data"],
  },
  {
    id: "ai-ml-development",
    icon: "BrainCircuit",
    title: "AI/ML Development",
    status: "available",
    text: "End-to-end machine-learning: data cleaning, feature engineering, model training, evaluation and deployment as APIs.",
    includes: ["Classification and regression models", "Model evaluation and explainability", "FastAPI model serving"],
  },
  {
    id: "crop-prediction",
    icon: "TrendingUp",
    title: "Crop Prediction Systems",
    status: "available",
    text: "Crop recommendation and yield-prediction systems like the ones running on AgriSmart, adapted to your data and region.",
    includes: ["Crop recommendation", "Yield forecasting", "Scenario and what-if analysis"],
  },
  {
    id: "smart-farming",
    icon: "Cpu",
    title: "Smart Farming Solutions",
    status: "planned",
    text: "Connecting field sensors, weather stations and drones to dashboards and alerts. Software integration is possible today; hardware supply and installation are a future capability.",
    includes: ["IoT sensor dashboards (software)", "Alert rules for irrigation and disease risk", "Drone/satellite data integration (planned)"],
  },
  {
    id: "agri-data-analytics",
    icon: "BarChart3",
    title: "Agricultural Data Analytics",
    status: "available",
    text: "Turn production, sales and field data into clear insights with Python, SQL, Power BI and interactive dashboards.",
    includes: ["Exploratory data analysis", "KPI dashboards (Power BI / Streamlit)", "Reports and visualisations"],
  },
  {
    id: "web-software",
    icon: "Code2",
    title: "Website and Software Development",
    status: "available",
    text: "Fast, responsive, SEO-friendly websites and full-stack applications with React, JavaScript and Python backends.",
    includes: ["React websites and web apps", "REST APIs with FastAPI", "Deployment on Vercel and cloud platforms"],
  },
  {
    id: "digital-transformation",
    icon: "Rocket",
    title: "Digital Transformation",
    status: "on-request",
    text: "Helping small businesses and agri-organisations move from paper and spreadsheets to simple digital workflows. Scope is agreed per project.",
    includes: ["Process digitisation", "Data migration to databases", "Staff-friendly dashboards"],
  },
  {
    id: "business-software",
    icon: "Briefcase",
    title: "Business and Personal Software Solutions",
    status: "available",
    text: "Custom tools for businesses and individuals — portfolios, booking and inventory tools, assistants and automation scripts.",
    includes: ["Portfolio and business websites", "Inventory and sales tools", "AI assistants and automation"],
  },
];
