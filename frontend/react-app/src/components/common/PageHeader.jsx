import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useT } from "@/i18n/useT";

/**
 * Page heading that also sets the document title, description and canonical URL.
 * Pass `page` (a key in translations.pages) for bilingual copy, or explicit title/description.
 */
export function PageHeader({ page, title, description, icon: Icon, color = "#16a34a", actions }) {
  const { t } = useT();
  const [pTitle, pDesc] = page ? t(`pages.${page}`) : [];
  const heading = title ?? pTitle;
  const desc = description ?? pDesc;
  useDocumentTitle(heading, desc);
  return (
    <header className="page-header">
      {Icon && <span className="icon-badge page-icon" style={{ "--c": color }} aria-hidden="true"><Icon size={24} strokeWidth={2.2} /></span>}
      <div className="page-header-text">
        <h1>{heading}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
