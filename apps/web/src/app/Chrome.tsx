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
            </div>
          </nav>
          <div className="mhk-nav-backdrop" hidden />
          <div className="mhk-nav-cta">
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

const FacebookIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.4H7.8V13h2.7v8h3z" /></svg>
);
const InstagramIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zm0 2c-3.1 0-3.5 0-4.7.1-2.2.1-3 1-3.1 3.1-.1 1.2-.1 1.6-.1 4.6s0 3.4.1 4.6c.1 2.2 1 3 3.1 3.1 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3-1 3.1-3.1.1-1.2.1-1.6.1-4.6s0-3.4-.1-4.6c-.1-2.2-1-3-3.1-3.1-1.2-.1-1.6-.1-4.7-.1zm0 3.3a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2zm0 2a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.3-2.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" /></svg>
);

export function Footer({ site, edit = false, base = "" }: { site: Beallitasok; edit?: boolean; base?: string }) {
  const e = editor(edit, "beallitasok", site.styles as Looks);
  return (
    <>
      <footer className="mhk-site-footer" role="contentinfo" {...e.block("", undefined, "footer")}>
        <div className="mhk-wrap mhk-footer-grid">
          <div className="mhk-footer-logo">
            <Logo site={site} edit={edit} />
            {(edit || site.footerText) && <p {...e.f("footerText", true)}>{site.footerText}</p>}
            <div className="mhk-footer-social">
              {site.facebook && <a aria-label="Facebook oldalunk" href={site.facebook} rel="noopener" target="_blank"><FacebookIcon /></a>}
              {site.instagram && <a aria-label="Instagram oldalunk" href={site.instagram} rel="noopener" target="_blank"><InstagramIcon /></a>}
            </div>
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
