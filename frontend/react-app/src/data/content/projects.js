// Portfolio projects of Aamir Hussain Azad, verified on 2026-11-14 against
// https://aamir-hussain-azad.vercel.app/ and https://github.com/Aamiruem (public repositories).
// Only details stated there are used. Live links are included only where the portfolio or
// repository lists one. `status` mirrors the label used on the portfolio.

export const PROJECTS_VERIFIED_ON = "2026-11-14";

export const PROJECTS = [
  {
    id: "crop-yield",
    name: "Agricultural Production & Crop Yield Prediction System",
    category: "AI / ML · Agriculture",
    status: "Completed (major project)",
    description:
      "An end-to-end machine-learning system that estimates crop yield from soil conditions, weather, location, crop type and historical production records, turning scattered agricultural data into planning insights.",
    features: [
      "Data cleaning, encoding, scaling and exploratory analysis",
      "Feature engineering across climate, soil, crop and history",
      "Regression and neural-network model comparison (MAE, RMSE, R²)",
      "Interactive Streamlit decision-support dashboard",
    ],
    tech: ["Python", "NumPy", "Pandas", "Scikit-learn", "TensorFlow", "Keras", "Matplotlib", "Seaborn", "Streamlit"],
    github: "https://github.com/Aamiruem/Indian-Crop-Optimization-Production",
    live: "https://indian-crop-optimization-appuction-kqfhgqkn6wfg6qeb44efik.streamlit.app/",
    featured: true,
  },
  {
    id: "agrismart",
    name: "AgriSmart – Agricultural Production Optimization Platform",
    category: "Full stack + AI / ML",
    status: "Live",
    description:
      "This website: a React platform with crop recommendation, yield prediction, soil, fertilizer, irrigation and weather tools backed by trained models, with FastAPI and Node.js services in the repository.",
    features: [
      "Crop advisor and yield forecasts with in-browser model fallbacks",
      "Live weather and FAO-56 irrigation planning",
      "Educational hub on production systems, machines, crops, health and nutrition",
    ],
    tech: ["React", "Vite", "FastAPI", "Node.js", "Scikit-learn", "Bootstrap/Sass"],
    github: "https://github.com/Aamiruem/Agricultural-Production-Optimization",
    live: "/",
  },
  {
    id: "mansik-santulan",
    name: "Mansik Santulan – Mental Wellness Score Prediction",
    category: "AI / ML · Health",
    status: "Live app",
    description:
      "A mental wellness scoring dashboard that evaluates mood, anxiety, sleep quality and stress, and presents an overall wellness index through interactive visualisations.",
    features: ["Scores multiple wellness dimensions", "Radial gauges, trend lines and breakdowns", "Runs live in the browser"],
    tech: ["Python", "Streamlit", "Pandas", "Plotly"],
    github: "https://github.com/Aamiruem/Mansik-Santulan-Scores",
    live: "https://mansik-santulan-scores-1.onrender.com",
  },
  {
    id: "rag-chatbot",
    name: "AI Chatbot with RAG",
    category: "LLM applications",
    status: "Prototype",
    description:
      "A conversational assistant that retrieves context from a curated document store before generating each answer, grounding responses in portfolio documents, projects and résumé.",
    features: [
      "Document chunking and embeddings (Sentence Transformers)",
      "FAISS similarity search for top-k retrieval",
      "Context-augmented LLM answers in a React chat UI",
    ],
    tech: ["Python", "LangChain", "Hugging Face", "FAISS", "Sentence Transformers", "React", "Flask"],
    github: "https://github.com/Aamiruem",
    githubNote: "No dedicated public repository is listed; links to the GitHub profile.",
    live: "https://aamir-hussain-azad.vercel.app/codehub/",
    liveLabel: "Portfolio CodeHub",
  },
  {
    id: "retail-analytics",
    name: "Retail Sales & Customer Insights Analytics Dashboard",
    category: "Data analytics",
    status: "Live app",
    description:
      "An end-to-end retail analytics workflow on synthetic data: auditable cleaning, a SQL star schema, EDA, RFM and K-Means customer segmentation, and Excel, Power BI-ready and Streamlit dashboards.",
    features: ["Data-quality checks and validated KPIs", "RFM + K-Means customer segments", "Interactive Streamlit dashboard"],
    tech: ["Python", "SQL", "SQLite", "Excel", "Power BI", "Streamlit"],
    github: "https://github.com/Aamiruem/Retail-sales-customer",
    live: "https://retail-sales-customer-fdug7zphhdjmvfoonctdkw.streamlit.app/",
  },
  {
    id: "zerodha",
    name: "Zerodha Trading Platform Clone",
    category: "Full-stack clone",
    status: "Completed",
    description:
      "A trading-platform clone with user authentication and an interactive dashboard, built to practise full-stack structure, routing, state and database flow.",
    features: ["Dashboard-style UI with reusable React components", "Authentication and data through backend APIs"],
    tech: ["React.js", "Node.js", "Express.js", "MongoDB"],
    github: "https://github.com/Aamiruem/Zerodha-Clone",
  },
  {
    id: "zoom",
    name: "Zoom Clone – Video Conferencing App",
    category: "Real-time communication",
    status: "Completed",
    description:
      "A real-time video conferencing application with multi-participant calls, in-call chat, mic/camera controls and room-based sessions.",
    features: ["Peer-to-peer audio/video with WebRTC", "Socket.IO signalling and rooms", "In-call chat and mute/video toggles"],
    tech: ["Node.js", "Express", "Socket.IO", "WebRTC", "HTML/CSS"],
    github: "https://github.com/Aamiruem/ApnaCollegeZoomClone",
  },
  {
    id: "estateiq",
    name: "EstateIQ – Real Estate Price Predictor",
    category: "Full stack + ML",
    status: "Completed",
    description:
      "Estimates a property's price from city, locality, size, rooms, floor, age and amenities, and shows the features that drove the estimate.",
    features: [
      "Scikit-learn pipeline with a Random Forest regressor (MAE, RMSE, R²)",
      "Supported cities and localities served by the API",
      "PostgreSQL with HttpOnly JWT cookies; Docker Compose",
    ],
    tech: ["Python", "FastAPI", "Scikit-learn", "PostgreSQL", "React", "Vite", "Docker"],
    github: "https://github.com/Aamiruem/Real-Estate-Price-Predictor",
  },
  {
    id: "arvixa",
    name: "Arvixa – Online Shopping Marketplace",
    category: "Full stack + ML + AI",
    status: "Completed",
    description:
      "A multi-seller marketplace with a React storefront, FastAPI backend on PostgreSQL and MongoDB, a seller hub, and ML features such as sales forecasts, segmentation and recommendations.",
    features: [
      "Search, cart, wishlist and checkout flow",
      "Seller hub with product and order management",
      "Sales forecast, RFM segments, churn model and RAG assistant",
    ],
    tech: ["React", "FastAPI", "PostgreSQL", "MongoDB", "Scikit-learn", "Docker", "AWS"],
    github: "https://github.com/Aamiruem/Shopping-Cart",
  },
  {
    id: "azarvis",
    name: "AZARVIS – Full-Stack AI Assistant (Jarvis)",
    category: "AI agents · Full stack",
    status: "Learning project",
    description:
      "A learning project spanning the modern stack: a React front end, Node/Express API with MongoDB, and a FastAPI AI service with agents, RAG, MCP, NLP, ML and computer vision.",
    features: ["Voice and webcam front end", "Node/Express gateway with auth and chat history", "FastAPI AI layer: agent, RAG, tasks and reminders"],
    tech: ["React", "Node.js", "Express", "MongoDB", "FastAPI", "Streamlit", "AWS"],
    github: "https://github.com/Aamiruem/Aamir-Jarvis-Assistant",
  },
];

// Requested projects that could not be verified from public sources.
export const UNVERIFIED_PROJECTS = [
  {
    name: "NeuroCity AI",
    reason: "No public repository or portfolio entry was found on 14 Nov 2026, so no details are shown.",
  },
];
