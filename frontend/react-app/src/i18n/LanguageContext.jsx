import { useCallback, useEffect, useMemo, useState } from "react";

import { LanguageContext } from "./languageContext";
import { translations } from "./translations";

const STORAGE_KEY = "agri-lang";

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "hi") return saved;
  } catch {
    // storage unavailable
  }
  return navigator.language?.startsWith("hi") ? "hi" : "en";
}

function lookup(lang, key) {
  return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), translations[lang]);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable
    }
    setLangState(next);
  }, []);

  const t = useCallback((key) => lookup(lang, key) ?? lookup("en", key) ?? key, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext value={value}>{children}</LanguageContext>;
}
