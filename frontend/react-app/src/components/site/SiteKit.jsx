import { ArrowRight, ChevronRight, Mail, MessageCircle, Phone } from "lucide-react";
import { Link, useLocation } from "react-router";

import { OWNER, photo, whatsappLink } from "@/data/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { breadcrumbTrail } from "@/seo/routes";

// Shared building blocks for AgriSmart's content pages.

/** Brand marks not shipped by lucide v1. */
export function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function LinkedinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Responsive photo from /images/<key>-640|1200.webp. Lazy by default. */
export function SitePhoto({ image, alt, sizes = "(max-width: 768px) 100vw, 50vw", priority = false, className }) {
  const p = photo(image);
  return (
    <img
      className={className}
      src={p.src}
      srcSet={p.srcSet}
      sizes={sizes}
      width={p.width}
      height={p.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

/** Visible breadcrumb trail (mirrors the BreadcrumbList JSON-LD). */
export function Breadcrumbs({ light = false }) {
  const { pathname } = useLocation();
  const trail = breadcrumbTrail(pathname);
  if (trail.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className={`crumbs${light ? " crumbs--light" : ""}`}>
      <ol>
        {trail.map((c, i) => (
          <li key={c.path}>
            {i < trail.length - 1 ? (
              <>
                <Link to={c.path}>{c.name}</Link>
                <ChevronRight size={14} aria-hidden="true" />
              </>
            ) : (
              <span aria-current="page">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Full-width page hero with photo, breadcrumbs, kicker, H1 and lead. Also sets the
 * document SEO tags (from the registry) via useDocumentTitle.
 */
export function PageHero({ kicker, title, lead, image, imageAlt, legacyImage, children, compact = false }) {
  useDocumentTitle(title, lead);
  return (
    <header className={`site-hero${compact ? " site-hero--compact" : ""}`}>
      {image && <SitePhoto image={image} alt={imageAlt || ""} sizes="100vw" priority className="site-hero-photo" />}
      {legacyImage && (
        <img src={legacyImage} alt={imageAlt || ""} className="site-hero-photo" width="1600" height="900" fetchPriority="high" />
      )}
      <div className="site-hero-inner">
        <Breadcrumbs light />
        {kicker && <span className="site-kicker site-kicker--light">{kicker}</span>}
        <h1>{title}</h1>
        {lead && <p className="site-hero-lead">{lead}</p>}
        {children && <div className="site-hero-actions">{children}</div>}
      </div>
    </header>
  );
}

/** Section heading with optional kicker and lead. */
export function SectionTitle({ id, kicker, title, lead, align = "start", as: Tag = "h2" }) {
  return (
    <div className={`site-section-title site-section-title--${align}`}>
      {kicker && <span className="site-kicker">{kicker}</span>}
      <Tag id={id}>{title}</Tag>
      {lead && <p>{lead}</p>}
    </div>
  );
}

/** WhatsApp call-to-action. External link that opens a chat with the owner. */
export function WhatsAppButton({ text = "Hello Aamir, I visited AgriSmart and would like to know more.", label = "Chat on WhatsApp", variant = "solid", className = "" }) {
  return (
    <a
      href={whatsappLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      className={`site-btn site-btn--whatsapp${variant === "outline" ? " site-btn--whatsapp-outline" : ""} ${className}`}
    >
      <MessageCircle size={18} aria-hidden="true" /> {label}
    </a>
  );
}

/** Row of direct contact actions: WhatsApp, call and email. */
export function ContactActions({ compact = false }) {
  return (
    <div className={`contact-actions${compact ? " contact-actions--compact" : ""}`}>
      <WhatsAppButton />
      <a href={`tel:${OWNER.phone}`} className="site-btn site-btn--light">
        <Phone size={18} aria-hidden="true" /> Call {OWNER.phoneDisplay}
      </a>
      <a href={`mailto:${OWNER.email}`} className="site-btn site-btn--light">
        <Mail size={18} aria-hidden="true" /> Email
      </a>
    </div>
  );
}

/** Internal "read more" link with arrow. */
export function MoreLink({ to, children }) {
  return (
    <Link to={to} className="site-more">
      {children} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

/** Closing call-to-action band used at the end of content pages. */
export function CtaBand({ title = "Have a question or a project in mind?", text = "Talk directly with AgriSmart's developer on WhatsApp, by phone or by email." }) {
  return (
    <section className="cta-band" aria-label="Contact AgriSmart">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <ContactActions compact />
    </section>
  );
}

/** Small "last reviewed" note for content freshness. */
export function Reviewed({ date, children }) {
  const pretty = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <p className="reviewed-note">
      {children ?? "Content last reviewed"} <time dateTime={date}>{pretty}</time>
    </p>
  );
}
