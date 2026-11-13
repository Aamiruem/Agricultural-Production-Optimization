import { use } from "react";

import { LanguageContext } from "./languageContext";

/** `const { t, lang, setLang } = useT();` */
export function useT() {
  return use(LanguageContext);
}
