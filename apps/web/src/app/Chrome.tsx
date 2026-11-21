import { img, type Beallitasok } from "@/lib/cms";
import ThemeToggle from "./ThemeToggle";
import { editor } from "@/lib/edit";
import type { Looks } from "@/lib/style";

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const anchor = (l: { target?: string | null; href?: string | null }, base = "") => l.href || `${base}#${l.target ?? "fooldal"}`;

// links to the legal pages, at the bottom of the footer
export const DOC_LINKS = [
  { href: "/aszf", label: "ÁSZF" },
  { href: "/adatkezeles", label: "Adatkezelési tájékoztató" },
  { href: "/sutik", label: "Süti tájékoztató" },
  { href: "/impresszum", label: "Impresszum" },
];

function Logo({ site, priority, edit = false }: { site: Beallitasok; priority?: boolean; edit?: boolean }) {
  const src = img(site.logo);
  return src ? <img alt={site.name} src={src} width={614} height={614} fetchPriority={priority ? "high" : undefined} {...editor(edit, "beallitasok").img("logo")} /> : <b>{site.name}</b>;
}

export function Header({ site, edit = false, base = "" }: { site: Beallitasok; edit?: boolean; base?: string }) {
  const nav = site.nav ?? [];
  const e = editor(edit, "beallitasok", site.styles as Looks);
  return (
    <>
      <div aria-hidden="true" className="mhk-scroll-progress" />
      <a className="screen-reader-text" href="#mhk-content">Ugrás a tartalomra</a>
      <header className="mhk-sticky-header" role="banner" {...e.block("", undefined, "header")}>
        <div className="mhk-wrap mhk-nav">
          <a aria-label={`${site.name} – főoldal`} className="mhk-nav-logo" href={`${base}#fooldal`}><Logo site={site} priority edit={edit} /></a>
          <nav aria-label="Főmenü" className="mhk-nav-links" id="mhk-menu" role="navigation">
            <div className="mhk-nav-panel-head">
              <span>Menü</span>
              <button aria-label="Menü bezárása" className="mhk-nav-close" type="button">×</button>
            </div>
            {nav.map((l, i) => (
              <a className={i === 0 ? "mhk-active" : undefined} href={`${base}#${l.target}`} key={l.id ?? i}><span {...e.f(`nav.${i}.label`)}>{l.label}</span></a>
            ))}
            <div className="mhk-nav-panel-foot">
              <a className="mhk-btn mhk-btn-primary" href={`${base}#jelentkezes`}><span>{site.ctaLabel}</span></a>
              <a className="mhk-nav-panel-phone" href={tel(site.phone)}>{site.phone}</a>
              {site.location && <span className="mhk-nav-panel-note">{site.location}</span>}
              <Social site={site} className="mhk-footer-social" />
            </div>
          </nav>
          <div className="mhk-nav-backdrop" hidden />
          <div className="mhk-nav-cta">
            <Social site={site} className="mhk-nav-social" />
            <ThemeToggle />
            <a className="mhk-nav-phone" href={tel(site.phone)}><span {...e.f("phone")}>{site.phone}</span></a>
            <a className="mhk-btn mhk-btn-primary" href={`${base}#jelentkezes`}><span {...e.f("ctaLabel")}>{site.ctaLabel}</span></a>
            <button aria-controls="mhk-menu" aria-expanded="false" aria-label="Menü megnyitása" className="mhk-nav-toggle" type="button">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

// one icon per platform of Beállítások → Közösségi oldalak (admin/src/globals/Beallitasok.ts SOCIAL_PLATFORMS)
const ICONS: Record<string, string> = {
  facebook: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.4H7.8V13h2.7v8h3z",
  instagram: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0 2c-3.1 0-3.5 0-4.7.1-2.2.1-3 1-3.1 3.1-.1 1.2-.1 1.6-.1 4.6s0 3.4.1 4.6c.1 2.2 1 3 3.1 3.1 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3-1 3.1-3.1.1-1.2.1-1.6.1-4.6s0-3.4-.1-4.6c-.1-2.2-1-3-3.1-3.1-1.2-.1-1.6-.1-4.7-.1zm0 3.3a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2zm0 2a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.3-2.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z",
  youtube: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z",
  tiktok: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z",
  x: "M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5z",
  linkedin: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.5H3.6V9h3.5v11.5z",
  egyeb: "M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM13 6.3l1.4-1.4a4 4 0 0 1 5.7 5.7L18.7 12a1 1 0 1 1-1.4-1.4l1.4-1.4a2 2 0 0 0-2.9-2.9l-1.4 1.4A1 1 0 1 1 13 6.3zm-2 11.4-1.4 1.4a4 4 0 0 1-5.7-5.7L5.3 12a1 1 0 1 1 1.4 1.4l-1.4 1.4a2 2 0 0 0 2.9 2.9l1.4-1.4a1 1 0 1 1 1.4 1.4z",
};
const NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", x: "X", linkedin: "LinkedIn", egyeb: "Link" };

function Social({ site, className }: { site: Beallitasok; className: string }) {
  const links = site.social ?? [];
  if (!links.length) return null;
  return (
    <div className={className}>
      {links.map((l, i) => {
        const name = l.label || NAMES[l.platform];
        return (
          <a aria-label={name} title={name} href={l.url} key={l.id ?? i} rel="noopener" target="_blank">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d={ICONS[l.platform] ?? ICONS.egyeb} /></svg>
          </a>
        );
      })}
    </div>
  );
}

export function Footer({ site, edit = false, base = "" }: { site: Beallitasok; edit?: boolean; base?: string }) {
  const e = editor(edit, "beallitasok", site.styles as Looks);
  return (
    <>
      <footer className="mhk-site-footer" role="contentinfo" {...e.block("", undefined, "footer")}>
        <div className="mhk-wrap mhk-footer-grid">
          <div className="mhk-footer-logo">
            <Logo site={site} edit={edit} />
            {(edit || site.footerText) && <p {...e.f("footerText", true)}>{site.footerText}</p>}
            <Social site={site} className="mhk-footer-social" />
          </div>
          <div>
            <h4>Menü</h4>
            <ul className="mhk-list">
              {(site.nav ?? []).map((l, i) => <li key={l.id ?? i} {...e.item(`nav.${i}`)}><a href={`${base}#${l.target}`}><span {...e.f(`nav.${i}.label`)}>{l.label}</span></a></li>)}
            </ul>
          </div>
          <div>
            <h4 {...e.f("footerColumnTitle")}>{site.footerColumnTitle}</h4>
            <ul className="mhk-list">
              {(site.footerLinks ?? []).map((l, i) => <li key={l.id ?? i} {...e.item(`footerLinks.${i}`)}><a href={anchor(l, base)}><span {...e.f(`footerLinks.${i}.label`)}>{l.label}</span></a></li>)}
            </ul>
          </div>
          <div>
            <h4>Elérhetőség</h4>
            <ul className="mhk-list">
              {(edit || site.location) && <li {...e.f("location")}>{site.location}</li>}
              <li><a href={tel(site.phone)}><span {...e.f("phone")}>{site.phone}</span></a></li>
              {(edit || site.email) && <li><a href={`mailto:${site.email}`}><span {...e.f("email")}>{site.email}</span></a></li>}
            </ul>
          </div>
        </div>
        <div className="mhk-wrap mhk-footer-bottom">
          <span {...e.f("copyright")}>{site.copyright}</span>
          {DOC_LINKS.map((d) => <a key={d.href} href={d.href}>{d.label}</a>)}
        </div>
      </footer>
      <div className="mhk-mobile-call"><a href={tel(site.phone)}>{site.mobileCallLabel}: {site.phone}</a></div>
      <a aria-label={site.quickTabLabel ?? undefined} className="mhk-quick-tab" href={`${base}#jelentkezes`}>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><rect height="14" rx="1" width="18" x="3" y="5" /><path d="m3 7 9 6 9-6" /></svg> <span>{site.quickTabLabel}</span>
      </a>
      {site.cookieShow && (
        <div aria-label="Süti-tájékoztató" aria-live="polite" className="mhk-cookie" hidden id="mhk-cookie" role="dialog">
          <div className="mhk-cookie-inner">
            <div className="mhk-cookie-text">
              <strong>{site.cookieTitle}</strong>
              <p>{site.cookieText}</p>
            </div>
            <div className="mhk-cookie-actions">
              <button className="mhk-btn mhk-btn-ghost" data-mhk-consent="necessary" type="button"><span>{site.cookieNecessary}</span></button>
              <button className="mhk-btn mhk-btn-primary" data-mhk-consent="all" type="button"><span>{site.cookieAccept}</span></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
