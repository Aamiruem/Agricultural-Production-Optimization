import { Globe, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";

import { GithubIcon, LinkedinIcon, PageHero, SectionTitle } from "@/components/site/SiteKit";
import { OWNER, mailtoLink, whatsappLink } from "@/data/site";

const TOPICS = [
  "General question",
  "Project / service request",
  "Job or internship opportunity",
  "Feedback on AgriSmart",
  "Data correction",
];

const CHANNELS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: OWNER.phoneDisplay,
    href: whatsappLink("Hello Aamir, I'm contacting you from AgriSmart."),
    external: true,
    tone: "whatsapp",
  },
  { icon: Phone, label: "Call", value: OWNER.phoneDisplay, href: `tel:${OWNER.phone}` },
  { icon: Mail, label: "Email", value: OWNER.email, href: `mailto:${OWNER.email}` },
  { icon: Globe, label: "Portfolio", value: "aamir-hussain-azad.vercel.app", href: OWNER.portfolio, external: true },
  { icon: LinkedinIcon, label: "LinkedIn", value: "Aamir Hussain Azad", href: OWNER.linkedin, external: true },
  { icon: GithubIcon, label: "GitHub", value: "github.com/Aamiruem", href: OWNER.github, external: true },
];

/**
 * Contact page. The form has no backend: it composes the message and opens WhatsApp
 * or the visitor's email app, where they press send themselves. We never claim a
 * message was delivered.
 */
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [opened, setOpened] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const compose = () =>
    [
      `Hello Aamir,`,
      "",
      form.message.trim(),
      "",
      `— ${form.name.trim()}${form.email.trim() ? ` (${form.email.trim()})` : ""}`,
      `Topic: ${form.topic}`,
      "Sent from the AgriSmart contact page",
    ].join("\n");

  const valid = () => {
    if (!form.name.trim() || !form.message.trim()) {
      setError("Please enter your name and a message.");
      return false;
    }
    setError("");
    return true;
  };

  const sendWhatsApp = (e) => {
    e.preventDefault();
    if (!valid()) return;
    window.open(whatsappLink(compose()), "_blank", "noopener,noreferrer");
    setOpened("WhatsApp");
  };

  const sendEmail = () => {
    if (!valid()) return;
    window.location.href = mailtoLink(`[AgriSmart] ${form.topic}`, compose());
    setOpened("your email app");
  };

  return (
    <div className="site-page">
      <PageHero
        kicker="Contact"
        title="Contact AgriSmart"
        lead={`Talk directly with ${OWNER.name}, ${OWNER.title}, in ${OWNER.city}. WhatsApp is the fastest way to reach me.`}
        image="education/agri-economics"
        imageAlt="Farmers and traders talking at a produce market"
        compact
      />

      <section className="site-section contact-layout">
        <div className="contact-card-main">
          <h2>{OWNER.name}</h2>
          <p className="contact-role">{OWNER.title}</p>
          <p className="contact-loc">
            <MapPin size={16} aria-hidden="true" /> {OWNER.city}, India
          </p>
          <ul className="channel-list">
            {CHANNELS.map(({ icon: Icon, label, value, href, external, tone }) => (
              <li key={label}>
                <a
                  href={href}
                  className={`channel${tone ? ` channel--${tone}` : ""}`}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span className="channel-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span>
                    <b>{label}</b>
                    <small>{value}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form className="contact-form" onSubmit={sendWhatsApp} noValidate>
          <SectionTitle
            kicker="Send a message"
            title="Write to me"
            lead="Your message opens in WhatsApp or your email app so you can review it and press send."
          />
          <label className="field-label">
            Your name
            <input required value={form.name} onChange={set("name")} autoComplete="name" placeholder="Name" />
          </label>
          <label className="field-label">
            Email (optional)
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="field-label">
            Topic
            <select value={form.topic} onChange={set("topic")}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Message
            <textarea required rows="5" value={form.message} onChange={set("message")} placeholder="How can I help?" />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="contact-form-actions">
            <button type="submit" className="site-btn site-btn--whatsapp">
              <MessageCircle size={18} aria-hidden="true" /> Continue in WhatsApp
            </button>
            <button type="button" className="site-btn site-btn--light" onClick={sendEmail}>
              <Send size={18} aria-hidden="true" /> Continue in email
            </button>
          </div>
          {opened && (
            <p className="form-status" role="status">
              We opened {opened} with your message. It is sent only after you press <b>Send</b> there.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
