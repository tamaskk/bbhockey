"use client";

import { useEffect, useRef } from "react";

type Props = { badge?: string | null; title?: string | null; text?: string | null; image?: string; button?: string | null; href: string; until?: string | null; close: string };

// "Promóció" pop-up from the admin (Beállítások → Promóció). Comes up once per visitor; edited text shows again.
export default function Promo({ badge, title, text, image, button, href, until, close }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const key = `bb-promo:${title}|${text}`.slice(0, 300);

  useEffect(() => {
    // the chosen day still counts: hide from the next midnight on
    if (until && Date.now() >= new Date(until).setHours(24, 0, 0, 0)) return;
    try {
      if (localStorage.getItem("bb-promo") === key) return;
    } catch {}
    const id = setTimeout(() => dialog.current?.showModal(), 1200);
    return () => clearTimeout(id);
  }, [key, until]);

  const dismiss = () => {
    try {
      localStorage.setItem("bb-promo", key);
    } catch {}
    dialog.current?.close();
  };

  return (
    <dialog ref={dialog} className="bb-promo" aria-labelledby="bb-promo-title" onClose={dismiss} onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <button type="button" className="bb-promo-x" onClick={dismiss} aria-label={close}>×</button>
      {image && <img src={image} alt="" />}
      <div className="bb-promo-body">
        {badge && <span className="bb-promo-badge">{badge}</span>}
        {title && <h3 id="bb-promo-title">{title}</h3>}
        {/* empty line = paragraph, "- " lines = list */}
        {(text ?? "").split(/\n\s*\n/).filter((b) => b.trim()).map((b, i) => {
          const lines = b.split("\n");
          return lines.every((l) => l.startsWith("- ")) ? (
            <ul key={i}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>
          ) : (
            <p key={i}>{b}</p>
          );
        })}
        {button && <a className="mhk-btn mhk-btn-primary" href={href} onClick={dismiss}><span>{button}</span></a>}
      </div>
    </dialog>
  );
}
