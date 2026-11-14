# AgriSmart SEO strategy and implementation record

Last updated: 14 November 2026 · Site: https://agrismart-two-iota.vercel.app (Vercel project `agrismart`)

This document records the SEO audit of the AgriSmart React app, what was changed, how to set up
Google Search Console, and what to do over the next 90 days. Nothing here guarantees rankings:
Google decides what to index and rank. The aim is a site Google can crawl, understand and trust.

> **Indexing status was not checked.** Whether any page is currently indexed can only be confirmed
> in Google Search Console (URL Inspection) after the property is verified. Do not assume indexing
> from this document.

---

## 1. Audit: problems found before this work

| # | Problem | Why it hurt discovery or understanding | Status |
|---|---|---|---|
| 1 | Single-page app served the **same `index.html` for every URL** | Before JavaScript ran, every URL had the home title, description and canonical. Social crawlers (WhatsApp, LinkedIn, Facebook) never run JS, so every shared link looked like the home page. | **Fixed:** a static HTML head per route |
| 2 | **Canonical pointed to `/`** in the raw HTML of every page | Risk of Google treating inner pages as duplicates of the home page | **Fixed** |
| 3 | **Soft 404s**: a catch-all rewrite returned HTTP 200 for any URL | Junk URLs could be crawled as real pages | **Fixed:** real 404 status with `404.html` and `noindex` |
| 4 | Open Graph image was an **SVG** | WhatsApp, LinkedIn and Facebook do not render SVG previews | **Fixed:** 30 page-specific 1200×630 JPEGs |
| 5 | `hreflang="hi-IN"` pointed to the same URL as English | Incorrect hreflang; the Hindi UI is a client-side toggle, not a separate URL | **Removed** |
| 6 | Search Console verification meta was **injected by JavaScript** | HTML-tag verification reads the served HTML | **Fixed:** written into static HTML at build time |
| 7 | Thin content: the site was mostly tools with little indexable text | Few pages matched informational searches such as "organic farming", "precision agriculture" or "agricultural drones" | **Fixed:** about 30 new content pages and sections |
| 8 | Placeholder business details (`support@agrismart.app`, non-link social icons) | Trust signals (E-E-A-T) were weak or unverifiable | **Fixed:** real owner contact, developer profile, verified projects |
| 9 | Login/register pages (indexable, thin) | No search value; the brief requires no accounts | **Removed**, with 301/308 redirects to `/` |
| 10 | Manifest had only an SVG icon; no PNG/maskable icons | PWA install and the Organization logo need PNGs | **Fixed** |
| 11 | Large layout shift (CLS 0.45–0.6) as the footer jumped when page chunks loaded | Core Web Vitals (CLS) | **Fixed:** CLS 0 on the pages tested |
| 12 | Default canonical domain fell back to a non-existent `agrismart-india.vercel.app` | Wrong canonical URLs on any build without `VITE_SITE_URL` | **Fixed:** defaults to the real production URL |

## 2. What was implemented

### Technical SEO
- **Per-route static HTML** (`seoPages()` in `frontend/react-app/vite.config.js`): 76 files, each with its own
  `<title>`, meta description, canonical, robots, Open Graph and Twitter tags, hero-image preload, JSON-LD and
  `<noscript>` fallback text (H1, description, breadcrumbs and main links).
- **One SEO registry** (`src/seo/routes.js`) used at build time and at runtime, so client navigation and static HTML
  always agree.
- **sitemap.xml** with 53 indexable URLs, accurate `lastmod` and `image:image` entries. **robots.txt** allows all and
  points to the sitemap.
- **noindex** on thin or private pages: `/farms` (device data), the 22 `/crops/:name` detail pages (a table of
  averages) and the 404 page. They still load for users.
- **Redirects** (permanent, in `vercel.json` and `nginx.conf`): old short URLs, `/login`, `/register`, `/admin` and
  friendly aliases (`/agriculture`, `/machines`, `/healthcare`, …). A unit test keeps `vercel.json` in sync with the
  registry.
- **Clean URLs** with no trailing slash (`cleanUrls`, `trailingSlash: false`).
- **Structured data (JSON-LD)**: Organization (with founder and contact point), WebSite, Person (developer),
  WebPage/AboutPage/ContactPage/CollectionPage/ProfilePage, BreadcrumbList, Article (content guides) and
  WebApplication (`/app`). No ratings, reviews, awards or invented addresses; a test enforces this.
- **Visible breadcrumbs** on every content page, matching the BreadcrumbList.
- **Semantic HTML**: one H1 per page, ordered H2/H3, `<nav>`, `<article>`, `<aside>`, `<address>`, labelled sections.

### Content (new indexable pages)
| URL | Primary search intent |
|---|---|
| `/agricultural-production-systems` + 16 topic pages | Informational: "types of farming systems", "what is organic/precision/integrated farming" |
| `/smart-agricultural-machines` | Informational: "modern farm machinery", "agricultural drones", "smart tractors" |
| `/ai-in-agriculture` | Informational: "AI in agriculture", "machine learning in farming", "crop yield prediction" |
| `/crops-and-food` | Informational: "kharif rabi zaid crops", "post-harvest management", "food security" |
| `/farmer-health` | Informational: "farmer health and safety", "pesticide safety", "heat stroke prevention farmers" |
| `/food-and-nutrition` | Informational: "balanced diet Indian food", "nutrition from pulses/millets" |
| `/farmer-education` | Informational/navigational: "farming techniques", "government schemes for farmers" |
| `/services`, `/projects`, `/developer` | Commercial/navigational: AI/ML and agritech development, the developer's portfolio |
| `/app` | Navigational: "AgriSmart app", "free farming app" |

Each page has a unique title (≤ 70 characters) and description (70–175 characters), descriptive H1/H2s, relevant
photos with alt text, contextual internal links to related topics and tools, a "last reviewed" date and a call to
action.

### Images
- 66 licensed Wikimedia Commons photos (CC0, public domain, CC BY, CC BY-SA), each checked visually for relevance
  and credited on `/image-credits`.
- WebP at 640 and 1200 px with `srcset`/`sizes`, explicit `width`/`height` (no layout shift), lazy loading below the
  fold, and a preloaded hero with `fetchpriority="high"`.

### Performance and Core Web Vitals
Lighthouse 12.8 (simulated mobile, slow 4G, 4× CPU) on the local production build, 14 Nov 2026:

| Page | Perf. | Accessibility | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 44 | 100 | 100 | 100 | 8.8 s | 0 |
| `/agricultural-production-systems/organic-farming` | 64 | 100 | 100 | 100 | 6.0 s | 0 |
| `/smart-agricultural-machines` | 43 | 100 | 100 | 100 | 5.1 s | 0 |
| `/farmer-health` | 65 | 100 | 100 | 100 | 4.9 s | 0 |

Improvements made: CLS from 0.6 to 0, charts lazy-loaded on the home page, non-blocking text fonts, hero preload.
**Still slow:** first paint is held back by the existing 352 KB (53 KB gzip) Bootstrap/Sass stylesheet and the
320 KB (104 KB gzip) main JavaScript bundle. See task P1 below. Real-user field data will appear in Search Console's
Core Web Vitals report once there is enough traffic.

---

## 3. Keyword research and page mapping

No paid keyword tool was available, so volumes are not quoted. Difficulty is a qualitative estimate from the type
of sites that usually rank (government portals, Wikipedia, large agri-media). **Validate with Google Keyword Planner
and, after 4–6 weeks, with real queries in Search Console.**

| Keyword (cluster) | Intent | Est. difficulty | Realistic? | Target page |
|---|---|---|---|---|
| smart agriculture / smart farming solutions | Info | High | Long-term | `/` |
| agricultural production system(s), types of farming systems | Info | Medium | Yes | `/agricultural-production-systems` |
| organic / integrated / mixed / precision farming *definition, advantages and disadvantages* | Info (students) | Medium–low | **Best opportunity** | topic pages |
| crop rotation, intercropping *advantages* | Info | Medium | Yes | topic pages |
| AI in agriculture, machine learning in agriculture | Info | High | Long-term | `/ai-in-agriculture` |
| crop yield prediction (using machine learning) | Info + tool | Medium | Yes | `/ai-in-agriculture`, `/yield-prediction` |
| crop recommendation system, best crop for soil | Tool | Medium | Yes | `/crop-recommendation` |
| agricultural machines / modern farming equipment | Info | Medium–high | Partial | `/smart-agricultural-machines` |
| agricultural drones in India, smart tractor features | Info | Medium | Yes | machine sections (anchors) |
| smart irrigation system / water management | Info + tool | Medium | Yes | `/agricultural-production-systems/irrigation-systems`, `/irrigation-optimization` |
| soil testing / soil health card interpretation | Info + tool | Medium | Yes | `/soil-analysis`, `/agricultural-production-systems/soil-management` |
| crop disease detection | Info + tool | Medium | Yes | `/disease-detection`, `/ai-in-agriculture#plant-disease-detection` |
| kharif rabi zaid crops | Info (students) | Medium | Yes | `/crops-and-food` |
| sustainable agriculture | Info | High | Long-term | `/agricultural-production-systems/sustainable-agriculture` |
| pesticide safety for farmers, heat stroke farmers | Info | Low–medium | Yes | `/farmer-health` |
| government schemes for farmers | Info/nav | High (gov portals rank) | Supporting only | `/farmer-education#schemes` |
| AgriSmart, Aamir Hussain Azad | Navigational (brand) | Low for the name; "AgriSmart" is shared by other companies | Yes for the person | `/`, `/developer` |

Avoid keyword stuffing: write for the reader and use the phrase naturally in the title, H1, intro and one or two
subheadings.

---

## 4. Google Search Console setup (step by step)

1. **Add a property.** Go to https://search.google.com/search-console, choose *URL prefix* and enter
   `https://agrismart-two-iota.vercel.app/` (or the custom domain if you add one; a *Domain* property needs DNS access).
2. **Verify ownership.** Choose *HTML tag*, copy only the `content` value, add it in Vercel → Project → Settings →
   Environment Variables as `VITE_GOOGLE_SITE_VERIFICATION` (Production), redeploy, then click *Verify*. The tag is in
   the static HTML of every page.
3. **Submit the sitemap.** Sitemaps → enter `sitemap.xml` → Submit. Expect "Success" and 53 discovered URLs.
4. **Inspect key URLs.** URL Inspection → test `/`, `/agricultural-production-systems`, `/ai-in-agriculture` and two
   topic pages. Check "Page is indexable", the Google-selected canonical and the rendered screenshot.
5. **Request indexing** for the home page and the main hubs. Use this sparingly; the sitemap handles the rest.
6. **Review indexing (Pages report)** weekly at first. Expected exclusions: `/farms` and `/crops/*` (noindex),
   redirects, 404s. Investigate "Crawled – currently not indexed" on content pages by improving those pages.
7. **Monitor Core Web Vitals** (needs real Chrome-user traffic; it may say "not enough data" at first).
8. **Performance report:** track queries, impressions, clicks, CTR and position. Filter by page to see which topics
   are gaining.
9. **Fix and iterate:** rewrite titles and descriptions for pages with impressions but low CTR, expand pages ranking
   in positions 8–20, and fix any errors Search Console reports.
10. Optional: link Google Analytics 4 (`VITE_GA_MEASUREMENT_ID`) and Search Console for landing-page reports.

Also submit the sitemap to **Bing Webmaster Tools** (it can import from Search Console).

---

## 5. Prioritised remaining tasks

| Priority | Task | Why |
|---|---|---|
| **P0** | Set `VITE_SITE_URL`, deploy, then complete the Search Console steps above | Nothing is discoverable until Google is told about it |
| **P0** | Share key pages on LinkedIn and the portfolio, and link to AgriSmart from the GitHub profile and portfolio | First external links help discovery |
| P1 | Cut render-blocking CSS: compile only the Bootstrap modules in use (or purge unused CSS) and split vendor code out of the 320 KB main bundle | FCP/LCP are the weakest Core Web Vitals |
| P1 | Self-host the Google fonts (WOFF2, subset) and preload the heading font | Removes a third-party round trip |
| P1 | Consider a custom domain (e.g. a `.in` or `.com`) | Stronger brand trust than a `vercel.app` subdomain; set `VITE_SITE_URL` to it |
| P2 | Full prerendering of page *body* HTML (e.g. `react-dom/server` static render per route) | Google renders JS, but static body HTML is faster and more robust |
| P2 | Hindi content on separate URLs (e.g. `/hi/...`) with correct `hreflang` | Unlocks Hindi searches; the current Hindi toggle is not indexable |
| P2 | Add FAQ sections on topic pages (as content; FAQ rich results are limited to some site types) | Long-tail coverage |
| P3 | Original photos and short videos of real farms, with the owner's permission | Better for Google Discover and image search than stock photos |
| P3 | Re-verify government scheme details every 3 months and update `SCHEMES_CHECKED` | Accuracy and freshness |

Not recommended: buying links, auto-generated pages, fake reviews, or keyword-stuffed text.

## 6. 90-day SEO plan

**Days 1–14: foundation**
- Deploy; verify Search Console and Bing; submit the sitemap; inspect and request indexing for the hubs.
- Add a link to AgriSmart on the portfolio, GitHub README and LinkedIn; share three topic pages with OG previews.
- Do P1 performance work on CSS and the main bundle; re-run Lighthouse.

**Days 15–45: content depth**
- Expand the 16 topic pages with a short FAQ, one Indian case example each and links to official sources.
- Publish 4–6 new long-tail guides based on Search Console queries (for example "precision agriculture in India for
  small farmers" or "how AI predicts crop yield, explained").
- Add machine and scheme comparison tables where useful.

**Days 46–75: authority and experience**
- Write a case-study article on the crop-yield project (method, data, honest metrics) and link it from `/projects`.
- Approach agriculture colleges, student communities and KVK-adjacent blogs that might find the guides useful as
  references. Earn links; do not buy them.
- Add original images where possible; keep alt text descriptive.

**Days 76–90: measure and refine**
- In Search Console: rewrite titles and descriptions for pages with high impressions and low CTR; strengthen pages
  in positions 8–20.
- Review Core Web Vitals field data; fix regressions.
- Refresh dates only where content actually changed (accurate `lastmod`).
- Set targets for the next quarter from real data (impressions, clicks, indexed pages), not from guesses.

## 7. App visibility (PWA)

- `/app` is the crawlable landing page for the web app, with install instructions for Android, iPhone and desktop.
  Public tool pages stay crawlable; there are no private routes to expose.
- The manifest has PNG and maskable icons, shortcuts and a theme colour.
- AgriSmart is **not** on Google Play. If you publish there later (for example as a Trusted Web Activity), optimise
  the listing separately: title, short and long description, screenshots and a privacy-policy URL
  (`/privacy-policy`).

## 8. Maintaining SEO in this codebase

- New page → add a route in `App.jsx` **and** an entry in `src/seo/routes.js` (the unit test fails otherwise).
- New OG image → add it to `scripts/build_og_images.py` and run it.
- New photos → add the exact Commons file title to `scripts/commons_images.json` and run
  `python scripts/fetch_commons_images.py` (credits update automatically).
- Content reviewed → update `BRAND.contentUpdated` in `src/data/site.js` (it drives the sitemap `lastmod` and the
  on-page "last reviewed" dates).
