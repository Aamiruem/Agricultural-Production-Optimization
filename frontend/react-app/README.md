# AgriOptima — React app (JavaScript / JSX)

A single-page React app written in plain JavaScript (JSX), built with Vite. It
talks to the **FastAPI** ML/AI service and the **Node/Express** farm service
(see the root README). It covers the same features as the Next.js app in
`frontend/web`, built with a different stack: React Router, Bootstrap and Sass.

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

| Route | Page | Talks to |
|---|---|---|
| `/` | Home | — |
| `/recommend` | Crop advisor + live what-if | FastAPI `POST /recommend/crop` (trained ML model), `WS /ws/recommend` |
| `/fertilizer` | Fertilizer calculator | FastAPI `/crops`, `/recommend/fertilizer` |
| `/crops`, `/crops/:name` | Crop library | FastAPI `/crops` |
| `/planner` | Offline planner | Redux + localStorage |
| `/farms` *(signed in)* | Farms, fields, activities, photos | Node `/farm-api/*`, Socket.IO, S3; fertilizer plan via Node → FastAPI |
| `/assistant` | AI farm assistant | FastAPI `POST /assistant/chat` (Server-Sent Events) |
| `/insights` | Model comparison, history, CSV batch jobs | FastAPI `/ml/model`, `/predictions`, `/jobs/batch-csv` |
| `/admin` *(admin role)* | Users report, model hot-reload | FastAPI `/admin/users`, `/ml/reload` |
| `/login`, `/register` | Auth (JWT, OAuth2 password flow) | FastAPI `/auth/*` |

## Technologies used

React 19 (JSX, hooks, lazy + Suspense, error boundary) · Vite · React Router ·
Bootstrap 5 + React-Bootstrap · Sass · Redux Toolkit · Zustand · Context API ·
Axios · Fetch (SSE streaming) · TanStack Query · React Hook Form · Zod ·
Framer Motion · Socket.IO client · WebSocket · react-markdown · lucide icons ·
Vitest · Testing Library · Playwright · ESLint · oxlint · Docker + Nginx.
