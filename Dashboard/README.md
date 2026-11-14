# AgriSmart Console (Dashboard)

Operations dashboard for the AgriSmart platform: live AI/ML, analytics, farms,
the MCP tool server and platform health in one place.

**Stack:** React 19 · Vite · Tailwind CSS v4 · TanStack Query · React Router ·
Recharts · Google Sans / Google Sans Code · Material Symbols Rounded · Google
Material colour tokens (light + dark).

| Page | What it does | Backend |
|---|---|---|
| Overview | Model KPIs, API throughput & p95 latency, yield trend, service map, cache hit rates, 7-day weather & water balance | `/api/system/status`, `/api/yield/*`, Open-Meteo |
| AI Studio | Soil/climate sliders → live crop ranking over WebSocket (REST fallback), **TreeSHAP** explanation per crop, fertilizer plan | `WS /api/ws/recommend`, `/api/ml/explain`, `/api/recommend/fertilizer` |
| Yield analytics | Historical yield & production by state/crop/season, XGBoost forecast with historical quartiles | `/api/yield/trend`, `/api/yield/predict` |
| Farms | Farms, crop area and recent activity (sign-in required) | Express `/farm-api/farms` |
| Assistant | Streaming agronomy assistant with tool calls and sources | `/api/assistant/chat` (SSE) |
| Models | Crop & yield leaderboards, feature importance, admin hot-reload | `/api/ml/model`, `/api/ml/yield-model` |
| MCP tools (`/mcp-tools`) | Discovers the MCP server's tools and calls any of them from a generated form | `/mcp` (JSON-RPC, stateless HTTP) |
| System health | Live per-worker metrics, replica distribution, caches, busiest routes, **load probe** | `/api/system/*` |

## Run

```bash
npm ci
npm run dev        # http://localhost:5180
```

The dev server proxies `/api` → FastAPI (`:8000`), `/farm-api` → Express (`:4100`)
and `/mcp` → MCP server (`:8100`); override with `API_PROXY_TARGET`,
`FARM_PROXY_TARGET`, `MCP_PROXY_TARGET` (see `.env.example`). From the repository
root, `python main.py` starts every service including this dashboard.

With Docker, `docker compose up --build` serves it behind the load-balancing
gateway at **http://localhost:8090**.

## Behaviour under load or failure

`src/lib/api.js` keeps the UI usable when services are busy or down:

- retries idempotent requests on network errors / 502 / 503 / 504, and any request
  answered `429` or `503 + Retry-After` (rejected before work was done), with
  exponential backoff + jitter that honours `Retry-After`;
- per-request timeouts, so nothing hangs;
- a per-service **circuit breaker** (api / farm / mcp) that fails fast for 15 s
  after 5 consecutive failures instead of adding load to a struggling service;
- each page is lazy-loaded behind its own error boundary; every panel shows its
  own loading, empty and error state with a retry.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server with API proxies |
| `npm run build` | Production build to `dist/` |
| `npm test` | Vitest: API client resilience, SSE parsing, icon subset, palette/CSS sync, every route renders with services down |
| `npm run lint` | ESLint (React hooks rules) |

## Design notes

- Icons come from a Google Fonts request subset to the names in `src/lib/icons.js`;
  the icon test fails if the source uses an icon that isn't listed.
- Chart colours (`src/components/charts/palette.js`) mirror the CSS tokens and were
  validated for colour-vision deficiency in both themes; status colours are reserved
  for state and always appear with an icon and a label. Every chart card has a
  table view.
