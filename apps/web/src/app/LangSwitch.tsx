"use client";

import { useEffect, useRef } from "react";
import { LANGS, LANG_NAMES, prefix, type Lang } from "@/lib/i18n";

// SVG flags (emoji flags don't show on Windows)
const FLAGS: Record<Lang, React.ReactNode> = {
  hu: (
    <svg viewBox="0 0 6 3" aria-hidden="true"><path fill="#cd2a3e" d="M0 0h6v1H0z" /><path fill="#fff" d="M0 1h6v1H0z" /><path fill="#436f4d" d="M0 2h6v1H0z" /></svg>
  ),
  en: (
    <svg viewBox="0 0 60 30" aria-hidden="true">
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#fff" strokeWidth="6" d="M0 0l60 30M60 0L0 30" />
      <path stroke="#c8102e" strokeWidth="2" d="M0 0l60 30M60 0L0 30" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 5 3" aria-hidden="true"><path fill="#000" d="M0 0h5v1H0z" /><path fill="#d00" d="M0 1h5v1H0z" /><path fill="#ffce00" d="M0 2h5v1H0z" /></svg>
  ),
  sv: (
    <svg viewBox="0 0 16 10" aria-hidden="true"><path fill="#006aa7" d="M0 0h16v10H0z" /><path fill="#fecc02" d="M5 0h2v10H5zM0 4h16v2H0z" /></svg>
  ),
};

// language picker in the header: same page, other language ("/aszf" <-> "/en/aszf")
export default function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const box = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && box.current.removeAttribute("open");
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const go = (to: Lang) => {
    const rest = window.location.pathname.replace(/^\/(en|de|sv|hu)(?=\/|$)/, "") || "/";
    window.location.assign(`${prefix(to)}${rest === "/" && to !== "hu" ? "" : rest}${window.location.hash}`);
  };
  return (
    <details className="bb-lang" ref={box}>
      <summary aria-label={`${label}: ${LANG_NAMES[lang]}`} title={label}>{FLAGS[lang]}<span>{lang.toUpperCase()}</span></summary>
      <ul>
        {LANGS.map((l) => (
          <li key={l}>
            <button type="button" lang={l} aria-current={l === lang || undefined} onClick={() => go(l)}>
              {FLAGS[l]}<span>{LANG_NAMES[l]}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
