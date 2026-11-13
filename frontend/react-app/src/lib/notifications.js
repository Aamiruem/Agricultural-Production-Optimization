import { G } from "@/lib/icons";

/** Season-aware notifications computed from the month (0 = January). */
export function seasonalNotifications(month, lang) {
  const hi = lang === "hi";
  const items = [];
  if (month >= 9 || month <= 0) items.push({ id: `rabi-${month}`, icon: "calendar_month", color: G.blue, to: "/crops?season=rabi",
    title: hi ? "रबी बुवाई का समय" : "Rabi sowing window", body: hi ? "गेहूँ, चना, सरसों की बुवाई अक्टूबर–दिसंबर।" : "Wheat, chickpea and mustard: sow Oct – Dec." });
  if (month >= 5 && month <= 7) items.push({ id: `kharif-${month}`, icon: "rainy", color: G.green, to: "/crops?season=kharif",
    title: hi ? "खरीफ बुवाई का समय" : "Kharif sowing window", body: hi ? "मानसून के साथ धान, कपास, सोयाबीन की बुवाई।" : "Sow rice, cotton and soybean with the monsoon." });
  if (month >= 2 && month <= 4) items.push({ id: `zaid-${month}`, icon: "wb_sunny", color: G.orange, to: "/irrigation-optimization",
    title: hi ? "ज़ायद फसल और गर्मी" : "Zaid crops & heat", body: hi ? "मूंग, तरबूज के लिए सिंचाई योजना बनाएँ।" : "Plan irrigation for moong, melons and fodder." });
  items.push({ id: "weather", icon: "partly_cloudy_day", color: G.yellow, to: "/weather",
    title: hi ? "छिड़काव से पहले मौसम देखें" : "Check weather before spraying", body: hi ? "बारिश या तेज़ हवा में छिड़काव न करें।" : "Avoid spraying before rain or in strong wind." });
  items.push({ id: "soil", icon: "science", color: G.brown, to: "/soil-analysis",
    title: hi ? "मिट्टी परीक्षण अनुस्मारक" : "Soil test reminder", body: hi ? "हर 2–3 साल में मृदा स्वास्थ्य कार्ड अपडेट करें।" : "Update your Soil Health Card every 2–3 years." });
  return items;
}
