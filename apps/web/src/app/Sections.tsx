import "./sections.css";
import { Fragment, type ReactNode } from "react";
import { alt, img, initials, type Fooldal } from "@/lib/cms";

const d = (i: number) => (i ? ` mhk-reveal-d${Math.min(i, 3)}` : "");

// edit mode: data-f marks an element as inline-editable; its value is the field path in the "fooldal" global
type F = (path: string, multiline?: boolean) => Record<string, string>;

function Head({ title, highlight, sub, p, f }: { title: string; highlight?: string | null; sub?: string | null; p: string; f: F }) {
  return (
    <div className="mhk-section-head mhk-reveal">
      <div>
        <h2><span {...f(`${p}.title`)}>{title}</span> {highlight && <em {...f(`${p}.highlight`)}>{highlight}</em>}</h2>
        {sub && <p {...f(`${p}.subtitle`, true)}>{sub}</p>}
      </div>
    </div>
  );
}

function Btn({ b, primary, fp = {} }: { b?: { label?: string | null; href?: string | null } | null; primary?: boolean; fp?: Record<string, string> }) {
  if (!b?.label) return null;
  return <a className={`mhk-btn ${primary ? "mhk-btn-primary" : "mhk-btn-ghost"}`} href={b.href || "#jelentkezes"}><span {...fp}>{b.label}</span></a>;
}

const Avatar = ({ name }: { name: string }) => <span className="mhk-q-avatar"><span>{initials(name)}</span></span>;

export const SECTION_KEYS = ["marquee", "tabor", "napirend", "etlap", "rolunk", "velemenyek", "gyik", "kapcsolat"] as const;
type Key = (typeof SECTION_KEYS)[number];

export default function Sections({ home, edit = false }: { home: Fooldal; edit?: boolean }) {
  const { hero, marquee, tabor, napirend, eszkozok, etlap, rolunk, velemenyek, gyik, kapcsolat } = home;
  const quotes = velemenyek.items ?? [];
  const f: F = (path, multiline) => (edit ? { "data-f": path, ...(multiline && { "data-ml": "" }) } : {});
  // edit mode also renders hidden sections (dimmed) so they can be switched back on
  const on = (k: Key) => edit || !!home[k]?.show;
  const sec = (k: Key) => (edit ? { "data-section": k, "data-show": String(!!home[k]?.show) } : {});
  // saved order first, then any section missing from it (e.g. added later) in default order
  const order = [...new Set([...(home.order ?? []), ...SECTION_KEYS])].filter((k): k is Key => (SECTION_KEYS as readonly string[]).includes(k));

  const blocks: Record<Key, ReactNode> = {
    marquee: on("marquee") && !!marquee?.words?.length && (
        <div aria-hidden="true" className="mhk-marquee" {...sec("marquee")}>
          <div className="mhk-marquee-track">
            {[0, 1].map((k) => (
              <span key={k}>{marquee.words!.map((w, i) => <Fragment key={i}>{w} <i>{"//"}</i> </Fragment>)}</span>
            ))}
          </div>
        </div>
    ),

    tabor: on("tabor") && (
        <section className="mhk-sec mhk-section-light" id="taborrol" {...sec("tabor")}>
          <div className="mhk-wrap">
            <Head p="tabor" f={f} title={tabor.title} highlight={tabor.highlight} sub={tabor.subtitle} />
            <div className="mhk-brand-tiles">
              {(tabor.tiles ?? []).map((t, i) => (
                <a className={`mhk-brand-tile mhk-reveal${d(i)}`} href="#jelentkezes" key={t.id ?? i} style={{ backgroundImage: `url(${img(t.image)})` }}>
                  <div className="mhk-brand-tile-inner">
                    <h3 {...f(`tabor.tiles.${i}.title`)}>{t.title}</h3>
                    {t.text && <p {...f(`tabor.tiles.${i}.text`, true)}>{t.text}</p>}
                    {t.cta && <span className="mhk-tile-cta" {...f(`tabor.tiles.${i}.cta`)}>{t.cta}</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
    ),

    napirend: on("napirend") && (
        <section className="mhk-sec mhk-section-light" id="napirend" {...sec("napirend")}>
          <div className="mhk-wrap">
            <Head p="napirend" f={f} title={napirend.title} highlight={napirend.highlight} sub={napirend.subtitle} />
            <div className="mhk-process">
              {(napirend.items ?? []).map((s, i) => (
                <div className={`mhk-step mhk-reveal${d(i)}`} key={s.id ?? i}>
                  <span className="mhk-num" {...f(`napirend.items.${i}.time`)}>{s.time}</span>
                  <h3 {...f(`napirend.items.${i}.title`)}>{s.title}</h3>
                  {s.text && <p {...f(`napirend.items.${i}.text`, true)}>{s.text}</p>}
                </div>
              ))}
            </div>
            {(edit || eszkozok?.show) && !!eszkozok?.items?.length && (
              <div className="bb-gear-wrap">
                <h3 className="bb-gear-title"><span {...f("eszkozok.title")}>{eszkozok.title}</span> {eszkozok.highlight && <em {...f("eszkozok.highlight")}>{eszkozok.highlight}</em>}</h3>
                {eszkozok.subtitle && <p className="bb-gear-sub" {...f("eszkozok.subtitle", true)}>{eszkozok.subtitle}</p>}
                <div className="mhk-brand-tiles bb-gear">
                  {eszkozok.items.map((t, i) => (
                    <div className={`mhk-brand-tile mhk-reveal${d(i)}`} key={t.id ?? i} role="img" aria-label={alt(t.image)} style={{ backgroundImage: `url(${img(t.image)})` }}>
                      <div className="mhk-brand-tile-inner">
                        <h3 {...f(`eszkozok.items.${i}.title`)}>{t.title}</h3>
                        {t.text && <p {...f(`eszkozok.items.${i}.text`, true)}>{t.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
    ),

    etlap: on("etlap") && (
        <section className="mhk-sec mhk-section-alt" id="etlap" {...sec("etlap")}>
          <div className="mhk-wrap">
            <Head p="etlap" f={f} title={etlap.title} highlight={etlap.highlight} sub={etlap.subtitle} />
            <div className="bb-menu">
              {(etlap.days ?? []).map((m, i) => (
                <article className={`bb-menu-day mhk-reveal${d(i)}`} key={m.id ?? i}>
                  <header><b {...f(`etlap.days.${i}.day`)}>{m.day}</b>{m.date && <small {...f(`etlap.days.${i}.date`)}>{m.date}</small>}</header>
                  <dl>
                    {m.soup && <><dt>Leves</dt><dd {...f(`etlap.days.${i}.soup`)}>{m.soup}</dd></>}
                    {m.a && <><dt>„A” menü</dt><dd {...f(`etlap.days.${i}.a`)}>{m.a}</dd></>}
                    {m.b && <><dt>„B” menü</dt><dd {...f(`etlap.days.${i}.b`)}>{m.b}</dd></>}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>
    ),

    rolunk: on("rolunk") && (
        <section className="mhk-sec" id="rolunk" {...sec("rolunk")}>
          <div className="mhk-wrap mhk-about-split">
            {img(rolunk.image) && <div className="mhk-photo mhk-reveal"><img src={img(rolunk.image)} alt={alt(rolunk.image)} loading="lazy" /></div>}
            <div className="mhk-reveal mhk-reveal-d1">
              <h2><span {...f("rolunk.title")}>{rolunk.title}</span> {rolunk.highlight && <em {...f("rolunk.highlight")}>{rolunk.highlight}</em>}</h2>
              <div className="mhk-rte">{(rolunk.text ?? "").split(/\n\s*\n/).filter(Boolean).map((p, i) => p.startsWith("## ") ? <h3 key={i}>{p.slice(3)}</h3> : <p key={i}>{p}</p>)}</div>
              <div className="bb-coaches">
                {(rolunk.coaches ?? []).map((c, i) => (
                  <div className="bb-coach" key={c.id ?? i}>
                    {img(c.photo) ? <img className="bb-coach-photo" src={img(c.photo)} alt={c.name} loading="lazy" /> : <Avatar name={c.name} />}
                    <div><b {...f(`rolunk.coaches.${i}.name`)}>{c.name}</b>{c.role && <small {...f(`rolunk.coaches.${i}.role`)}>{c.role}</small>}{c.text && <p {...f(`rolunk.coaches.${i}.text`, true)}>{c.text}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
    ),

    velemenyek: on("velemenyek") && quotes.length > 0 && (
        <section className="mhk-sec" id="velemenyek" {...sec("velemenyek")}>
          <div className="mhk-wrap">
            <Head p="velemenyek" f={f} title={velemenyek.title} highlight={velemenyek.highlight} />
            <div className="mhk-quotes">
              <div className="mhk-q-main mhk-reveal">
                <blockquote>„<span {...f("velemenyek.items.0.quote", true)}>{quotes[0].quote}</span>”</blockquote>
                <div className="mhk-q-who"><Avatar name={quotes[0].name} /><div><b {...f("velemenyek.items.0.name")}>{quotes[0].name}</b><small {...f("velemenyek.items.0.who")}>{quotes[0].who}</small></div></div>
              </div>
              {quotes.length > 1 && (
                <div className="mhk-q-side">
                  {quotes.slice(1).map((q, i) => (
                    <div className={`mhk-q-card mhk-reveal${d(i + 1)}`} key={q.id ?? i}>
                      <blockquote>„<span {...f(`velemenyek.items.${i + 1}.quote`, true)}>{q.quote}</span>”</blockquote>
                      <div className="mhk-q-who"><Avatar name={q.name} /><div><b {...f(`velemenyek.items.${i + 1}.name`)}>{q.name}</b><small {...f(`velemenyek.items.${i + 1}.who`)}>{q.who}</small></div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
    ),

    gyik: on("gyik") && (
        <section className="mhk-sec mhk-section-light" id="gyik" {...sec("gyik")}>
          <div className="mhk-wrap">
            <Head p="gyik" f={f} title={gyik.title} highlight={gyik.highlight} />
            <div className="bb-faq">
              {(gyik.items ?? []).map((q, i) => (
                <details key={q.id ?? i} open={edit}><summary {...f(`gyik.items.${i}.q`)}>{q.q}</summary><p {...f(`gyik.items.${i}.a`, true)}>{q.a}</p></details>
              ))}
            </div>
          </div>
        </section>
    ),

    kapcsolat: on("kapcsolat") && (
        <section className="mhk-sec mhk-closing" id="kapcsolat" {...sec("kapcsolat")}>
          <div className="mhk-wrap mhk-closing-grid">
            <div className="mhk-reveal">
              <h2 {...f("kapcsolat.title", true)}>{kapcsolat.title.split("\n").map((l, i) => <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>)}</h2>
              {kapcsolat.text && <p {...f("kapcsolat.text", true)}>{kapcsolat.text}</p>}
            </div>
            <div className="mhk-closing-card mhk-reveal mhk-reveal-d1">
              {kapcsolat.cardTitle && <h3 {...f("kapcsolat.cardTitle")}>{kapcsolat.cardTitle}</h3>}
              <ul className="mhk-list">
                {(kapcsolat.rows ?? []).map((r, i) => <li key={r.id ?? i}><b {...f(`kapcsolat.rows.${i}.label`)}>{r.label}</b><span {...f(`kapcsolat.rows.${i}.value`)}>{r.value}</span></li>)}
              </ul>
              <Btn b={kapcsolat.button} primary fp={f("kapcsolat.button.label")} />
            </div>
          </div>
        </section>
    ),
  };

  return (
    <>
      <section className="mhk-hero-slider bb-hero" id="fooldal">
        <div className="mhk-hs-slide mhk-is-active">
          <div className="mhk-hs-bg" style={{ backgroundImage: `url(${img(hero.image)})` }} />
          <div className="mhk-wrap mhk-hs-inner">
            <h1><span {...f("hero.title")}>{hero.title}</span> {hero.highlight && <em {...f("hero.highlight")}>{hero.highlight}</em>}{hero.byline && <small className="bb-byline" {...f("hero.byline")}>{hero.byline}</small>}</h1>
            {hero.text && <p {...f("hero.text", true)}>{hero.text}</p>}
            <div className="mhk-hero-actions"><Btn b={hero.primary} primary fp={f("hero.primary.label")} /><Btn b={hero.secondary} fp={f("hero.secondary.label")} /></div>
          </div>
        </div>
        {!!hero.stats?.length && (
          <div className="mhk-hero-stats">
            {hero.stats.map((s, i) => (
              <div className="mhk-hstat" key={s.id ?? i}><span><b><span {...f(`hero.stats.${i}.value`)}>{s.value}</span> <span {...f(`hero.stats.${i}.unit`)}>{s.unit}</span></b>{s.label && <small {...f(`hero.stats.${i}.label`)}>{s.label}</small>}</span></div>
            ))}
          </div>
        )}
      </section>
      {order.map((k) => <Fragment key={k}>{blocks[k]}</Fragment>)}
    </>
  );
}
