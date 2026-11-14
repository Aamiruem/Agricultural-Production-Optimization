import { ExternalLink } from "lucide-react";
import { Link } from "react-router";

import { MedicalDisclaimer } from "@/components/site/MedicalDisclaimer";
import { PageHero, Reviewed } from "@/components/site/SiteKit";
import credits from "@/data/generated/imageCredits.json";
import { BRAND, OWNER } from "@/data/site";

export function PrivacyPolicyPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Legal"
        title="Privacy Policy"
        lead="What AgriSmart stores when you create an account and use the tools, and how to have it removed."
        compact
      />
      <article className="site-section site-prose legal">
        <Reviewed date="2026-11-14">Effective from</Reviewed>
        <h2>1. Who we are</h2>
        <p>
          AgriSmart is an agricultural technology website and web app developed and operated by {OWNER.name},{" "}
          {OWNER.location}. Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
        </p>
        <h2>2. Public pages</h2>
        <p>
          The home page and knowledge pages can be read without an account. We do not ask for personal data to read
          them.
        </p>
        <h2>3. Your account</h2>
        <ul>
          <li>
            <b>What we store:</b> your name, email address and a one-way Argon2 hash of your password (we never store or
            see the password itself), your role and when the account was created.
          </li>
          <li>
            <b>What you create:</b> crop recommendations you save, batch jobs, and farms, fields and activities you add.
          </li>
          <li>
            <b>Sessions:</b> after you sign in, a signed access token is kept in your browser and expires after a
            limited time; logging out removes it from the browser.
          </li>
          <li>
            <b>Password reset:</b> reset links are time-limited and work only once.
          </li>
        </ul>
        <h2>4. Location and analysis data</h2>
        <p>
          When you analyse a location, its coordinates are sent to the data providers below to fetch weather, soil and
          place information. Soil-test values and farm areas you enter are used for that analysis. A short summary of
          your latest analysis is kept in your browser so the dashboard can show it.
        </p>
        <h2>5. Third-party services</h2>
        <ul>
          <li>
            <b>Weather and climate:</b> Open-Meteo. <b>Soil:</b> ISRIC SoilGrids. <b>Place names:</b> OpenStreetMap
            Nominatim.
          </li>
          <li>
            <b>Fonts and icons:</b> Google Fonts. <b>Hosting:</b> standard request logs (IP address, browser type) are
            processed by the hosting provider to deliver and secure the site.
          </li>
          <li>
            <b>Analytics:</b> if enabled for a deployment, anonymised page views via Google Analytics.
          </li>
          <li>
            <b>Contact:</b> WhatsApp, phone and email links open those apps under their own privacy policies.
          </li>
        </ul>
        <h2>6. Contact form</h2>
        <p>
          Messages sent through the contact form (name, email, subject and message) are stored so we can reply, and are
          visible only to administrators.
        </p>
        <h2>7. Your choices</h2>
        <p>
          You can update your name and password in Profile &amp; settings. To have your account and its data deleted,
          email <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a> from the address you registered with.
        </p>
        <h2>8. Changes</h2>
        <p>
          We may update this policy; the date above shows the latest version. See also the{" "}
          <Link to="/terms">Terms</Link> and <Link to="/disclaimer">Disclaimer</Link>.
        </p>
      </article>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Legal"
        title="Terms and Conditions"
        lead="The rules for using the AgriSmart website, account and tools."
        compact
      />
      <article className="site-section site-prose legal">
        <Reviewed date="2026-11-14">Effective from</Reviewed>
        <h2>1. Using AgriSmart</h2>
        <p>
          AgriSmart is provided by {OWNER.name} for agricultural information and planning. By creating an account or
          using the tools you agree to these terms.
        </p>
        <h2>2. Your account</h2>
        <ul>
          <li>Give accurate registration details and keep your password private.</li>
          <li>You are responsible for activity under your account; tell us if you suspect misuse.</li>
          <li>We may suspend accounts that abuse the service, attempt unauthorised access or overload it.</li>
        </ul>
        <h2>3. Information and predictions</h2>
        <p>
          Crop recommendations, yield predictions, matching scores and other outputs are estimates from models and
          third-party data. They are planning aids, not guarantees. Confirm important decisions with a soil test, your
          Krishi Vigyan Kendra or another qualified expert. Health and nutrition pages are educational and not medical
          advice. See the <Link to="/disclaimer">Disclaimer</Link>.
        </p>
        <h2>4. Your data</h2>
        <p>
          You keep ownership of the data you enter or upload. You allow us to process it to provide the service, as
          described in the <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
        <h2>5. Acceptable use</h2>
        <ul>
          <li>Do not upload unlawful content or data you have no right to use.</li>
          <li>Do not try to bypass authentication, scrape the service at scale or disrupt it.</li>
        </ul>
        <h2>6. Availability</h2>
        <p>
          We aim to keep AgriSmart available but do not guarantee uninterrupted service. External data providers may be
          slow or unavailable at times; the app reports this rather than showing invented values.
        </p>
        <h2>7. Liability</h2>
        <p>
          To the extent permitted by law, AgriSmart is not liable for losses arising from decisions made using its
          information or predictions.
        </p>
        <h2>8. Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a> or the{" "}
          <Link to="/contact">contact page</Link>.
        </p>
      </article>
    </div>
  );
}

export function DisclaimerPage() {
  return (
    <div className="site-page">
      <PageHero
        kicker="Legal"
        title="Disclaimer"
        lead="Please read these limits before acting on any information or tool output from AgriSmart."
        compact
      />
      <article className="site-section site-prose legal">
        <Reviewed date={BRAND.contentUpdated}>Last updated</Reviewed>
        <h2>Educational information</h2>
        <p>
          Content on AgriSmart is provided for general education. Farming conditions vary by location, season, soil and
          variety. Confirm important decisions with a soil test, your Krishi Vigyan Kendra, a state agriculture officer
          or another qualified expert.
        </p>
        <h2>AI and model outputs</h2>
        <p>
          Crop recommendations, yield predictions, fertilizer and irrigation estimates and disease screening are
          produced by statistical and machine-learning models. They are planning aids, not guarantees, and can be wrong.
          Model accuracy is reported on the <Link to="/insights">model insights</Link> page.
        </p>
        <h2>Health and nutrition</h2>
        <MedicalDisclaimer />
        <h2>Government schemes</h2>
        <p>
          Scheme information is summarised from official portals on the date shown and may change. AgriSmart is not
          affiliated with or endorsed by any government body. Always apply through the official website or office.
        </p>
        <h2>External links</h2>
        <p>We link to external websites for convenience and are not responsible for their content or availability.</p>
        <h2>Images</h2>
        <p>
          Photographs are used under their respective licences; see <Link to="/image-credits">image credits</Link>.
        </p>
      </article>
    </div>
  );
}

export function ImageCreditsPage() {
  const rows = Object.entries(credits);
  return (
    <div className="site-page">
      <PageHero
        kicker="Legal"
        title="Image Credits and Licences"
        lead={`AgriSmart uses ${rows.length} freely licensed photographs from Wikimedia Commons. Thank you to every photographer.`}
        compact
      />
      <section className="site-section">
        <p className="muted-note">
          Images were cropped and resized. Licences marked CC BY or CC BY-SA require attribution; CC BY-SA adaptations
          are shared under the same licence. Crop photos in the crop gallery and the home-page artwork come from the
          companion project{" "}
          <a
            href="https://github.com/Aamiruem/Indian-Crop-Optimization-Production"
            target="_blank"
            rel="noopener noreferrer"
          >
            Indian Crop Optimization Production
          </a>
          .
        </p>
        <div className="table-scroll">
          <table className="site-table credits-table">
            <thead>
              <tr>
                <th scope="col">Used for</th>
                <th scope="col">Original file</th>
                <th scope="col">Author</th>
                <th scope="col">Licence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, c]) => (
                <tr key={key}>
                  <td>{key.replace("/", " · ").replace(/-/g, " ")}</td>
                  <td>
                    <a href={c.page} target="_blank" rel="noopener noreferrer">
                      {c.title} <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </td>
                  <td>{c.author}</td>
                  <td>
                    {c.licenseUrl ? (
                      <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license">
                        {c.license}
                      </a>
                    ) : (
                      c.license
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
