import { CheckCircle2, Globe, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";

import { GithubIcon, LinkedinIcon } from "@/components/site/SiteKit";
import { mailtoLink, OWNER, whatsappLink } from "@/data/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, getErrorMessage, isApiUnavailable } from "@/services/apiClient";

const CHANNELS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: OWNER.phoneDisplay,
    href: whatsappLink("Hello Aamir, I'm contacting you from AgriSmart."),
    external: true,
  },
  { icon: Phone, label: "Call", value: OWNER.phoneDisplay, href: `tel:${OWNER.phone}` },
  { icon: Mail, label: "Email", value: OWNER.email, href: `mailto:${OWNER.email}` },
  { icon: Globe, label: "Portfolio", value: "aamir-hussain-azad.vercel.app", href: OWNER.portfolio, external: true },
  { icon: LinkedinIcon, label: "LinkedIn", value: "Aamir Hussain Azad", href: OWNER.linkedin, external: true },
  { icon: GithubIcon, label: "GitHub", value: "github.com/Aamiruem", href: OWNER.github, external: true },
];

const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.subject.trim().length < 3) e.subject = "Please add a short subject.";
  if (v.message.trim().length < 10) e.message = "Please write at least 10 characters.";
  return e;
}

/** Contact page: the form posts to the AgriSmart API, which stores the message. */
export default function ContactPage() {
  useDocumentTitle("Contact", null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: "idle" });
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const body = () =>
    [
      `Subject: ${values.subject}`,
      "",
      values.message.trim(),
      "",
      `— ${values.name.trim()} (${values.email.trim()})`,
    ].join("\n");

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState({ status: "sending" });
    try {
      const { data } = await api.post("/contact", values);
      if (typeof data !== "object" || !data?.id) throw Object.assign(new Error("no api"), { code: "API_HTML" });
      setState({ status: "sent", message: data.detail, id: data.id });
      setValues(EMPTY);
    } catch (err) {
      if (err.code === "API_HTML" || isApiUnavailable(err)) {
        setState({ status: "offline" });
      } else {
        setState({ status: "error", message: getErrorMessage(err) });
      }
    }
  };

  const field = (k, label, props = {}) => (
    <div className="field-x">
      <label htmlFor={`c-${k}`}>{label}</label>
      {props.as === "textarea" ? (
        <textarea
          id={`c-${k}`}
          value={values[k]}
          onChange={set(k)}
          aria-invalid={Boolean(errors[k])}
          aria-describedby={errors[k] ? `c-${k}-err` : undefined}
          rows="6"
        />
      ) : (
        <input
          id={`c-${k}`}
          value={values[k]}
          onChange={set(k)}
          aria-invalid={Boolean(errors[k])}
          aria-describedby={errors[k] ? `c-${k}-err` : undefined}
          {...props}
        />
      )}
      {errors[k] && (
        <span id={`c-${k}-err`} className="field-err" role="alert">
          {errors[k]}
        </span>
      )}
    </div>
  );

  return (
    <>
      <section className="hp-hero" aria-labelledby="contact-title">
        <div className="container-x">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Contact</span>
            <h1 id="contact-title" style={{ fontSize: "var(--fs-hero)", fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              Let&apos;s talk about smarter farming
            </h1>
            <p>Questions, feedback, data corrections or a project idea — send a message and we will reply by email.</p>
          </div>
        </div>
      </section>

      <section className="sec sec--white" aria-label="Contact options">
        <div className="container-x contact-layout">
          <div className="contact-card-main">
            <h2>{OWNER.name}</h2>
            <p className="contact-role">{OWNER.title}</p>
            <p className="contact-loc">
              <MapPin size={16} aria-hidden="true" /> {OWNER.location}
            </p>
            <ul className="channel-list">
              {CHANNELS.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    className={`channel${label === "WhatsApp" ? " channel--whatsapp" : ""}`}
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

          <form className="contact-form auth-form" onSubmit={submit} noValidate aria-labelledby="form-title">
            <h2 id="form-title" style={{ margin: 0, fontWeight: 800 }}>
              Send a message
            </h2>
            {state.status === "sent" ? (
              <div className="form-alert form-alert--ok" role="status">
                <CheckCircle2 size={18} aria-hidden="true" /> {state.message} Reference #{state.id}.
              </div>
            ) : (
              <>
                {field("name", "Name", { autoComplete: "name" })}
                {field("email", "Email", { type: "email", autoComplete: "email" })}
                {field("subject", "Subject")}
                {field("message", "Message", { as: "textarea" })}
                <input
                  type="text"
                  name="website"
                  value={values.website}
                  onChange={set("website")}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="visually-hidden"
                />
                {state.status === "error" && (
                  <div className="form-alert form-alert--error" role="alert">
                    {state.message}
                  </div>
                )}
                {state.status === "offline" && (
                  <div className="form-alert form-alert--info" role="alert">
                    The message service is not reachable right now, so nothing was sent. You can send the same message
                    yourself:
                    <div className="hp-cta-row" style={{ marginTop: "0.75rem" }}>
                      <a
                        className="btn-x btn-x--sm btn-x--primary"
                        href={whatsappLink(body())}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                      </a>
                      <a
                        className="btn-x btn-x--sm btn-x--secondary"
                        href={mailtoLink(`[AgriSmart] ${values.subject}`, body())}
                      >
                        <Mail size={16} aria-hidden="true" /> Email
                      </a>
                    </div>
                  </div>
                )}
                <button type="submit" className="btn-x btn-x--primary" disabled={state.status === "sending"}>
                  {state.status === "sending" ? (
                    <Loader2 size={18} className="spin-x" aria-hidden="true" />
                  ) : (
                    <Send size={18} aria-hidden="true" />
                  )}
                  {state.status === "sending" ? "Sending…" : "Send message"}
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
