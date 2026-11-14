# Deploy the React app to Vercel

The Vite app is in `frontend/react-app`. Import the repository in the target Vercel account and set the project root to `frontend/react-app`. The included `vercel.json` builds `dist`, serves the prerendered `dist/<route>.html` files with `cleanUrls`, issues permanent redirects for old URLs and returns `404.html` (with a real 404 status) for unknown paths. There is deliberately no catch-all rewrite.

Set `VITE_API_URL` and `VITE_FARM_API_URL` to deployed API endpoints before publishing. The Vite development proxy is not available in production. Set `VITE_SITE_URL` to the canonical production origin (for example `https://agrismart-two-iota.vercel.app`, or a custom domain once added); it is used for canonical tags, Open Graph URLs, JSON-LD and the sitemap. Add `VITE_GA_MEASUREMENT_ID` for Google Analytics 4 and `VITE_GOOGLE_SITE_VERIFICATION` for the Search Console HTML meta verification token (written into the static HTML at build time). These values are public site configuration, not secrets.

After the first deployment, add the production domain as a Search Console property, verify it, submit `/sitemap.xml`, and confirm Analytics data collection. The repository does not know the target site's production domain or account-owned IDs.

Crop, yield, irrigation, weather and disease screens include sample or user-entered values where no verified provider is connected. The existing trained recommendation endpoint serves 22 crop classes; the broader crop explorer is a discovery catalog and does not expand model coverage.
