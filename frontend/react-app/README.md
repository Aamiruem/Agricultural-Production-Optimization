# AgriSmart — React app (JavaScript / JSX)

A single-page React app written in plain JavaScript (JSX), built with Vite. It
talks to the **FastAPI** ML/AI service and the **Node/Express** farm service
(see the root README). Stack: React Router, Bootstrap, Sass, TanStack Query and Recharts.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

Start the backends first: FastAPI on port 8000 and the farm-service on port 4000.
The Vite dev server **proxies** `/api`, `/farm-api` and `/socket.io` to them, so
the browser only talks to one origin and no CORS setup is needed. Other ports?
Set `API_PROXY_TARGET` / `FARM_PROXY_TARGET` (see `.env.example`).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload and API proxy |
| `npm run build` / `npm run preview` | Production build (code-split per page) / serve it |
| `npm run lint` | ESLint (React hooks rules) |
| `npm run lint:fast` | oxlint |
| `npm test` | Vitest + Testing Library (stores, utils, SSE parser, forms, route guards) |
| `npm run test:e2e` | Playwright against the production build (APIs mocked) |

If Windows blocks Playwright's own Chromium, run `PW_CHANNEL=chrome npm run test:e2e`.

## Folder structure

```
src/
├── main.jsx            providers: Redux, TanStack Query, theme, router
├── App.jsx             routes (lazy-loaded pages, protected + admin routes)
├── assets/             logo
├── styles/main.scss    Bootstrap themed with Sass (variables, nesting, loops)
├── layouts/            MainLayout, AuthLayout, SiteNavbar, SiteFooter
├── pages/              one component per route
├── components/
│   ├── common/         PageHeader, Loader, ErrorAlert, NumberField, HBarChart, route guards, ErrorBoundary
│   ├── auth/           sign-in / register form
│   ├── home/           Hero, FeatureGrid
│   ├── crops/          recommendation form + results, live what-if, crop table, history
│   ├── fertilizer/     fertilizer form + result
│   ├── planner/        offline planner (Redux)
│   ├── farms/          farms, fields, activities, photos, fertilizer plan modal
│   ├── assistant/      chat message + input
│   └── insights/       model comparison, history, CSV batch upload
├── hooks/              useChat, useFarmSocket, useLiveRecommend, useDocumentTitle, useTheme
├── services/           apiClient (Axios + JWT interceptor), auth/crop/farm/ml/assistant services
├── store/              Redux Toolkit store + slice, Zustand auth & history stores
├── context/            ThemeContext (Context API)
├── utils/              crops, format, Zod validation schemas
└── test/               Vitest setup + render helper
```

## Pages

There is **no login, registration or account page**: every page is public.

**Information hub** (content in `src/data/content/`, pages in `src/pages/site/`)

| Route | Page |
|---|---|
| `/` | Home: hero, section overview, tools, results, FAQ |
| `/about`, `/developer` | Mission, vision, values; developer profile |
| `/agricultural-production-systems` (+ 16 topic pages `/:slug`) | Production systems: definition, importance, process, pros, cons |
| `/smart-agricultural-machines` | 12 machines with function, features, applications, benefits |
| `/ai-in-agriculture` | 12 AI/ML solutions and the ML workflow |
| `/crops-and-food` | Kharif/Rabi/Zaid, crop categories, supply chain, post-harvest, food security |
| `/farmer-health` | Rural healthcare, first aid, heat stress, pesticide safety, mental wellness (with medical disclaimer) |
| `/food-and-nutrition` | Eight food groups: nutrients, benefits, farm source, storage |
| `/farmer-education` | 10 lessons plus government schemes checked against official portals |
| `/services`, `/projects` | Services (with availability) and verified portfolio projects |
| `/contact` | WhatsApp, call, email, form that opens WhatsApp/email (no fake "sent") |
| `/app` | Web-app landing page and install (PWA) instructions |
| `/privacy-policy`, `/disclaimer`, `/image-credits` | Legal pages and photo licences |

**Tools** (unchanged behaviour)

| Route | Page | Talks to |
|---|---|---|
| `/crop-recommendation` | Crop advisor + live what-if | FastAPI `POST /recommend/crop`, browser fallback model |
| `/fertilizer` | Fertilizer calculator | FastAPI `/crops`, `/recommend/fertilizer` |
| `/crops`, `/crops/:name` | Crop library | FastAPI `/crops` |
| `/planner` | Offline planner | Redux + localStorage |
| `/farms` | Farms, fields, activities (saved on the device) | Node `/farm-api/*` when available |
| `/assistant` | AI farm assistant | FastAPI `POST /assistant/chat` (SSE) |
| `/insights` | Model comparison | FastAPI `/ml/model` |

## SEO

- `src/seo/routes.js` is the single registry of every URL: title, description, breadcrumb parent, Open Graph image, hero image, schema type and `noindex`.
- `src/seo/structuredData.js` builds JSON-LD (Organization, WebSite, Person, WebPage, BreadcrumbList, Article, WebApplication). No ratings or reviews.
- At build time `seoPages()` in `vite.config.js` writes `dist/<route>.html` for every route with its own head, plus `404.html`, `sitemap.xml` (with image entries) and `robots.txt`. Vercel serves them with `cleanUrls`; unknown URLs return a real 404.
- `useDocumentTitle` keeps the same tags in sync during client-side navigation.
- Set `VITE_SITE_URL` (canonical origin) and optionally `VITE_GOOGLE_SITE_VERIFICATION` / `VITE_GA_MEASUREMENT_ID` in Vercel.
- Photos: `python scripts/fetch_commons_images.py` (licensed Wikimedia Commons images, credits in `src/data/generated/imageCredits.json`); share images: `python scripts/build_og_images.py`.
- `src/seo/seo.test.js` checks unique titles/descriptions, that every route is registered, redirect parity with `vercel.json`, images and credits.

See `docs/seo-strategy.md` at the repo root for the audit, keyword map, Search Console guide and 90-day plan.

## Technologies used

React 19 (JSX, hooks, lazy + Suspense, error boundary) · Vite · React Router ·
Bootstrap 5 + React-Bootstrap · Sass · Redux Toolkit · Zustand · Context API ·
Axios · Fetch (SSE streaming) · TanStack Query · React Hook Form · Zod ·
Framer Motion · Socket.IO client · WebSocket · react-markdown · lucide icons ·
Vitest · Testing Library · Playwright · ESLint · oxlint · Docker + Nginx.
