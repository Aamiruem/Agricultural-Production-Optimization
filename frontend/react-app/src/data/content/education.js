// Farmer education & resources: /farmer-education. Plain data (no imports).

export const EDUCATION_TOPICS = [
  {
    id: "modern-farming-techniques",
    icon: "Cpu",
    title: "Modern farming techniques",
    image: "education/modern-farming",
    alt: "Farmers watching a co-composting training demonstration near Bengaluru",
    text: "Combine improved varieties, mechanisation, micro-irrigation, protected cultivation and digital advisories to raise productivity while cutting costs.",
    points: [
      "Direct-seeded rice and zero-till wheat",
      "Raised-bed and ridge sowing",
      "Drip fertigation",
      "Drone and sensor-based monitoring",
    ],
    link: { to: "/agricultural-production-systems/precision-agriculture", label: "Precision agriculture" },
  },
  {
    id: "soil-testing",
    icon: "FlaskConical",
    title: "Soil testing",
    text: "Test soil every two to three years, or before each major crop. Take samples from 0–15 cm depth in a zig-zag pattern, mix them and send about half a kilogram to a soil-testing laboratory.",
    points: [
      "Avoid sampling near bunds, trees or manure heaps",
      "Sample before applying fertilizer",
      "Use your Soil Health Card recommendations",
    ],
    link: { to: "/soil-analysis", label: "Interpret your soil test" },
  },
  {
    id: "seed-selection",
    icon: "Sprout",
    title: "Seed selection",
    image: "education/seed-selection",
    alt: "A heap of Ponni paddy seed with a label",
    text: "Good seed alone can raise yield noticeably. Choose certified seed of varieties recommended for your region and season.",
    points: [
      "Buy certified or truthfully labelled seed with a bill",
      "Check germination with a simple 100-seed test",
      "Treat seed with fungicide or biofertilizer before sowing",
    ],
    link: { to: "/crop-recommendation", label: "Pick the right crop" },
  },
  {
    id: "irrigation-methods",
    icon: "Droplets",
    title: "Irrigation methods",
    text: "Match the method to crop and water: furrow and basin for field crops, sprinkler for close-spaced crops, drip for vegetables, orchards and sugarcane.",
    points: [
      "Irrigate at critical crop stages",
      "Irrigate in the morning or evening to reduce evaporation",
      "Mulch to conserve moisture",
    ],
    link: { to: "/irrigation-optimization", label: "Irrigation planner" },
  },
  {
    id: "crop-protection",
    icon: "Bug",
    title: "Crop protection",
    image: "education/crop-protection",
    alt: "A farm worker spraying a young crop with a knapsack sprayer",
    text: "Follow integrated pest management: prevention, regular scouting, economic thresholds and safe, targeted control.",
    points: [
      "Use resistant varieties and crop rotation",
      "Install pheromone and sticky traps",
      "Spray only when needed, with protective equipment",
    ],
    link: { to: "/disease-detection", label: "Disease scanner" },
  },
  {
    id: "fertilizer-application",
    icon: "Beaker",
    title: "Fertilizer application",
    text: "Apply the right source at the right rate, time and place (4R). Combine organic manure with mineral fertilizers based on soil test values.",
    points: [
      "Apply phosphorus and potash at sowing",
      "Split nitrogen into two or three doses",
      "Do not broadcast urea on dry soil or before heavy rain",
    ],
    link: { to: "/fertilizer", label: "Fertilizer planner" },
  },
  {
    id: "farm-management",
    icon: "ClipboardList",
    title: "Farm management",
    text: "Plan crops, labour, inputs and finance for the whole year. Keep simple records of every field's costs, operations and yields.",
    points: [
      "Prepare a seasonal crop calendar",
      "Record inputs, costs and yields by field",
      "Join an FPO for group buying and selling",
    ],
    link: { to: "/farms", label: "Record your farms" },
  },
  {
    id: "agricultural-economics",
    icon: "IndianRupee",
    title: "Agricultural economics",
    image: "education/agri-economics",
    alt: "Traders and farmers at a busy agricultural produce market",
    text: "Profit depends on cost of cultivation, yield and selling price. Know your break-even price and explore better markets.",
    points: [
      "Compare mandi prices on e-NAM before selling",
      "Check MSP for notified crops",
      "Use storage and warehouse receipts to avoid distress sales",
    ],
  },
  {
    id: "sustainable-development",
    icon: "Leaf",
    title: "Sustainable development",
    image: "education/sustainable-development",
    alt: "Solar panels powering an irrigation pump beside rice fields",
    text: "Protect soil and water, use renewable energy and diversify crops so the farm stays productive for the next generation.",
    points: [
      "Solar pumps cut diesel costs",
      "Avoid residue burning — use happy seeders or composting",
      "Harvest rainwater in farm ponds",
    ],
    link: { to: "/agricultural-production-systems/sustainable-agriculture", label: "Sustainable agriculture" },
  },
  {
    id: "government-schemes",
    icon: "Landmark",
    title: "Government agricultural schemes",
    image: "education/government-schemes",
    alt: "A Government of India Krishi Vigyan Kendra vehicle in Baramati, Maharashtra",
    text: "Central and state schemes support income, insurance, credit, irrigation, mechanisation and soil health. Always apply through official portals or your local agriculture office.",
    points: [
      "Beware of agents asking for fees",
      "Keep Aadhaar, land records and bank details updated",
      "Contact your Krishi Vigyan Kendra for help",
    ],
  },
];

// Scheme facts were checked against the official portal on `checked`.
// Where a portal page could not be read, only a general description is given.
export const SCHEMES_CHECKED = "2026-11-14";

export const GOVERNMENT_SCHEMES = [
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    full: "Pradhan Mantri Kisan Samman Nidhi",
    since: "Operational from 1 December 2018",
    benefit:
      "Income support of ₹6,000 per year in three equal instalments to land-holding farmer families. e-KYC is mandatory for registered farmers.",
    href: "https://pmkisan.gov.in/",
    verified: true,
  },
  {
    id: "pmfby",
    name: "PMFBY",
    full: "Pradhan Mantri Fasal Bima Yojana",
    since: "Launched 2016",
    benefit:
      "Crop insurance against yield losses from natural calamities, pests and diseases. Check premium rates, cut-off dates and claims on the portal.",
    href: "https://pmfby.gov.in/",
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card",
    full: "Soil Health Card Scheme",
    since: "Launched 2015",
    benefit: "Free soil testing with a card showing nutrient status and crop-wise fertilizer recommendations.",
    href: "https://soilhealth.dac.gov.in/",
  },
  {
    id: "pmksy",
    name: "PMKSY",
    full: "Pradhan Mantri Krishi Sinchayee Yojana",
    since: "Approved 1 July 2015",
    benefit:
      "Extends irrigation coverage ('Har Khet Ko Pani') and improves water-use efficiency ('Per Drop More Crop'), including support for drip and sprinkler irrigation.",
    href: "https://pmksy.gov.in/",
    verified: true,
  },
  {
    id: "enam",
    name: "e-NAM",
    full: "National Agriculture Market",
    since: "Launched 2016",
    benefit:
      "Online trading platform linking mandis so farmers can discover prices and sell to more buyers. Helpline: 1800 270 0224.",
    href: "https://enam.gov.in/web/",
    verified: true,
  },
  {
    id: "aif",
    name: "Agriculture Infrastructure Fund",
    full: "Agriculture Infrastructure Fund (AIF)",
    since: "Launched 2020",
    benefit:
      "₹1 lakh crore financing facility for post-harvest and community farm infrastructure, with 3% p.a. interest subvention and credit guarantee for loans up to ₹2 crore.",
    href: "https://agriinfra.dac.gov.in/",
    verified: true,
  },
  {
    id: "pm-kusum",
    name: "PM-KUSUM",
    full: "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan",
    since: "Launched 2019",
    benefit:
      "Support for solar pumps and solarising grid-connected agricultural pumps. Check current state-wise subsidy on the official portal.",
    href: "https://pmkusum.mnre.gov.in/",
  },
  {
    id: "smam",
    name: "SMAM",
    full: "Sub-Mission on Agricultural Mechanization",
    since: "Ongoing",
    benefit: "Subsidy to procure farm machinery and support for custom hiring centres and farm machinery banks.",
    href: "https://agrimachinery.nic.in/",
    verified: true,
  },
  {
    id: "nmnf",
    name: "National Mission on Natural Farming",
    full: "National Mission on Natural Farming (NMNF)",
    since: "Ongoing",
    benefit: "Promotes chemical-free natural farming through farmer training, clusters and bio-input resource centres.",
    href: "https://naturalfarming.dac.gov.in/",
  },
];

export const OFFICIAL_PORTALS = [
  { name: "Department of Agriculture & Farmers Welfare", href: "https://agriwelfare.gov.in/" },
  { name: "myScheme – find government schemes", href: "https://www.myscheme.gov.in/" },
  { name: "India Meteorological Department", href: "https://mausam.imd.gov.in/" },
];
