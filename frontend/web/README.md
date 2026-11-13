# AgriOptima web (Next.js)

Frontend for the Agricultural Production Optimization project. It talks to the
FastAPI backend in `../../backend`.

## Run

```bash
cp .env.example .env.local   # optional; defaults point at http://localhost:8000/api
npm install
npm run dev                  # http://localhost:3000
```

Start the backend first (see the root README). The crop library page shows a
friendly error if the API is down; every other page still loads.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js + React hooks rules) |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | **Vitest** – components and stores (`src/**/*.test.ts[x]`) |
| `npm run test:jest` | **Jest** – pure logic: validation, formatting, API errors (`tests/jest`) |
| `npm run test:e2e` | **Playwright** – end-to-end against a production build (`e2e/`) |

Playwright uses its own Chromium by default. If Windows blocks that binary
(`spawn UNKNOWN` / "Permission denied"), use your installed Chrome:
`PW_CHANNEL=chrome npm run test:e2e` (PowerShell: `$env:PW_CHANNEL="chrome"; npm run test:e2e`).

## Where each technology is used

| Technology | Where | Why there |
|---|---|---|
| **Next.js 16** (App Router, Cache Components) | `src/app/` | Routing, layouts, server components |
| SSG | `/`, `/recommend`, `/fertilizer`, `/planner` | No request-time data → prerendered at build |
| SSR (streaming) | `/crops` → `src/app/crops/page.tsx` | Fresh API data on every request, skeleton shown while streaming |
| SSG + ISR | `/crops/[name]` + `getCropCached` in `src/lib/api/server.ts` | 22 pages prerendered; `"use cache"` + `cacheLife` revalidates them |
| SEO | `metadata` / `generateMetadata`, `sitemap.ts`, `robots.ts` | Titles, descriptions, Open Graph, sitemap |
| **React 19** | everywhere | Components, hooks, `useSyncExternalStore`, Suspense |
| **TypeScript** | everywhere | `src/lib/api/types.ts` mirrors the backend's Pydantic models |
| **Tailwind CSS v4** | utility classes; tokens in `src/app/globals.css` | Layout and theming |
| **Sass** | `src/components/hero.module.scss` | Variables, mixin, nesting, `@for` loop in a CSS module |
| **shadcn/ui** | `src/components/ui/*` | Button, Card, Input, Label, Badge |
| **Material UI** | crop table, selects, slider, progress bars | Rich widgets (sortable table, select, slider) |
| **Framer Motion** | hero, result cards, planner list | Entrance and list animations (respects reduced motion) |
| **Context API** | `src/context/theme-context.tsx` | Light/dark theme shared by Tailwind and MUI |
| **Zustand** | `src/store/history-store.ts` | Small persisted store: recent recommendations |
| **Redux Toolkit** | `src/store/fields-slice.ts`, `store.ts` | Farm planner: actions, reducers, memoized selectors |
| **Fetch API** | `src/lib/api/server.ts` | Server components → FastAPI |
| **Axios** | `src/lib/api/client.ts`, `endpoints.ts` | Browser → FastAPI, with error normalization |
| **TanStack Query** | crop and fertilizer forms | `useQuery` (cached crop list), `useMutation` (POSTs) |
| **React Hook Form + Zod** | all three forms, schemas in `src/lib/validation.ts` | Typed validation matching the backend's limits |
| **Vitest / Jest / Playwright** | see Scripts | Unit, component and end-to-end tests |

### Notes

- `next.config.ts` runs the Tailwind Turbopack loader on `globals.css` only. A
  `*.css` match also catches compiled Sass modules and breaks their scoping.
- The Redux store uses a hand-written root reducer. `combineReducers` calls
  `Math.random()`, and Cache Components rejects that during prerendering.
- MUI styles live in CSS layer `mui`, below Tailwind's `utilities`, so
  Tailwind classes can override MUI (`AppRouterCacheProvider enableCssLayer`).
