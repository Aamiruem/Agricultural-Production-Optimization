# AgriSmart Local Agriculture Intelligence

Page: **/local-intelligence** ("Analyze My Agricultural Location"). Pick a point by GPS, village/colony
search or the India map (or draw a field), then fetch local weather, climate history, soil and crop
statistics, compare them with a dataset, and get explained crop and yield predictions. Every value
carries its source, data type, resolution and timestamps.

Last updated: 14 November 2026.

## How it runs

| Deployment | What happens |
|---|---|
| Static site (current Vercel deployment) | The browser calls the public APIs directly (Open-Meteo, Nominatim, SoilGrids), loads the real datasets from `/data/*.csv`, and runs matching, suitability and the browser yield model locally. |
| With the FastAPI service | The browser probes `GET /api/health` once; if the API is up, location/weather/soil/compare/validate/yield go through the API (server-side caching, rate limits, proper User-Agent, keys in env vars). |

Both paths return the same shapes; the matching engine is implemented twice (JS and Python) and both
pass the same hand-computed cases in `shared/local-intel/matching_cases.json`. On live data both
produced 49.6% for the same Punjab point, and both report 90.9% quality for `crop_yield.csv`.

## Phases delivered

### Phase 1 — India map, GPS and location search
- Leaflet map (react-leaflet 5): OpenStreetMap streets or Esri World Imagery satellite base layers.
- Boundaries: 36 states/UTs, 727 districts and 5,966 sub-districts (tehsil/taluka) from
  `datta07/INDIAN-SHAPEFILES` (MIT, administrative vintage ~2019), simplified by
  `scripts/build_india_boundaries.py` and loaded per state on demand (`public/geo/`).
- Click a state → its districts; click a district → its sub-districts.
- **Not available:** block, gram-panchayat and village boundaries (no openly licensed, verifiable
  national dataset was found). Villages and localities are located as **points** via OpenStreetMap,
  labelled "nearest named place — not an official boundary".
- GPS via the browser permission prompt; denial falls back to search or map selection. No village is
  ever assumed from GPS.
- Search: Nominatim, submit-only (its policy forbids autocomplete), max 1 request/second.
- Field drawing: click the corners; area is geodesic (spherical-excess formula, WGS84 radius), not
  screen pixels. Area units: ha, acre, m² and four commonly cited bigha sizes (bigha varies by state —
  the user is told to confirm locally).

### Phase 2 — Weather and climate
- Open-Meteo forecast: temperature, feels-like, humidity, rain, rain probability, wind speed and
  direction, pressure, cloud cover, solar radiation, ET₀, 7-day forecast and modelled soil moisture.
- Open-Meteo ERA5 archive: 10 complete years of daily rain/temperature/humidity → monthly and IMD
  seasonal normals, annual totals, 10-year trend and the current season's departure from normal
  (IMD categories: Large excess ≥ 60%, Excess 20–59%, Normal −19 to +19%, Deficient −20 to −59%,
  Large deficient −60 to −99%).
- Flags: heat stress (≥ 40 °C, IMD plains heat-wave threshold), cold/frost, humid, dry air, water
  stress (ET₀ vs rain), heavy rain/waterlogging (≥ 64.5 mm/day), rainfall deficit/excess.
- Official IMD warnings are linked, not reproduced (IMD's API needs IP whitelisting).

### Phase 3 — Soil and agricultural data
- SoilGrids 2.0 (modelled, 250 m): pH, sand/silt/clay, organic carbon, total nitrogen, CEC, bulk
  density (0–30 cm depth-weighted). Derived: USDA texture class, available water capacity
  (Saxton & Rawls 2006, labelled an estimate) and drainage class (inferred from texture).
- Built-up and water cells are masked by SoilGrids; the app tries four cells ~2 km away and says so,
  or reports "no data". SoilGrids is slow (40–90 s observed) — 75–80 s timeout and one retry.
- Regional soil classes per state (AgriSmart reference table, labelled level 5 / regional).
- Soil Health Card entry: N, P, K, pH, EC, OC, S, Zn, Fe, B, sample date — always preferred over
  estimates. Micronutrient critical limits: S 10, Zn 0.6, Fe 4.5, B 0.5 ppm.
- Agriculture: state crop statistics from `crop_yield.csv` (state level, 1997–2020), reference crop
  lists, crop calendar, pest/disease hotspots (historical reports, not live outbreaks).
- **Not available:** groundwater and irrigation coverage (no open API connected), mandi prices without
  a key (see credentials), district/village crop statistics.

### Phase 4 — Dataset comparison and matching score
- Schema detection maps any CSV's headers to canonical fields (state, district, village, lat/lon,
  area, soil type, pH, N, P, K, OC, rainfall, temperature, humidity, season, crop, irrigation,
  production, yield, year, fertilizer, pesticide) using name synonyms checked against the values.
- Built-in: `crop_yield.csv` (has State, no coordinates → state-level matching) and `crop_data.csv`
  (no location → explained as unmatchable, used as crop requirement profiles). Users can upload a CSV.
- Score = Σ(weight × similarity) ÷ Σ(weights of comparable parameters) × 100. Default weights:
  location 20, soil type 10, pH 10, N 6, P 4, K 4, OC 4, rainfall 12, temperature 8, humidity 6,
  crop 8, season 6, area 2 (editable in the UI).
- Similarity: numeric tolerances (pH ±1, N/K ±140 kg/ha, P ±15, OC ±0.5%, temperature ±4 °C,
  humidity ±15 points, rainfall ±25%, area ±50%); location 1 − distance/50 km for coordinates,
  0.85 same district, 0.6 same state; categorical soil (1 exact, 0.5 related texture family); crop
  overlap; season (1 same, 0.5 "Whole Year").
- Missing values and values on a different basis (e.g. SoilGrids total N vs Soil Health Card
  available N; state-total crop area vs a farm's area) are **excluded and listed**, never matched.
  `coverage` shows how much of the weight was comparable.
- Confidence: geographic (coordinates/district/state), temporal (age of latest record), source
  reliability (average level of the local sources used).
- Data quality: 30% completeness + 15% uniqueness + 20% validity (plausible ranges) + 15% outliers
  (3×IQR) + 10% consistency (production ÷ area ≈ yield) + 10% timeliness.
- The UI states plainly that a data-match score is **not** prediction accuracy.

### Phase 5 — Crop suitability and yield
- Suitability = weighted mean of temperature fit (20%; full within ±4 °C of the crop optimum),
  water fit (25%; relaxed when irrigated), soil class (15%), pH (10%; acid-soil crops penalised above
  pH 7), local practice (20%; share of the state's cropped area in the dataset) and the existing ML
  model (15%, **only** when soil-test N, P, K are entered). Out-of-season crops are excluded. Each crop
  shows reasons, cautions, current weather risks, sowing window, duration, water need and the
  historical state yield range (p25–p75 from the dataset).
- Yield: the existing models — XGBoost on the API (`POST /api/yield/predict`), the bundled browser
  model otherwise — with ERA5 annual rainfall as input. Production = yield (t/ha) × area (ha), units
  shown. Evaluation: time split (train < 2015, test 2015–2020), R² 0.90 on log yield; models are
  **state-level**. When a state/crop/season has fewer than 5 historical records the result is flagged
  as a baseline.

### Phase 6 — Suggestions, dashboard, reports, tests
- Suggestions split into **rule-based** (FAO-56 water balance, IMD thresholds, Soil Health Card limits)
  and **model-generated** (crop ranking, rotation). No fertilizer doses without a soil test.
- 11 working actions with loading/success/empty/error states: Detect location, Search village/colony,
  Select area on map (point or field), Fetch local data, Analyze my area, Compare my dataset, Check
  data accuracy, Predict best crops, Predict crop yield, Generate report, Download CSV / Save as PDF.
- CSV report: one row per value with section, value, unit, source, data type, resolution, observed
  and retrieved times, confidence and notes. PDF = print layout of sections A–G.

## API endpoints (FastAPI, prefix `/api`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/location/search?q=` | Villages, towns, colonies (Nominatim, 1 req/s, cached 24 h) |
| GET | `/location/reverse-geocode?lat=&lon=` | Nearest named place |
| GET | `/location/boundaries?lat=&lon=` | State / district / sub-district from bundled boundaries |
| GET | `/weather/current`, `/weather/forecast`, `/weather/history` | Open-Meteo now/7-day and ERA5 10-year history |
| GET | `/soil/local?lat=&lon=` | SoilGrids with masked-cell fallback (5 req/min) |
| GET | `/agriculture/local?state=` | State crop statistics |
| GET | `/agriculture/market-prices?state=&district=` | AGMARKNET via data.gov.in (needs key) |
| POST | `/agriculture/analyze-area` | One call: boundaries, place, forecast, history, soil, state stats |
| POST | `/agriculture/compare-dataset` | Weighted match of a built-in dataset with local values |
| POST | `/agriculture/validate-data` | Data-quality report |
| POST | `/recommend/crop`, `/yield/predict` | Existing ML endpoints (reused) |

Interactive docs: `/docs` on the API server.

## Data sources (and their levels in the reliability hierarchy)

| Level | Source | Type / resolution |
|---|---|---|
| 1 | Your Soil Health Card / lab values, farm area, irrigation | measured, your field |
| 3 | `crop_yield.csv` state statistics; India boundaries | observed / reference, state; boundary ~2019 |
| 4 | Open-Meteo forecast and ERA5 archive (CC BY 4.0) | modelled, ~1–25 km grids |
| 4 | ISRIC SoilGrids 2.0 (CC BY 4.0) | modelled, 250 m |
| 4 | OpenStreetMap Nominatim (ODbL) | reference, point |
| 5 | AgriSmart state reference tables, crop requirement profiles | regional reference |

## Credentials

| Variable | Where | Needed for |
|---|---|---|
| `DATA_GOV_IN_API_KEY` | API server `.env` | Mandi prices (free key from data.gov.in). Without it the endpoint returns 503 and the UI explains. |
| `NOMINATIM_USER_AGENT` | API server `.env` | Identifies the app to Nominatim (has a default). |

No other keys are needed. No keys are ever sent to the browser.

## Testing

- Frontend unit tests (`src/features/local/local.test.js`, 28 tests): geodesic area, unit conversion,
  point-in-polygon with holes, IMD categories, history summaries, condition flags, USDA texture,
  SoilGrids parsing (masked = missing), schema detection on the real CSVs, the shared matching cases,
  data quality, and suitability (including wheat ranking in Punjab with real ERA5 temperatures).
- Backend tests (`backend/python-fastapi/tests/test_local_intel.py`, 16 tests): the same matching
  cases, quality parity with the browser (90.9%), real boundary lookup, and endpoints with external
  APIs stubbed (search, reverse geocode, forecast, soil fallback, upstream timeout → 504, market prices
  without key → 503, compare, validate, state stats).
- Browser end-to-end (production build, live APIs): GPS → analyze → compare → quality → crops →
  yield → CSV, on both the static path and the FastAPI path.
- Live multi-region check: `scripts/check_local_intel_live.py` → [local-intelligence-live-check.md](local-intelligence-live-check.md)
  (13 states + one urban point, 14 Nov 2026). Village-level boundary tests were **not** possible
  because no village boundary data is available.

## Known limitations

- Crop statistics, yield models and the dataset match are **state-level**; there is no district or
  farm-level training data. The dataset has **no Rajasthan records** (found by the live check) and
  ends in 2019–2020.
- Boundaries are ~2019; districts created later are not shown.
- SoilGrids is a model, masks built-up areas and can be slow; it does not provide available P, K, S,
  Zn, Fe, B or EC — only a soil test does.
- ERA5 rainfall at a point differs from the dataset's state annual rainfall (for example Punjab 781 vs
  586 mm); this shows up honestly as a rainfall mismatch.
- Map choropleths for temperature, humidity and rain use one point (the state capital) per state.
- No irrigation, groundwater, satellite crop-type or village-boundary layers (reasons shown in the UI).
- Not yet built: PostGIS storage of observations, TypeScript migration, and server-side PDF.

## Next steps

1. Add a district-level crop statistics source (e.g. Directorate of Economics & Statistics district
   APY data) and retrain the yield model with grouped (district/year) cross-validation.
2. Obtain a data.gov.in key and enable mandi prices; consider IMD district rainfall via data.gov.in.
3. Store fetched observations with source metadata in PostgreSQL/PostGIS for history and caching.
4. Add the Bhuvan/LGD village directory if a machine-readable, licensed source becomes available.
