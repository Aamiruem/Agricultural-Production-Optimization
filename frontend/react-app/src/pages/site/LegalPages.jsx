import { ExternalLink } from "lucide-react";
import { Link } from "react-router";

import { MedicalDisclaimer } from "@/components/site/MedicalDisclaimer";
import { PageHero, Reviewed } from "@/components/site/SiteKit";
import credits from "@/data/generated/imageCredits.json";
import { BRAND, OWNER } from "@/data/site";

export function PrivacyPolicyPage() {
  return (
    <div className="site-page">
      <PageHero kicker="Legal" title="Privacy Policy" lead="AgriSmart has no accounts, sign-up or login. This page explains what little data is involved when you use the site." compact />
      <article className="site-section site-prose legal">
        <Reviewed date={BRAND.contentUpdated}>Effective from</Reviewed>
        <h2>1. Who we are</h2>
        <p>
          AgriSmart is an educational website and web app developed and operated by {OWNER.name}, {OWNER.location}.
          Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>.
        </p>
        <h2>2. No accounts</h2>
        <p>You can use every page and tool without creating an account. We do not ask for passwords or payment details.</p>
        <h2>3. Data stored in your browser</h2>
        <p>
          Some preferences and tool data are saved only in your own browser (localStorage/sessionStorage) and are not sent
          to us: colour theme, language, dismissed announcements, notification read status, farms and fields you record
          on the &ldquo;My farms&rdquo; page, and recent recommendation history. Clearing your browser&apos;s site data
          removes them.
        </p>
        <h2>4. Third-party services</h2>
        <ul>
          <li>
            <b>Weather:</b> weather tools request forecasts from Open-Meteo for the location you choose (for example a
            state capital).
          </li>
          <li>
            <b>Fonts:</b> fonts and icons load from Google Fonts.
          </li>
          <li>
            <b>Hosting:</b> the site is hosted on Vercel, which processes standard request logs (such as IP address and
            browser type) to deliver and secure the site.
          </li>
          <li>
            <b>Analytics:</b> if Google Analytics is enabled for this deployment, it records anonymised page views to help
            us understand which content is useful. IP anonymisation is requested.
          </li>
          <li>
            <b>Contact:</b> WhatsApp, phone and email links open those apps; messages are handled under their own privacy
            policies.
          </li>
        </ul>
        <h2>5. Contact form</h2>
        <p>
          The contact form does not send data to a server. It prepares your message and opens WhatsApp or your email app,
          where you review and send it yourself.
        </p>
        <h2>6. Children</h2>
        <p>The site is intended for a general audience and does not knowingly collect personal data from children.</p>
        <h2>7. Changes and contact</h2>
        <p>
          We may update this policy; the date above shows the latest version. Questions? Email{" "}
          <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a> or see <Link to="/contact">Contact</Link>.
        </p>
      </article>
    </div>
  );
}

export function DisclaimerPage() {
  return (
    <div className="site-page">
      <PageHero kicker="Legal" title="Disclaimer" lead="Please read these limits before acting on any information or tool output from AgriSmart." compact />
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
          Crop recommendations, yield predictions, fertilizer and irrigation estimates and disease screening are produced
          by statistical and machine-learning models. They are planning aids, not guarantees, and can be wrong. Model
          accuracy is reported on the <Link to="/insights">model insights</Link> page.
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
          Images were cropped and resized. Licences marked CC BY or CC BY-SA require attribution; CC BY-SA adaptations are
          shared under the same licence. Crop photos in the crop gallery and the home-page artwork come from the
          companion project{" "}
          <a href="https://github.com/Aamiruem/Indian-Crop-Optimization-Production" target="_blank" rel="noopener noreferrer">
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
