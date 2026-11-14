import { ArrowRight, Download, Smartphone, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { MIcon } from "@/components/common/MIcon";
import { PageHero, SectionTitle } from "@/components/site/SiteKit";
import { NAV_GROUPS } from "@/layouts/navigation";
import { useT } from "@/i18n/useT";
import { useSession } from "@/store/authStore";

/** Captures Chrome/Edge's install prompt so we can offer a real "Install" button. */
function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return { prompt, installed, clear: () => setPrompt(null) };
}

export default function AppPage() {
  const { t } = useT();
  const { prompt, installed, clear } = useInstallPrompt();
  const tools = NAV_GROUPS.filter((g) => ["overview", "plan", "farm"].includes(g.id))
    .flatMap((g) => g.links)
    .filter((l) => !l.to.includes("#"));
  const { user } = useSession();
  const open = (to) => (user ? to : `/login?next=${encodeURIComponent(to)}`);

  return (
    <div className="site-page">
      <PageHero
        kicker="AgriSmart web app"
        title="Free AI Farming Tools on Any Phone"
        lead="Crop advisor, yield forecast, soil health, fertilizer, irrigation, disease screening and live weather — no app store needed. Create a free account, add AgriSmart to your home screen and open it like an app."
        legacyImage="/images/india-agriculture-hero.webp"
        imageAlt="A farmer using a tablet beside rice, wheat, cotton and sugarcane fields"
      >
        <Link to={user ? "/dashboard" : "/register?next=%2Fdashboard"} className="site-btn site-btn--gold">
          {user ? "Open the app" : "Create a free account"} <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to={open("/local-intelligence")} className="site-btn site-btn--ghost">
          Analyze my farm location
        </Link>
        {prompt && !installed && (
          <button
            type="button"
            className="site-btn site-btn--ghost"
            onClick={async () => {
              prompt.prompt();
              await prompt.userChoice;
              clear();
            }}
          >
            <Download size={18} aria-hidden="true" /> Install AgriSmart
          </button>
        )}
      </PageHero>

      <section className="site-section" aria-labelledby="tools-title">
        <SectionTitle
          id="tools-title"
          kicker="Inside the app"
          title={`${tools.length} tools for planning, growing and analysing`}
        />
        <div className="app-tools">
          {tools.map((l) => (
            <Link key={l.to} to={open(l.to)} className="app-tool" style={{ "--c": l.color }}>
              <MIcon name={l.icon} size={24} fill />
              <span>{t(l.key)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-section" aria-labelledby="install-title">
        <SectionTitle id="install-title" kicker="Install" title="Add AgriSmart to your home screen" />
        {installed && (
          <p className="form-status" role="status">
            AgriSmart is installed on this device.
          </p>
        )}
        <div className="info-grid">
          <div className="info-card">
            <Smartphone size={22} aria-hidden="true" />
            <h3>Android (Chrome)</h3>
            <ol>
              <li>Open AgriSmart in Chrome.</li>
              <li>Tap the ⋮ menu at the top right.</li>
              <li>Choose &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</li>
            </ol>
          </div>
          <div className="info-card">
            <Smartphone size={22} aria-hidden="true" />
            <h3>iPhone / iPad (Safari)</h3>
            <ol>
              <li>Open AgriSmart in Safari.</li>
              <li>Tap the Share button.</li>
              <li>Choose &ldquo;Add to Home Screen&rdquo;, then &ldquo;Add&rdquo;.</li>
            </ol>
          </div>
          <div className="info-card">
            <Download size={22} aria-hidden="true" />
            <h3>Desktop (Chrome / Edge)</h3>
            <ol>
              <li>Open AgriSmart.</li>
              <li>Click the install icon in the address bar, or use the browser menu.</li>
              <li>Choose &ldquo;Install AgriSmart&rdquo;.</li>
            </ol>
          </div>
          <div className="info-card">
            <WifiOff size={22} aria-hidden="true" />
            <h3>Good to know</h3>
            <p>
              The app needs an internet connection to load. Farm records and planner data are saved on your device.
              AgriSmart is not currently listed on Google Play or the App Store.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
