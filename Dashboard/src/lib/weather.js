// Open-Meteo daily forecast, fetched straight from the browser (CORS-enabled, no key).
export const LOCATIONS = [
  { id: "ludhiana", label: "Ludhiana, Punjab", lat: 30.9, lon: 75.85 },
  { id: "nagpur", label: "Nagpur, Maharashtra", lat: 21.15, lon: 79.09 },
  { id: "thanjavur", label: "Thanjavur, Tamil Nadu", lat: 10.79, lon: 79.14 },
  { id: "bardhaman", label: "Bardhaman, West Bengal", lat: 23.23, lon: 87.86 },
  { id: "indore", label: "Indore, Madhya Pradesh", lat: 22.72, lon: 75.86 },
];

export async function fetchForecast({ lat, lon }, { signal } = {}) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    forecast_days: 7,
    timezone: "auto",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather service error (${res.status})`);
  const { daily } = await res.json();
  return daily.time.map((date, i) => ({
    date,
    day: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
    tmax: daily.temperature_2m_max[i],
    tmin: daily.temperature_2m_min[i],
    rain: daily.precipitation_sum[i],
    et0: daily.et0_fao_evapotranspiration[i],
  }));
}
