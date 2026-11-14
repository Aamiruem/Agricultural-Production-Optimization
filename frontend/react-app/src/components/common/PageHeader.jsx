import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useT } from "@/i18n/useT";

import { IconBadge } from "./IconBadge";

/**
 * Page heading that also sets the document title, description and canonical URL.
 * Pass `page` (a key in translations.pages) for bilingual copy, or explicit title/description.
 * `icon` is a Material Symbol name (or a lucide component).
 */
export function PageHeader({ page, title, description, icon, color = "#15803d", actions }) {
  const { t } = useT();
  const [pTitle, pDesc] = page ? t(`pages.${page}`) : [];
  const heading = title ?? pTitle;
  const desc = description ?? pDesc;
  useDocumentTitle(heading, desc);
  return (
    <header className="page-header">
      {icon && <IconBadge icon={icon} color={color} size={28} className="page-icon" />}
      <div className="page-header-text">
        <h1>{heading}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
