"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LangCode, t as translate, SUPPORTED_LANGUAGES } from "./translations";

interface LangContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: Parameters<typeof translate>[0]) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => translate(key, "en"),
});

export function LanguageProvider({ children, initialLang = "en" }: { children: ReactNode; initialLang?: LangCode }) {
  const [lang, setLangState] = useState<LangCode>(initialLang);

  useEffect(() => {
    // Load language from API on mount
    fetch("/api/portal/language").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.language && SUPPORTED_LANGUAGES.some(l => l.code === d.language)) {
        setLangState(d.language);
      }
    }).catch(() => {});
  }, []);

  const setLang = async (code: LangCode) => {
    setLangState(code);
    // Persist to API
    await fetch("/api/portal/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: code }),
    }).catch(() => {});
  };

  const t = (key: Parameters<typeof translate>[0]) => translate(key, lang);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() { return useContext(LangContext); }
