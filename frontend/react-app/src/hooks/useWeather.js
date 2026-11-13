import { useQuery } from "@tanstack/react-query";

// Live weather from Open-Meteo (free, no API key, CORS-enabled).
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export const WEATHER_CODES = {
  0: ["Clear sky", "साफ़ आसमान", "☀️"], 1: ["Mainly clear", "अधिकतर साफ़", "🌤️"], 2: ["Partly cloudy", "आंशिक बादल", "⛅"], 3: ["Overcast", "घने बादल", "☁️"],
  45: ["Fog", "कोहरा", "🌫️"], 48: ["Rime fog", "पाला कोहरा", "🌫️"], 51: ["Light drizzle", "हल्की फुहार", "🌦️"], 53: ["Drizzle", "फुहार", "🌦️"], 55: ["Heavy drizzle", "तेज़ फुहार", "🌧️"],
  61: ["Light rain", "हल्की बारिश", "🌦️"], 63: ["Rain", "बारिश", "🌧️"], 65: ["Heavy rain", "भारी बारिश", "🌧️"], 71: ["Light snow", "हल्की बर्फ़", "🌨️"], 73: ["Snow", "बर्फ़बारी", "🌨️"], 75: ["Heavy snow", "भारी बर्फ़", "❄️"],
  80: ["Rain showers", "बौछारें", "🌦️"], 81: ["Heavy showers", "तेज़ बौछारें", "🌧️"], 82: ["Violent showers", "अति तेज़ बौछारें", "⛈️"], 95: ["Thunderstorm", "आंधी-तूफ़ान", "⛈️"], 96: ["Thunderstorm, hail", "ओलावृष्टि", "⛈️"], 99: ["Severe hail storm", "भारी ओले", "⛈️"],
};

export function weatherLabel(code, lang = "en") {
  const w = WEATHER_CODES[code] ?? WEATHER_CODES[Math.floor(code / 10) * 10] ?? ["Weather", "मौसम", "🌡️"];
  return { text: lang === "hi" ? w[1] : w[0], icon: w[2] };
}

async function fetchWeather({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: "auto", forecast_days: "7", past_days: "7",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,wind_speed_10m_max,uv_index_max",
    hourly: "temperature_2m,relative_humidity_2m,precipitation_probability",
  });
  const res = await fetch(`${ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const data = await res.json();
  const d = data.daily;
  const days = d.time.map((date, i) => ({
    date, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i] ?? 0,
    rainProb: d.precipitation_probability_max[i] ?? 0, et0: d.et0_fao_evapotranspiration[i] ?? 0, wind: d.wind_speed_10m_max[i], uv: d.uv_index_max[i],
  }));
  const today = data.current.time.slice(0, 10);
  const idx = Math.max(0, days.findIndex((x) => x.date >= today));
  const nowHour = data.current.time.slice(0, 13);
  const start = Math.max(0, data.hourly.time.findIndex((t) => t.slice(0, 13) >= nowHour));
  const hourly = data.hourly.time.slice(start, start + 24).map((t, i) => ({
    time: t.slice(11, 16), temp: data.hourly.temperature_2m[start + i], humidity: data.hourly.relative_humidity_2m[start + i], rainProb: data.hourly.precipitation_probability[start + i],
  }));
  return { current: data.current, past: days.slice(0, idx), forecast: days.slice(idx), hourly };
}

export function useWeather(place) {
  return useQuery({
    queryKey: ["weather", place?.lat, place?.lon],
    queryFn: () => fetchWeather(place),
    enabled: Boolean(place?.lat),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

/** Rule-based farm advisories from the forecast. */
export function farmAdvisories(w, lang = "en") {
  if (!w) return [];
  const hi = lang === "hi";
  const next3 = w.forecast.slice(0, 3);
  const out = [];
  const rain = next3.reduce((s, d) => s + d.rain, 0);
  if (rain > 20) out.push({ level: "warning", text: hi ? `अगले 3 दिनों में ${Math.round(rain)} मिमी बारिश संभावित — सिंचाई और छिड़काव टालें, जल निकासी सुनिश्चित करें।` : `${Math.round(rain)} mm rain expected in 3 days — postpone irrigation and spraying; clear field drainage.` });
  else if (rain < 2) out.push({ level: "info", text: hi ? "अगले 3 दिन सूखे — नमी जाँचें और आवश्यकता अनुसार सिंचाई करें।" : "Dry next 3 days — check soil moisture and irrigate if needed." });
  const hot = next3.find((d) => d.max >= 40);
  if (hot) out.push({ level: "serious", text: hi ? `लू की चेतावनी (${Math.round(hot.max)}°C) — शाम को हल्की सिंचाई करें, पशुओं को छाया दें।` : `Heat stress risk (${Math.round(hot.max)}°C) — light evening irrigation, shade for livestock.` });
  const cold = next3.find((d) => d.min <= 4);
  if (cold) out.push({ level: "serious", text: hi ? `पाले का खतरा (${Math.round(cold.min)}°C) — रात में हल्की सिंचाई या धुआँ करें।` : `Frost risk (${Math.round(cold.min)}°C) — light irrigation or smoke at night to protect crops.` });
  if (next3.some((d) => d.wind >= 30)) out.push({ level: "warning", text: hi ? "तेज़ हवा — कीटनाशक छिड़काव न करें, ऊँची फसलों को सहारा दें।" : "Strong winds — avoid pesticide spraying; stake tall crops." });
  if (w.current.relative_humidity_2m >= 85 && w.current.temperature_2m >= 20) out.push({ level: "warning", text: hi ? "उच्च आर्द्रता — फफूंद रोगों (झुलसा, ब्लास्ट) के लिए फसल की निगरानी करें।" : "High humidity — scout for fungal disease (blight, blast, mildew)." });
  if (!out.length) out.push({ level: "good", text: hi ? "मौसम खेती कार्यों के लिए अनुकूल है।" : "Weather is favourable for routine field operations." });
  return out;
}
