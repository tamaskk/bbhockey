import type { CSSProperties } from "react";

// One element's look, set in the page editor (🎨). Stored in Beallitasok.styles under "<global>:<path>".
export type Look = {
  color?: string; bg?: string; font?: string; size?: number; weight?: string;
  italic?: boolean; upper?: "upper" | "none"; align?: "left" | "center" | "right"; underline?: boolean; pad?: number;
  /** moved by dragging in the editor, px from its normal place */
  x?: number; y?: number;
  /** deleted in the editor: not shown on the site (faded while editing, so it can be restored) */
  hide?: boolean;
};
export type Looks = Record<string, Look>;

const COLOR = /^#[0-9a-f]{6}$/i;
// Google Fonts css2 family spec, e.g. "Montserrat:ital,wght@0,400;1,700"
const FONT = /^[A-Za-z][A-Za-z ]{1,40}(:[a-z,@;0-9.]{1,80})?$/;

export const fontName = (spec?: string | null) => (spec && FONT.test(spec) ? spec.split(":")[0] : undefined);

// Stored values come from the admin; only known keys with valid values become CSS (no url(), no free text).
export function css(l: Look | undefined, edit = false): CSSProperties | undefined {
  if (!l || typeof l !== "object") return undefined;
  const s: CSSProperties = {};
  if (COLOR.test(l.color ?? "")) s.color = l.color;
  if (COLOR.test(l.bg ?? "")) s.backgroundColor = l.bg;
  const f = fontName(l.font);
  // also override the theme's font variables, so headings and texts inside a section/card follow its font
  if (f) Object.assign(s, { fontFamily: `"${f}", sans-serif`, "--bb-fh": `"${f}"`, "--bb-fb": `"${f}"` });
  if (Number.isFinite(l.size) && l.size! >= 8 && l.size! <= 160) s.fontSize = `${l.size}px`;
  if (["300", "400", "500", "600", "700", "800", "900"].includes(String(l.weight))) s.fontWeight = Number(l.weight);
  if (l.italic === true) s.fontStyle = "italic";
  if (l.italic === false) s.fontStyle = "normal";
  if (l.upper === "upper") s.textTransform = "uppercase";
  if (l.upper === "none") s.textTransform = "none";
  if (l.align === "left" || l.align === "center" || l.align === "right") s.textAlign = l.align;
  if (l.underline === true) s.textDecoration = "underline";
  if (Number.isFinite(l.pad) && l.pad! >= 0 && l.pad! <= 300) { s.paddingTop = `${l.pad}px`; s.paddingBottom = `${l.pad}px`; }
  if (l.hide === true) Object.assign(s, edit ? { opacity: 0.3 } : { display: "none" });
  const off = (v?: number) => (Number.isFinite(v) && Math.abs(v!) <= 2000 && v !== 0 ? v! : 0);
  // shortcut: fixed px offsets, may land oddly on very different screen widths; upgrade to % if that bites
  if (off(l.x) || off(l.y)) Object.assign(s, { position: "relative", left: `${off(l.x)}px`, top: `${off(l.y)}px` });
  return Object.keys(s).length ? s : undefined;
}

// one Google Fonts request for every font in use (theme defaults are served locally and need none)
export function fontsHref(specs: (string | null | undefined)[]): string | undefined {
  const ok = [...new Set(specs.filter((s): s is string => !!s && FONT.test(s)))];
  return ok.length ? `https://fonts.googleapis.com/css2?${ok.map((s) => `family=${s.replace(/ /g, "+")}`).join("&")}&display=swap` : undefined;
}
