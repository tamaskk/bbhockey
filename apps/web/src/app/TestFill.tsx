"use client";

import { useEffect, useState } from "react";

// "Teszt adatok" button for trying the form: shown to a logged-in admin (same domain on Vercel),
// or to anyone on a URL with ?teszt (www.bbskills.hu/?teszt#jelentkezes).
// Fills every visible field with sample data except the e-mail, which is focused so the tester types their own.
export default function TestFill({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("teszt")) return setOn(true);
    fetch("/admin/api/users/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setOn(!!j?.user))
      .catch(() => {});
  }, []);
  if (!on) return null;

  const fill = (form: HTMLFormElement) => {
    const set = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, v: string) => {
      el.value = v;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const sample: Record<string, string> = { jatekos_vezeteknev: "Teszt", jatekos_keresztnev: "Elek", szulo_vezeteknev: "Teszt", szulo_keresztnev: "Szülő" };
    const done = new Set<string>();
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((el) => {
      if (el.closest("fieldset:disabled") || el.classList.contains("mhk-hp") || !el.name) return;
      if (el instanceof HTMLSelectElement) return set(el, [...el.options].find((o) => !o.disabled && o.value)?.value ?? "");
      if (el instanceof HTMLTextAreaElement) return set(el, "Teszt");
      if (el.type === "radio" || (el.type === "checkbox" && el.closest(".bb-choices"))) {
        // first option of each choice group; consents below are all ticked
        if (!done.has(el.name)) { done.add(el.name); el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); }
        return;
      }
      if (el.type === "checkbox") { el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); return; }
      if (el.type === "email") return;
      if (el.type === "date") return set(el, "2015-07-01");
      if (el.type === "tel") return set(el, "+36 30 123 4567");
      set(el, sample[el.name] ?? "Teszt");
    });
    form.querySelector<HTMLInputElement>("input[type=email]")?.focus();
  };

  return (
    <button type="button" className="mhk-btn mhk-btn-ghost bb-test-fill" onClick={(e) => { const f = e.currentTarget.closest("form"); if (f) fill(f); }}>
      <span>{label}</span>
    </button>
  );
}
