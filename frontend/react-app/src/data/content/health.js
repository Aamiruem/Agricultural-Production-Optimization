// Healthcare & farmer well-being: /farmer-health. Educational only — not medical advice.
// Plain data (no imports). No doctor profiles are listed: we only publish verified
// professional details, and none have been verified yet.

export const HEALTH_GALLERY = [
  { image: "health/doctor-consultation", alt: "A doctor examining a patient with a stethoscope", caption: "Doctor consultation" },
  { image: "health/healthcare-clinic", alt: "Front of a Primary Health Centre in Mahabubnagar, Telangana", caption: "Primary health centre" },
  { image: "health/rural-healthcare", alt: "Villagers gathered around a mobile medical unit ambulance in India", caption: "Mobile medical unit" },
  { image: "health/community-health-worker", alt: "A community health worker giving a vaccination to a child in Odisha", caption: "Community health worker" },
  { image: "health/awareness-campaign", alt: "Health workers registering people at a vaccination drive in Bhopal", caption: "Vaccination drive" },
];

export const HEALTH_TOPICS = [
  {
    id: "general-physician",
    icon: "Stethoscope",
    title: "General physician care",
    summary:
      "A general physician (GP) or medical officer at your nearest Primary Health Centre (PHC) or Ayushman Arogya Mandir is the first point of care for fever, cough, pain, injuries and long-term conditions.",
    points: [
      "Visit a registered MBBS doctor for diagnosis; avoid unqualified practitioners.",
      "Carry previous prescriptions and reports to every visit.",
      "Take medicines exactly as prescribed and complete antibiotic courses.",
      "Ask for referral to a specialist or district hospital when needed.",
    ],
  },
  {
    id: "rural-healthcare",
    icon: "Hospital",
    title: "Rural healthcare awareness",
    summary:
      "Government sub-centres, PHCs and Community Health Centres provide free or low-cost services. ASHA and ANM workers connect villages with these services.",
    points: [
      "Know the location and timing of your nearest PHC and CHC.",
      "Contact your village ASHA worker for maternal and child health services.",
      "Check eligibility for Ayushman Bharat (PM-JAY) health cover.",
      "Use eSanjeevani for free government teleconsultation from home.",
    ],
  },
  {
    id: "preventive-healthcare",
    icon: "ShieldCheck",
    title: "Preventive healthcare",
    summary: "Prevention is cheaper and safer than treatment. Regular check-ups catch problems early.",
    points: [
      "Complete childhood immunisation under the Universal Immunisation Programme.",
      "Adults over 30: get blood pressure, blood sugar and common cancer screening at health centres.",
      "Avoid tobacco and alcohol; stay physically active.",
      "Sleep under mosquito nets and remove standing water to prevent malaria and dengue.",
    ],
  },
  {
    id: "nutrition",
    icon: "Salad",
    title: "Nutrition and balanced diet",
    summary:
      "A balanced diet with cereals, pulses, vegetables, fruits, milk and healthy fats gives the energy and nutrients needed for heavy farm work.",
    points: [
      "Fill half the plate with vegetables and fruits, as recommended by ICMR-NIN.",
      "Include pulses, milk, eggs or other protein foods every day.",
      "Use iodised salt and limit salt, sugar and fried foods.",
      "Pregnant women, children and adolescents need extra iron and protein.",
    ],
    link: { to: "/food-and-nutrition", label: "Food & nutrition guide" },
  },
  {
    id: "first-aid",
    icon: "BriefcaseMedical",
    title: "First-aid awareness",
    summary: "Quick, correct first aid can save lives before professional help arrives.",
    points: [
      "Cuts: wash with clean water, press firmly to stop bleeding and cover with a clean dressing.",
      "Burns: cool under clean running water for about 20 minutes; do not apply ice, toothpaste or oil.",
      "Snakebite: keep the person calm and still, remove rings or tight items and go to a hospital immediately. Do not cut, suck or tie a tight tourniquet.",
      "Keep a basic first-aid kit at home and on the farm.",
    ],
    image: "health/first-aid",
    alt: "A first-aid kit with bandages and dressings",
  },
  {
    id: "clean-water",
    icon: "GlassWater",
    title: "Clean drinking water",
    summary: "Unsafe water spreads diarrhoea, cholera, typhoid and hepatitis. Safe water and hand-washing prevent most of these.",
    points: [
      "Drink water from a safe, protected source.",
      "If unsure, boil water (bring to a rolling boil) or use chlorine tablets as directed.",
      "Store drinking water in a clean, covered container and use a ladle.",
      "Wash hands with soap before eating and after using the toilet.",
    ],
    image: "health/clean-water",
    alt: "Children collecting water from a village hand pump",
  },
  {
    id: "farm-safety",
    icon: "HardHat",
    title: "Occupational health and farm safety",
    summary: "Machinery, tools, animals, electricity and long hours make farming a high-risk occupation.",
    points: [
      "Switch off engines and PTO before clearing blockages in threshers or chaff cutters.",
      "Keep children away from machinery, ponds and chemical stores.",
      "Use correct lifting posture and take regular breaks.",
      "Check wiring of pumps and motors; never handle them with wet hands.",
    ],
  },
  {
    id: "heat-stress",
    icon: "ThermometerSun",
    title: "Heat-stress prevention",
    summary: "Working in hot fields can cause heat exhaustion and life-threatening heat stroke.",
    points: [
      "Drink water often, even if not thirsty; carry water and ORS to the field.",
      "Avoid heavy work in the hottest hours (about 12 noon to 3 pm); start early.",
      "Wear light, loose cotton clothes and cover the head.",
      "Heat stroke signs — very high body temperature, confusion, fainting, hot dry skin — are an emergency: cool the person and call 112/108.",
    ],
  },
  {
    id: "pesticide-safety",
    icon: "SprayCan",
    title: "Pesticide exposure safety",
    summary: "Pesticides can poison through skin, breathing or swallowing. Safe handling protects you and your family.",
    points: [
      "Read and follow the label; use only the recommended dose.",
      "Wear gloves, mask, goggles, long sleeves and full-length trousers while mixing and spraying.",
      "Do not eat, drink or smoke while spraying; spray with the wind blowing away from you.",
      "Bathe and wash clothes separately after spraying. Store pesticides locked and away from food and children; never reuse containers.",
      "Signs such as headache, dizziness, vomiting, sweating or breathing difficulty need urgent medical care — take the pesticide label to the doctor.",
    ],
    image: "health/farm-safety",
    alt: "A person helping another put on protective equipment before spraying pesticides",
  },
  {
    id: "mental-wellness",
    icon: "HeartHandshake",
    title: "Mental wellness awareness",
    summary:
      "Crop loss, debt, uncertainty and isolation cause real stress. Mental health problems are common and treatable — asking for help is a sign of strength.",
    points: [
      "Talk to family, friends or a trusted community member about worries.",
      "Watch for persistent sadness, sleep problems, withdrawal or hopelessness.",
      "Call Tele MANAS on 14416 for free, confidential mental-health support.",
      "In a crisis or if someone is in danger, call 112 immediately.",
    ],
  },
];

// Official services to find and verify doctors (instead of unverified doctor listings).
export const HEALTH_RESOURCES = [
  {
    name: "National Medical Commission – Indian Medical Register",
    text: "Check whether a doctor is registered by searching their name or registration number.",
    href: "https://www.nmc.org.in/information-desk/indian-medical-register/",
  },
  {
    name: "eSanjeevani",
    text: "Government of India's free national telemedicine service for doctor consultations.",
    href: "https://esanjeevani.mohfw.gov.in/",
  },
  {
    name: "Ayushman Bharat PM-JAY beneficiary portal",
    text: "Check eligibility for health cover and find empanelled hospitals.",
    href: "https://beneficiary.nha.gov.in/",
  },
  {
    name: "Tele MANAS",
    text: "National tele-mental health programme — free, round-the-clock support in many languages.",
    href: "https://telemanas.mohfw.gov.in/",
  },
];

export const HELPLINES = [
  { number: "112", label: "National emergency (police, fire, ambulance)" },
  { number: "108", label: "Ambulance (available in most states)" },
  { number: "14416", label: "Tele MANAS mental-health support" },
  { number: "1800-180-1551", label: "Kisan Call Centre (farming queries)" },
];

export const MEDICAL_DISCLAIMER =
  "Educational information is not a substitute for professional medical advice. Always consult a qualified, registered doctor for diagnosis and treatment. In an emergency, call 112.";
