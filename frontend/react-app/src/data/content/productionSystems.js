// Agricultural production systems: educational content for /agricultural-production-systems
// and one detail page per topic. Plain data (no imports) so the build can prerender SEO tags.

export const PRODUCTION_GROUPS = [
  { id: "systems", title: "Farming systems", lead: "How a farm is organised: scale, purpose, inputs and enterprises." },
  {
    id: "practices",
    title: "Resource & crop management",
    lead: "The practices every system relies on: water, soil, nutrients and protection.",
  },
  { id: "patterns", title: "Cropping patterns", lead: "How crops are arranged in time and space on the same land." },
];

export const PRODUCTION_SYSTEMS = [
  {
    slug: "crop-production-systems",
    group: "systems",
    title: "Crop Production Systems",
    image: "systems/crop-production-systems",
    alt: "Women farm workers walking between rows of young green crops in Gujarat, India",
    summary: "The complete chain of decisions and operations that turns land, water, seed and labour into a harvest.",
    definition:
      "A crop production system is the combination of crops, cropping sequence, land preparation, inputs, labour, machinery and management used on a farm to produce food, fibre, fodder or fuel. It covers the whole cycle — from choosing a crop for the soil and season, through sowing and crop care, to harvesting and post-harvest handling.",
    importance:
      "Every food system starts here. Choosing the right system for local soil, rainfall and markets decides yield, input cost, farm income and how sustainably the land is used. In India, where most holdings are small and much of the cropped area depends on the monsoon, a well-designed system is the main defence against weather and price risk.",
    process: [
      "Assess resources: soil type and test results, water source, farm size, labour, credit and market access.",
      "Select crops and varieties suited to the season (Kharif, Rabi or Zaid) and agro-climatic zone.",
      "Prepare the land: ploughing or minimum tillage, levelling, bed or ridge formation and drainage.",
      "Sow at the right time with treated, certified seed at the recommended seed rate and spacing.",
      "Manage the crop: irrigation scheduling, balanced nutrition, weed control and pest and disease monitoring.",
      "Harvest at physiological maturity, then dry, clean, grade and store or sell the produce.",
    ],
    advantages: [
      "Gives a structured plan that reduces guesswork and wasted inputs.",
      "Lets farmers match crops to soil, water and market demand.",
      "Makes yields more predictable and easier to finance and insure.",
      "Creates a baseline to measure and improve season after season.",
    ],
    limitations: [
      "Depends heavily on weather; drought, floods or heat can upset the best plan.",
      "Requires timely access to seed, fertilizer, credit and machinery.",
      "Market prices at harvest can wipe out gains from higher yields.",
    ],
    india:
      "India grows crops in three main seasons — Kharif (monsoon), Rabi (winter) and Zaid (summer). Rice–wheat in the Indo-Gangetic plains, cotton–soybean in central India and rice–pulses in the east are common examples of regional crop production systems.",
    related: ["crop-rotation", "precision-agriculture", "sustainable-agriculture"],
    tools: [
      { to: "/crop-recommendation", label: "AI crop advisor" },
      { to: "/seasonal-advisor", label: "Season advisor" },
    ],
  },
  {
    slug: "subsistence-farming",
    group: "systems",
    title: "Subsistence Farming",
    image: "systems/subsistence-farming",
    alt: "A small homestead farm with mud houses, a fenced vegetable plot and free-ranging poultry",
    summary: "Farming mainly to feed the farmer's own household, with little produce left over for sale.",
    definition:
      "Subsistence farming is a system in which a farm family grows crops and raises animals mainly for its own consumption. Farms are usually small, use family labour, traditional tools and locally saved seed, and grow a mix of food crops to meet the household's needs through the year.",
    importance:
      "Subsistence and semi-subsistence farms still support millions of rural households. They protect food security at the family level, conserve traditional crop varieties and knowledge, and act as a safety net when markets or jobs fail.",
    process: [
      "Clear and prepare a small plot, often with hand tools or draught animals.",
      "Sow a mix of staple cereals, pulses and vegetables, frequently using saved seed.",
      "Rely mainly on rainfall, farmyard manure and household labour.",
      "Harvest and store most of the produce at home for year-round use.",
      "Sell or barter only the small surplus left after household needs.",
    ],
    advantages: [
      "Low cash investment and low dependence on purchased inputs.",
      "Diverse crops spread risk and improve household diets.",
      "Preserves local seed diversity and traditional knowledge.",
    ],
    limitations: [
      "Low yields and low income keep families vulnerable to shocks.",
      "Little surplus means limited money for health, education or investment.",
      "Highly exposed to drought and pests with few coping tools.",
    ],
    india:
      "Semi-subsistence farming remains common in rain-fed, hilly and tribal regions. Improved seed, soil testing, small-scale irrigation and access to markets through farmer producer organisations (FPOs) help such farms move towards a marketable surplus.",
    related: ["mixed-farming", "integrated-farming", "commercial-farming"],
    tools: [{ to: "/soil-analysis", label: "Soil health check" }],
  },
  {
    slug: "commercial-farming",
    group: "systems",
    title: "Commercial Farming",
    image: "systems/commercial-farming",
    alt: "A mechanical sugarcane harvester loading cut cane into a trailer on a large commercial farm",
    summary: "Growing crops or raising livestock primarily for sale and profit.",
    definition:
      "Commercial farming is market-oriented agriculture in which crops and livestock are produced mainly for sale. It typically uses higher-yielding varieties, purchased inputs, machinery and hired labour, and often specialises in one or a few high-value products.",
    importance:
      "Commercial farms supply cities, food processors and export markets. They raise farm incomes, create rural jobs in transport, processing and services, and drive adoption of new technology.",
    process: [
      "Study market demand, prices and contracts before choosing the crop.",
      "Invest in quality seed, fertilizers, irrigation and mechanisation.",
      "Follow standardised practices to meet quality and volume targets.",
      "Harvest, grade, pack and transport produce to buyers or processors.",
      "Track costs, yields and prices to manage profit and risk.",
    ],
    advantages: [
      "Higher income potential and better access to credit.",
      "Economies of scale lower the cost per unit of output.",
      "Encourages modern technology, grading and value addition.",
    ],
    limitations: [
      "High input costs increase financial risk if prices fall.",
      "Monoculture can deplete soil and increase pest pressure.",
      "Heavy use of water and chemicals can harm the environment if unmanaged.",
    ],
    india:
      "Sugarcane, cotton, tea, coffee, rubber, spices and fruits such as banana and grapes are widely grown on a commercial basis. Contract farming and FPOs help small farmers reach these markets.",
    related: ["intensive-farming", "precision-agriculture", "crop-rotation"],
    tools: [{ to: "/yield-prediction", label: "Yield forecast" }],
  },
  {
    slug: "intensive-farming",
    group: "systems",
    title: "Intensive Farming",
    image: "systems/intensive-farming",
    alt: "Rows of polyhouses used for intensive vegetable cultivation on terraced land in Himachal Pradesh",
    summary: "Producing high output from a small area by using more labour, capital and inputs per hectare.",
    definition:
      "Intensive farming aims to maximise production per unit of land. Farmers use high-yielding varieties, multiple crops per year, assured irrigation, fertilizers, crop protection and often protected structures such as polyhouses and net houses.",
    importance:
      "Where land is scarce and population density is high, intensive systems produce more food from the same area. They are central to vegetable, flower and nursery production near cities.",
    process: [
      "Choose high-value or high-yielding crops with a dependable market.",
      "Provide assured irrigation — often drip or sprinkler — and fertigation.",
      "Grow two or three crops a year with short-duration varieties.",
      "Use protected cultivation (polyhouse, shade net) to control climate where viable.",
      "Monitor pests closely and use integrated pest management to limit chemical use.",
    ],
    advantages: [
      "Very high yield and income per hectare.",
      "Year-round production and better control over quality.",
      "Efficient use of limited land near markets.",
    ],
    limitations: [
      "High capital, energy and input requirements.",
      "Risk of soil degradation, salinity and groundwater depletion if overused.",
      "Needs skilled management; mistakes are costly.",
    ],
    india:
      "Polyhouse vegetable farming in Himachal Pradesh, Maharashtra and Karnataka, and multiple cropping in irrigated Punjab and Haryana, are examples of intensive agriculture.",
    related: ["irrigation-systems", "fertilizer-management", "extensive-farming"],
    tools: [{ to: "/irrigation-optimization", label: "Irrigation planner" }],
  },
  {
    slug: "extensive-farming",
    group: "systems",
    title: "Extensive Farming",
    image: "systems/extensive-farming",
    alt: "A herd of cattle grazing on a wide open pasture under a blue sky",
    summary: "Farming large areas with relatively low inputs of labour and capital per hectare.",
    definition:
      "Extensive farming uses large areas of land with low inputs of labour, fertilizer and capital per unit area. Output per hectare is lower than in intensive systems, but total production can be large because the area is large. Ranching and large rain-fed grain farms are typical examples.",
    importance:
      "Extensive systems make productive use of land where rainfall, soils or terrain do not support intensive cropping. Well-managed grazing lands also store carbon and support biodiversity.",
    process: [
      "Use large, often rain-fed fields or natural grasslands.",
      "Sow drought-tolerant crops or manage pasture for grazing livestock.",
      "Rely on natural soil fertility and rotation rather than heavy fertilizer use.",
      "Use machinery to cover large areas with few workers.",
      "Adjust stocking rates or sown area to the season's rainfall.",
    ],
    advantages: [
      "Low input cost per hectare and lower chemical use.",
      "Lower pollution risk and more natural habitat.",
      "Less labour required per unit of land.",
    ],
    limitations: [
      "Low yield per hectare and high dependence on rainfall.",
      "Needs large land holdings, which are rare in India.",
      "Overgrazing can degrade pasture and cause erosion.",
    ],
    india:
      "Extensive pastoral systems are found in arid Rajasthan and Gujarat and in Himalayan grazing lands, where communities move herds with the seasons.",
    related: ["intensive-farming", "mixed-farming", "sustainable-agriculture"],
    tools: [{ to: "/weather", label: "Weather outlook" }],
  },
  {
    slug: "organic-farming",
    group: "systems",
    title: "Organic Farming",
    image: "systems/organic-farming",
    alt: "A diverse organic vegetable plot with mulched beds and trees on the field boundary",
    summary:
      "Farming without synthetic fertilizers and pesticides, relying on natural soil fertility and biological pest control.",
    definition:
      "Organic farming is a production system that avoids synthetic fertilizers, pesticides, growth regulators and genetically modified organisms. It builds soil fertility with compost, green manure, crop residues and biofertilizers, and manages pests through crop rotation, resistant varieties, natural enemies and botanical preparations.",
    importance:
      "Organic methods improve soil organic matter and biology, reduce chemical residues in food and water, and can earn premium prices. Certification gives consumers confidence in what they buy.",
    process: [
      "Convert land over a transition period, keeping records of inputs and practices.",
      "Build soil fertility with compost, vermicompost, green manure and legumes.",
      "Use certified organic or untreated seed and diverse crop rotations.",
      "Control pests with traps, natural enemies, resistant varieties and approved bio-pesticides.",
      "Obtain certification (for example under India's NPOP or the PGS-India system) to sell as organic.",
    ],
    advantages: [
      "Improves soil health, water-holding capacity and biodiversity.",
      "Lower chemical residues and reduced pollution.",
      "Premium prices and growing domestic and export demand.",
    ],
    limitations: [
      "Yields can fall during the conversion period.",
      "Labour-intensive and needs reliable sources of organic manure.",
      "Certification takes time and has costs and paperwork.",
    ],
    india:
      "Sikkim was declared India's first fully organic state in 2016. The Paramparagat Krishi Vikas Yojana (PKVY) supports cluster-based organic farming and PGS-India certification.",
    related: ["sustainable-agriculture", "soil-management", "pest-disease-management"],
    tools: [{ to: "/soil-analysis", label: "Soil health check" }],
  },
  {
    slug: "integrated-farming",
    group: "systems",
    title: "Integrated Farming",
    image: "systems/integrated-farming",
    alt: "Ducks swimming in a farm pond covered with aquatic plants as part of an integrated farming system",
    summary: "Linking crops, livestock, fish, poultry and trees so the waste of one enterprise feeds another.",
    definition:
      "An integrated farming system (IFS) combines several interdependent enterprises — such as crops, dairy, poultry, fisheries, horticulture, beekeeping and agroforestry — on one farm. By-products are recycled: manure fertilises fields and ponds, crop residues feed animals and pond silt enriches soil.",
    importance:
      "IFS gives small farmers several income streams across the year, uses resources efficiently, and reduces dependence on purchased inputs. It is widely recommended by agricultural research institutes for small and marginal holdings.",
    process: [
      "Map the farm's land, water, labour and market opportunities.",
      "Choose complementary enterprises, for example rice + fish + ducks, or crops + dairy + biogas.",
      "Design nutrient flows: manure to fields and ponds, residues to feed, slurry to compost.",
      "Stagger activities so labour and income are spread through the year.",
      "Keep records of each enterprise to adjust the mix over time.",
    ],
    advantages: [
      "Higher and more stable income from several sources.",
      "Recycling reduces fertilizer and feed costs.",
      "Better household nutrition and year-round employment.",
    ],
    limitations: [
      "Needs more management skill and planning.",
      "Initial investment in ponds, sheds or animals.",
      "Disease in one enterprise can affect others if hygiene is poor.",
    ],
    india:
      "Rice–fish farming in Assam, West Bengal and Odisha, and crop–dairy–biogas systems in many states, are common integrated models.",
    related: ["mixed-farming", "sustainable-agriculture", "subsistence-farming"],
    tools: [{ to: "/farms", label: "Farm planner" }],
  },
  {
    slug: "mixed-farming",
    group: "systems",
    title: "Mixed Farming",
    image: "systems/mixed-farming",
    alt: "Farmers sowing a field behind a pair of bullocks in Raichur, Karnataka",
    summary: "Growing crops and rearing livestock together on the same farm.",
    definition:
      "Mixed farming is a system in which crop cultivation and livestock rearing are carried out together on the same farm. Animals provide draught power, manure, milk and meat, while crops provide food for the family and fodder for animals.",
    importance:
      "Mixing crops and animals spreads risk: if a crop fails, milk or animal sales still bring income. Manure maintains soil fertility, and draught animals reduce fuel costs on small farms.",
    process: [
      "Grow food crops alongside fodder crops such as berseem, sorghum or maize.",
      "Keep cattle, buffaloes, goats or poultry suited to the farm's feed and water.",
      "Use animal manure and urine to fertilise fields; use crop residues as feed.",
      "Use bullocks for ploughing and transport where mechanisation is limited.",
      "Sell milk, eggs or animals for regular cash flow.",
    ],
    advantages: [
      "Regular income from milk and animal products between harvests.",
      "Natural fertiliser from manure lowers input costs.",
      "Spreads risk across crops and livestock.",
    ],
    limitations: [
      "Animals need daily care, feed, water and veterinary services.",
      "Requires land for fodder, which competes with food crops.",
      "Animal diseases can cause sudden losses.",
    ],
    india:
      "Most Indian farms are mixed: dairy is an important source of household income alongside crops, especially in Punjab, Haryana, Gujarat and Uttar Pradesh.",
    related: ["integrated-farming", "subsistence-farming", "crop-rotation"],
    tools: [{ to: "/crop-recommendation", label: "AI crop advisor" }],
  },
  {
    slug: "precision-agriculture",
    group: "systems",
    title: "Precision Agriculture",
    image: "systems/precision-agriculture",
    alt: "A self-propelled applicator with autonomy technology applying inputs across a large field",
    summary: "Using sensors, GPS, data and AI to give each part of a field exactly what it needs.",
    definition:
      "Precision agriculture is a management approach that measures variation within fields — in soil, moisture, nutrients, pests and yield — and responds with site-specific actions. It uses technologies such as GNSS/GPS guidance, soil and crop sensors, drones, satellite imagery, variable-rate application and machine-learning models.",
    importance:
      "Applying inputs only where and when they are needed lowers costs, raises yields and reduces fertilizer and pesticide runoff. Data from each season makes the next season's decisions better.",
    process: [
      "Collect data: soil samples, sensor readings, satellite or drone images and yield maps.",
      "Analyse variability and divide fields into management zones.",
      "Generate prescriptions for seed, fertilizer, water or spray rates per zone.",
      "Apply with GPS-guided, variable-rate machinery or targeted manual operations.",
      "Record results and compare yield and cost by zone to refine the next season.",
    ],
    advantages: [
      "Reduces waste of seed, fertilizer, water and chemicals.",
      "Improves yield and uniformity across the field.",
      "Creates records useful for credit, insurance and traceability.",
    ],
    limitations: [
      "Equipment, software and data services can be expensive.",
      "Needs digital skills and reliable connectivity.",
      "Small, fragmented plots limit some machinery-based techniques.",
    ],
    india:
      "Low-cost precision tools suited to small farms include Soil Health Card based fertilizer doses, smartphone advisories, drone spraying services and AI models such as AgriSmart's crop and yield predictors.",
    related: ["crop-production-systems", "fertilizer-management", "irrigation-systems"],
    tools: [
      { to: "/crop-recommendation", label: "AI crop advisor" },
      { to: "/yield-prediction", label: "Yield forecast" },
    ],
  },
  {
    slug: "sustainable-agriculture",
    group: "systems",
    title: "Sustainable Agriculture",
    image: "systems/sustainable-agriculture",
    alt: "Vegetables growing under a canopy of trees on a farm practising sustainable agriculture",
    summary:
      "Meeting today's food needs while protecting soil, water, biodiversity and farm livelihoods for the future.",
    definition:
      "Sustainable agriculture is farming that is productive and profitable while conserving natural resources and protecting the environment and community health over the long term. It combines practices such as crop rotation, cover crops, conservation tillage, integrated nutrient and pest management, efficient irrigation and agroforestry.",
    importance:
      "Soil erosion, falling groundwater, biodiversity loss and climate change threaten future harvests. Sustainable practices keep land productive, reduce greenhouse-gas emissions and make farms more resilient to extreme weather.",
    process: [
      "Protect soil with minimum tillage, mulching and cover crops.",
      "Rotate and diversify crops, including legumes that fix nitrogen.",
      "Apply nutrients based on soil tests and combine organic and mineral sources.",
      "Use water efficiently with drip, sprinkler and rainwater harvesting.",
      "Manage pests with integrated pest management and protect pollinators.",
      "Plant trees on boundaries and conserve natural habitats on the farm.",
    ],
    advantages: [
      "Maintains long-term soil fertility and water availability.",
      "Reduces input costs and pollution.",
      "Improves resilience to drought, floods and price shocks.",
    ],
    limitations: [
      "Benefits can take several seasons to show.",
      "Requires knowledge, planning and sometimes new equipment.",
      "Short-term yields may dip while practices change.",
    ],
    india:
      "The National Mission for Sustainable Agriculture (NMSA), soil health management and natural-farming programmes promote these practices across India.",
    related: ["organic-farming", "crop-rotation", "soil-management"],
    tools: [{ to: "/rotation-planner", label: "Rotation planner" }],
  },
  {
    slug: "irrigation-systems",
    group: "practices",
    title: "Irrigation Systems",
    image: "systems/irrigation-systems",
    alt: "Rows of lettuce irrigated by drip lines in a field",
    summary: "Supplying water to crops at the right time and in the right amount.",
    definition:
      "Irrigation is the controlled application of water to crops to supplement rainfall. Common methods are surface irrigation (flood, furrow and basin), sprinkler irrigation, drip (micro) irrigation and sub-surface systems. Smart irrigation adds soil-moisture sensors, weather data and automated controllers.",
    importance:
      "Water is often the main limit on yield. Efficient irrigation stabilises production against erratic rainfall, enables a second or third crop, and conserves scarce groundwater.",
    process: [
      "Estimate crop water need from evapotranspiration, crop stage and rainfall.",
      "Choose a method suited to crop, soil, slope and water availability.",
      "Design the layout: mains, laterals, emitters or sprinklers, filters and pumps.",
      "Schedule irrigation using soil moisture, weather forecasts or ET-based calculations.",
      "Maintain the system: flush filters and lines, check pressure and fix leaks.",
    ],
    advantages: [
      "Drip and sprinkler systems can save substantial water compared with flooding.",
      "Higher, more stable yields and better crop quality.",
      "Fertigation delivers nutrients directly to roots.",
    ],
    limitations: [
      "Micro-irrigation has upfront cost and needs clean water and maintenance.",
      "Over-irrigation causes waterlogging, salinity and nutrient loss.",
      "Electricity or fuel supply affects pumping reliability.",
    ],
    india:
      "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY), with its 'Har Khet Ko Pani' and 'Per Drop More Crop' components, supports irrigation coverage and micro-irrigation.",
    related: ["precision-agriculture", "sustainable-agriculture", "soil-management"],
    tools: [{ to: "/irrigation-optimization", label: "Irrigation planner (FAO-56)" }],
  },
  {
    slug: "soil-management",
    group: "practices",
    title: "Soil Management",
    image: "systems/soil-management",
    alt: "Freshly ploughed red soil in a field with hills in the background",
    summary: "Keeping soil fertile, well-structured and biologically active.",
    definition:
      "Soil management is the set of practices that maintain or improve soil physical structure, chemical fertility and biological activity. It includes soil testing, tillage choices, organic matter addition, erosion control, pH correction and drainage.",
    importance:
      "Healthy soil holds water and nutrients, supports roots and soil life, and determines how well crops respond to every other input. Degraded soil reduces yields and increases costs.",
    process: [
      "Test soil regularly for pH, EC, organic carbon, N, P, K and micronutrients.",
      "Add organic matter through compost, farmyard manure, green manure and residues.",
      "Correct acidity with lime or alkalinity with gypsum where tests show the need.",
      "Choose suitable tillage — reduce tillage where possible to protect structure.",
      "Control erosion with contour bunds, cover crops and mulching.",
    ],
    advantages: [
      "Higher fertilizer efficiency and better yields.",
      "Improved water infiltration and drought tolerance.",
      "Long-term productivity of the land.",
    ],
    limitations: [
      "Improvements in soil organic matter are slow.",
      "Testing and amendments have a cost.",
      "Requires consistent practice over many seasons.",
    ],
    india:
      "The Soil Health Card scheme provides farmers with soil test results and crop-wise nutrient recommendations.",
    related: ["fertilizer-management", "organic-farming", "crop-rotation"],
    tools: [
      { to: "/soil-analysis", label: "Soil health check" },
      { to: "/soil-types", label: "Soil types of India" },
    ],
  },
  {
    slug: "fertilizer-management",
    group: "practices",
    title: "Fertilizer Management",
    image: "systems/fertilizer-management",
    alt: "A tractor spreading manure over a field before sowing",
    summary: "Applying the right nutrient source, at the right rate, time and place.",
    definition:
      "Fertilizer management (integrated nutrient management) is the balanced use of mineral fertilizers, organic manures and biofertilizers to meet crop nutrient needs. It follows the '4R' principle: right source, right rate, right time and right place.",
    importance:
      "Balanced nutrition raises yields and quality, while overuse wastes money and pollutes water and air. Imbalanced use — such as excess nitrogen — reduces soil health over time.",
    process: [
      "Start from a soil test and the crop's target yield.",
      "Calculate N, P and K doses and any secondary or micronutrient needs.",
      "Choose sources such as urea, DAP, MOP, SSP, compost and biofertilizers.",
      "Split nitrogen into basal and top-dress doses matched to crop stages.",
      "Place fertilizer near roots (banding, fertigation) and avoid application before heavy rain.",
    ],
    advantages: [
      "Higher nutrient-use efficiency and lower cost per tonne of produce.",
      "Better crop quality and soil health.",
      "Reduced nitrate leaching and emissions.",
    ],
    limitations: [
      "Requires soil testing and some calculation.",
      "Fertilizer availability and price vary by season.",
      "Organic sources are bulky and need labour.",
    ],
    india:
      "Soil Health Card recommendations, neem-coated urea and nano-fertilizer formulations are part of India's push for balanced nutrient use.",
    related: ["soil-management", "precision-agriculture", "organic-farming"],
    tools: [{ to: "/fertilizer", label: "Fertilizer planner" }],
  },
  {
    slug: "pest-disease-management",
    group: "practices",
    title: "Pest and Disease Management",
    image: "systems/pest-disease-management",
    alt: "A yellow sticky trap hanging among crop plants to monitor insect pests",
    summary: "Protecting crops with prevention, monitoring and targeted control (IPM).",
    definition:
      "Integrated Pest Management (IPM) is an approach that keeps pests, diseases and weeds below economically damaging levels by combining cultural, mechanical, biological and — only when necessary — chemical methods, guided by regular field monitoring.",
    importance:
      "Pests and diseases can destroy a large share of a crop. IPM protects yield while reducing pesticide costs, residues, resistance and harm to pollinators, people and the environment.",
    process: [
      "Prevent: resistant varieties, clean seed, crop rotation and timely sowing.",
      "Monitor: scout fields weekly and use sticky, light and pheromone traps.",
      "Decide: compare pest levels with economic threshold levels (ETL).",
      "Control: use biological agents (Trichoderma, Trichogramma), botanicals and mechanical methods first.",
      "Spray safely only when needed, using the label dose and protective equipment.",
    ],
    advantages: [
      "Lower pesticide use and cost.",
      "Slows the development of pesticide resistance.",
      "Safer for farm workers, consumers and beneficial insects.",
    ],
    limitations: [
      "Requires regular scouting and pest identification skills.",
      "Biological agents need correct storage and timing.",
      "Area-wide pests need community-level action.",
    ],
    india:
      "Central Integrated Pest Management Centres and Krishi Vigyan Kendras run IPM demonstrations and farmer field schools.",
    related: ["organic-farming", "crop-rotation", "intercropping"],
    tools: [{ to: "/disease-detection", label: "Disease scanner" }],
  },
  {
    slug: "crop-rotation",
    group: "patterns",
    title: "Crop Rotation",
    image: "systems/crop-rotation",
    alt: "Experimental field plots comparing crop rotation with monoculture",
    summary: "Growing different crops in sequence on the same land across seasons.",
    definition:
      "Crop rotation is the practice of growing a planned sequence of different crops on the same field over successive seasons or years — for example a cereal followed by a legume, then an oilseed. Each crop has different nutrient needs, rooting depth and pests.",
    importance:
      "Rotation breaks pest and disease cycles, improves soil structure and fertility, and reduces reliance on chemicals. Legumes in the rotation add nitrogen for the next crop.",
    process: [
      "List suitable crops for each season on the farm.",
      "Alternate deep- and shallow-rooted crops and heavy and light feeders.",
      "Include a legume (gram, lentil, moong, soybean) at least once in the cycle.",
      "Avoid growing crops of the same family back-to-back.",
      "Record the sequence and its effect on yields and pests.",
    ],
    advantages: [
      "Better soil fertility and structure.",
      "Fewer pest, disease and weed problems.",
      "Diversified income and reduced market risk.",
    ],
    limitations: [
      "Market or procurement support may favour a single crop.",
      "Needs planning and knowledge of each crop.",
      "Some rotation crops may earn less in a given year.",
    ],
    india:
      "Diversifying the rice–wheat system with pulses, oilseeds or maize is a key recommendation for Punjab and Haryana to save groundwater and restore soils.",
    related: ["intercropping", "soil-management", "sustainable-agriculture"],
    tools: [{ to: "/rotation-planner", label: "Rotation planner" }],
  },
  {
    slug: "intercropping",
    group: "patterns",
    title: "Intercropping and Multiple Cropping",
    image: "systems/intercropping",
    alt: "Marigold flowers grown as an intercrop between coconut palms",
    summary: "Growing two or more crops together, or several crops a year, on the same land.",
    definition:
      "Intercropping is growing two or more crops at the same time on the same field in a definite row pattern, such as maize with soybean or coconut with marigold. Multiple cropping is the broader practice of growing more than one crop on the same land in a year — either together (intercropping) or one after another (sequential cropping).",
    importance:
      "These systems raise total output and income per hectare, use light, water and nutrients more fully, and act as insurance: if one crop fails, the other still yields.",
    process: [
      "Pair crops with different heights, rooting depths and maturity periods.",
      "Choose a row ratio (for example 2:1 or 4:2) and spacing for both crops.",
      "Plan fertilizer and irrigation for the combined crop needs.",
      "Manage harvest timing so one crop does not damage the other.",
      "For multiple cropping, use short-duration varieties to fit extra crops into the year.",
    ],
    advantages: [
      "Higher land-use efficiency and total income.",
      "Reduced risk of total crop failure.",
      "Legume intercrops improve soil nitrogen and suppress weeds.",
    ],
    limitations: [
      "More complex management and harvesting.",
      "Mechanisation is harder with mixed rows.",
      "Crops can compete for water and nutrients if poorly matched.",
    ],
    india:
      "Common Indian intercrops include pigeon pea with soybean or cotton, sugarcane with onion or potato, and coconut or arecanut gardens with spices, pineapple or flowers.",
    related: ["crop-rotation", "mixed-farming", "sustainable-agriculture"],
    tools: [{ to: "/rotation-planner", label: "Rotation planner" }],
  },
];

export const SYSTEM_BY_SLUG = Object.fromEntries(PRODUCTION_SYSTEMS.map((s) => [s.slug, s]));
