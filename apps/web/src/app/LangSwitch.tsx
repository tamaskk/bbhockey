"use client";

import { LANGS, LANG_NAMES, prefix, type Lang } from "@/lib/i18n";

// language picker in the header: same page, other language ("/aszf" <-> "/en/aszf")
export default function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const go = (to: Lang) => {
    const rest = window.location.pathname.replace(/^\/(en|de|sv|hu)(?=\/|$)/, "") || "/";
    window.location.assign(`${prefix(to)}${rest === "/" && to !== "hu" ? "" : rest}${window.location.hash}`);
  };
  return (
    <select className="bb-lang" aria-label={label} title={label} value={lang} onChange={(e) => go(e.target.value as Lang)}>
      {LANGS.map((l) => <option key={l} value={l} title={LANG_NAMES[l]}>{l.toUpperCase()}</option>)}
    </select>
  );
}
