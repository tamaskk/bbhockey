import "./sections.css";
import { Fragment, type ReactNode } from "react";
import { alt, img, initials, type Fooldal } from "@/lib/cms";
import { editor, type Ed } from "@/lib/edit";
import type { Looks } from "@/lib/style";
import TileGallery from "./TileGallery";

// a card's gallery photos for TileGallery (not in the editor: the thumbnails would cover the editable text)
const pics = (g: Parameters<typeof img>[0][] | null | undefined, edit: boolean) =>
  edit ? [] : (g ?? []).flatMap((m) => (img(m) ? [{ src: img(m)!, alt: alt(m) }] : []));

const d = (i: number) => (i ? ` mhk-reveal-d${Math.min(i, 3)}` : "");

function Head({ title, highlight, sub, p, e }: { title: string; highlight?: string | null; sub?: string | null; p: string; e: Ed }) {
  return (
    <div className="mhk-section-head mhk-reveal">
      <div>
        <h2><span {...e.f(`${p}.title`)}>{title}</span> {(e.edit || highlight) && <em {...e.f(`${p}.highlight`)}>{highlight}</em>}</h2>
        {(e.edit || sub) && <p {...e.f(`${p}.subtitle`, true)}>{sub}</p>}
      </div>
    </div>
  );
}

function Btn({ b, primary, p, e }: { b?: { label?: string | null; href?: string | null } | null; primary?: boolean; p: string; e: Ed }) {
  if (!b?.label && !e.edit) return null;
  return <a className={`mhk-btn ${primary ? "mhk-btn-primary" : "mhk-btn-ghost"}`} href={b?.href || "#jelentkezes"} {...e.move(p)}><span {...e.f(`${p}.label`)}>{b?.label}</span></a>;
}

// paragraphs separated by an empty line; edited as one text block
function Rte({ text, p, e }: { text?: string | null; p: string; e: Ed }) {
  if (e.edit) return <div className="mhk-rte" {...e.f(p, true)} style={{ whiteSpace: "pre-wrap", ...e.f(p).style }}>{text}</div>;
  return text ? <div className="mhk-rte" style={e.f(p).style}>{text.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}</div> : null;
}

type Block = NonNullable<Fooldal["blocks"]>[number];

const youtubeId = (url?: string | null) => /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/.exec(url ?? "")?.[1];

// sections added in the editor ("+ Új szekció"); they reuse the theme's classes so they match the rest of the page
function Custom({ b, p, e }: { b: Block; p: string; e: Ed }) {
  const sec = e.block(p, { key: `b:${b.id}`, show: !!b.show, custom: true });
  const id = `s-${b.id}`;
  const { f, item, img: im, edit } = e;
  switch (b.blockType) {
    case "szoveg":
      return (
        <section className="mhk-sec" id={id} {...sec}>
          <div className="mhk-wrap">
            <Head p={p} e={e} title={b.title} highlight={b.highlight} />
            <Rte text={b.text} p={`${p}.text`} e={e} />
            <div className="mhk-hero-actions" style={{ marginTop: 24 }}><Btn b={b.button} primary p={`${p}.button`} e={e} /></div>
          </div>
        </section>
      );
    case "kepszoveg":
      return (
        <section className="mhk-sec" id={id} {...sec}>
          <div className="mhk-wrap mhk-about-split">
            {(edit || img(b.image)) && (
              <div className="mhk-photo" style={{ order: b.imageRight ? 2 : 0 }} {...im(`${p}.image`)}><img src={img(b.image)} alt={alt(b.image)} loading="lazy" /></div>
            )}
            <div>
              <h2><span {...f(`${p}.title`)}>{b.title}</span> {(edit || b.highlight) && <em {...f(`${p}.highlight`)}>{b.highlight}</em>}</h2>
              <Rte text={b.text} p={`${p}.text`} e={e} />
              <div className="mhk-hero-actions" style={{ marginTop: 24 }}><Btn b={b.button} primary p={`${p}.button`} e={e} /></div>
            </div>
          </div>
        </section>
      );
    case "kartyak":
      return (
        <section className="mhk-sec mhk-section-light" id={id} {...sec}>
          <div className="mhk-wrap">
            <Head p={p} e={e} title={b.title} highlight={b.highlight} sub={b.subtitle} />
            <div className="mhk-brand-tiles">
              {(b.items ?? []).map((t, i) => (
                <div className="mhk-brand-tile" key={t.id ?? i} {...item(`${p}.items.${i}`)} {...im(`${p}.items.${i}.image`)} style={{ backgroundImage: img(t.image) ? `url(${img(t.image)})` : undefined, ...item(`${p}.items.${i}`).style }}>
                  <div className="mhk-brand-tile-inner">
                    <h3 {...f(`${p}.items.${i}.title`)}>{t.title}</h3>
                    {(edit || t.text) && <p {...f(`${p}.items.${i}.text`, true)}>{t.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "galeria":
      return (
        <section className="mhk-sec" id={id} {...sec}>
          <div className="mhk-wrap">
            <Head p={p} e={e} title={b.title} highlight={b.highlight} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {(b.images ?? []).map((g, i) => (
                <figure key={g.id ?? i} style={{ margin: 0, ...item(`${p}.images.${i}`).style }} {...item(`${p}.images.${i}`)}>
                  <div {...im(`${p}.images.${i}.image`)}><img src={img(g.image)} alt={alt(g.image) || g.caption || ""} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} /></div>
                  {(edit || g.caption) && <figcaption {...f(`${p}.images.${i}.caption`)}>{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      );
    case "video": {
      const vid = youtubeId(b.url);
      return (
        <section className="mhk-sec" id={id} {...sec}>
          <div className="mhk-wrap">
            <Head p={p} e={e} title={b.title} highlight={b.highlight} />
            {vid ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${vid}`} title={b.title} loading="lazy" allowFullScreen style={{ width: "100%", aspectRatio: "16 / 9", border: 0, pointerEvents: edit ? "none" : undefined }} />
            ) : edit && <p>Add meg a YouTube linket a ⚙ Beállításokban.</p>}
          </div>
        </section>
      );
    }
    case "gomb":
      return (
        <section className="mhk-sec mhk-closing" id={id} {...sec}>
          <div className="mhk-wrap" style={{ textAlign: "center" }}>
            <h2 {...f(`${p}.title`)}>{b.title}</h2>
            <Rte text={b.text} p={`${p}.text`} e={e} />
            <div className="mhk-hero-actions" style={{ justifyContent: "center", marginTop: 24 }}><Btn b={b.button} primary p={`${p}.button`} e={e} /></div>
          </div>
        </section>
      );
  }
}

const Avatar = ({ name }: { name: string }) => <span className="mhk-q-avatar"><span>{initials(name)}</span></span>;

export const SECTION_KEYS = ["marquee", "tabor", "napirend", "etlap", "rolunk", "velemenyek", "gyik", "kapcsolat"] as const;
type Key = (typeof SECTION_KEYS)[number];

export default function Sections({ home, looks, edit = false }: { home: Fooldal; looks?: Looks; edit?: boolean }) {
  const { hero, marquee, tabor, napirend, eszkozok, etlap, rolunk, velemenyek, gyik, kapcsolat } = home;
  const quotes = velemenyek.items ?? [];
  const e = editor(edit, "fooldal", looks);
  const { f, item, img: im } = e;
  // edit mode also renders hidden sections (dimmed) so they can be switched back on
  const on = (k: Key) => edit || !!home[k]?.show;
  const sec = (k: Key) => e.block(k, { key: k, show: !!home[k]?.show });
  const custom = home.blocks ?? [];
  const keys: string[] = [...SECTION_KEYS, ...custom.map((b) => `b:${b.id}`)];
  // the saved order is the list of sections on the page: a built-in section missing from it was deleted.
  // Custom sections missing from it (just added) go at the end. Same rule as admin src/views/ops.ts currentOrder.
  const saved = home.order?.length ? home.order : SECTION_KEYS;
  const order = [...new Set([...saved, ...custom.map((b) => `b:${b.id}`)])].filter((k) => keys.includes(k));

  const blocks: Record<string, ReactNode> = {
    ...Object.fromEntries(custom.map((b, i) => [`b:${b.id}`, (edit || b.show) && <Custom key={b.id} b={b} p={`blocks.${i}`} e={e} />])),
    marquee: on("marquee") && (edit || !!marquee?.words?.length) && (
      <div aria-hidden="true" className="mhk-marquee" {...sec("marquee")}>
        <div className="mhk-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>{(marquee?.words ?? []).map((w, i) => <Fragment key={i}>{w} <i>{"//"}</i> </Fragment>)}</span>
          ))}
        </div>
      </div>
    ),

    tabor: on("tabor") && (
      <section className="mhk-sec mhk-section-light" id="taborrol" {...sec("tabor")}>
        <div className="mhk-wrap">
          <Head p="tabor" e={e} title={tabor.title} highlight={tabor.highlight} sub={tabor.subtitle} />
          <div className="mhk-brand-tiles">
            {(tabor.tiles ?? []).map((t, i) => {
              const g = pics(t.gallery, edit);
              return (
                // a div with a covering link, so the gallery buttons are not nested inside the link
                <div className={`mhk-brand-tile mhk-reveal${d(i)}${g.length ? " bb-has-gallery" : ""}`} key={t.id ?? i} {...item(`tabor.tiles.${i}`)} {...im(`tabor.tiles.${i}.image`)} style={{ backgroundImage: `url(${img(t.image)})`, ...item(`tabor.tiles.${i}`).style }}>
                  {!edit && <a className="bb-tile-link" href="#jelentkezes" aria-label={`${t.title}: ${t.cta || "jelentkezés"}`} />}
                  <div className="mhk-brand-tile-inner">
                    <h3 {...f(`tabor.tiles.${i}.title`)}>{t.title}</h3>
                    {(edit || t.text) && <p {...f(`tabor.tiles.${i}.text`, true)}>{t.text}</p>}
                    {(edit || t.cta) && <span className="mhk-tile-cta" {...f(`tabor.tiles.${i}.cta`)}>{t.cta}</span>}
                  </div>
                  <TileGallery pics={g} title={t.title} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),

    napirend: on("napirend") && (
      <section className="mhk-sec mhk-section-light" id="napirend" {...sec("napirend")}>
        <div className="mhk-wrap">
          <Head p="napirend" e={e} title={napirend.title} highlight={napirend.highlight} sub={napirend.subtitle} />
          <div className="mhk-process">
            {(napirend.items ?? []).map((s, i) => (
              <div className={`mhk-step mhk-reveal${d(i)}`} key={s.id ?? i} {...item(`napirend.items.${i}`)}>
                <span className="mhk-num" {...f(`napirend.items.${i}.time`)}>{s.time}</span>
                <h3 {...f(`napirend.items.${i}.title`)}>{s.title}</h3>
                {(edit || s.text) && <p {...f(`napirend.items.${i}.text`, true)}>{s.text}</p>}
              </div>
            ))}
          </div>
          {(edit || eszkozok?.show) && (edit || !!eszkozok?.items?.length) && (
            <div className="bb-gear-wrap" {...e.block("eszkozok")} data-show={edit ? String(!!eszkozok?.show) : undefined}>
              <h3 className="bb-gear-title"><span {...f("eszkozok.title")}>{eszkozok?.title}</span> {(edit || eszkozok?.highlight) && <em {...f("eszkozok.highlight")}>{eszkozok?.highlight}</em>}</h3>
              {(edit || eszkozok?.subtitle) && <p className="bb-gear-sub" {...f("eszkozok.subtitle", true)}>{eszkozok?.subtitle}</p>}
              <div className="mhk-brand-tiles bb-gear">
                {(eszkozok?.items ?? []).map((t, i) => {
                  const g = pics(t.gallery, edit);
                  return (
                    <div className={`mhk-brand-tile mhk-reveal${d(i)}${g.length ? " bb-has-gallery" : ""}`} key={t.id ?? i} role={g.length ? undefined : "img"} aria-label={g.length ? undefined : alt(t.image)} {...item(`eszkozok.items.${i}`)} {...im(`eszkozok.items.${i}.image`)} style={{ backgroundImage: `url(${img(t.image)})`, ...item(`eszkozok.items.${i}`).style }}>
                      <div className="mhk-brand-tile-inner">
                        <h3 {...f(`eszkozok.items.${i}.title`)}>{t.title}</h3>
                        {(edit || t.text) && <p {...f(`eszkozok.items.${i}.text`, true)}>{t.text}</p>}
                      </div>
                      <TileGallery pics={g} title={t.title} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    ),

    etlap: on("etlap") && (
      <section className="mhk-sec mhk-section-alt" id="etlap" {...sec("etlap")}>
        <div className="mhk-wrap">
          <Head p="etlap" e={e} title={etlap.title} highlight={etlap.highlight} sub={etlap.subtitle} />
          <div className="bb-menu">
            {(etlap.days ?? []).map((m, i) => (
              <article className={`bb-menu-day mhk-reveal${d(i)}`} key={m.id ?? i} {...item(`etlap.days.${i}`)}>
                <header><b {...f(`etlap.days.${i}.day`)}>{m.day}</b>{(edit || m.date) && <small {...f(`etlap.days.${i}.date`)}>{m.date}</small>}</header>
                <dl>
                  {(edit || m.soup) && <><dt>Leves</dt><dd {...f(`etlap.days.${i}.soup`)}>{m.soup}</dd></>}
                  {(edit || m.a) && <><dt>„A” menü</dt><dd {...f(`etlap.days.${i}.a`)}>{m.a}</dd></>}
                  {(edit || m.b) && <><dt>„B” menü</dt><dd {...f(`etlap.days.${i}.b`)}>{m.b}</dd></>}
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
          {(edit || img(rolunk.image)) && <div className="mhk-photo mhk-reveal" {...im("rolunk.image")}><img src={img(rolunk.image)} alt={alt(rolunk.image)} loading="lazy" /></div>}
          <div className="mhk-reveal mhk-reveal-d1">
            <h2><span {...f("rolunk.title")}>{rolunk.title}</span> {(edit || rolunk.highlight) && <em {...f("rolunk.highlight")}>{rolunk.highlight}</em>}</h2>
            {/* paragraphs separated by an empty line, "## " starts a subheading; edited as one text block */}
            {edit ? (
              <div className="mhk-rte" {...f("rolunk.text", true)} style={{ whiteSpace: "pre-wrap", ...f("rolunk.text").style }}>{rolunk.text}</div>
            ) : (
              <div className="mhk-rte" style={f("rolunk.text").style}>{(rolunk.text ?? "").split(/\n\s*\n/).filter(Boolean).map((p, i) => p.startsWith("## ") ? <h3 key={i}>{p.slice(3)}</h3> : <p key={i}>{p}</p>)}</div>
            )}
            <div className="bb-coaches">
              {(rolunk.coaches ?? []).map((c, i) => (
                <div className="bb-coach" key={c.id ?? i} {...item(`rolunk.coaches.${i}`)}>
                  <span {...im(`rolunk.coaches.${i}.photo`)}>{img(c.photo) ? <img className="bb-coach-photo" src={img(c.photo)} alt={c.name} loading="lazy" /> : <Avatar name={c.name} />}</span>
                  <div><b {...f(`rolunk.coaches.${i}.name`)}>{c.name}</b>{(edit || c.role) && <small {...f(`rolunk.coaches.${i}.role`)}>{c.role}</small>}{(edit || c.text) && <p {...f(`rolunk.coaches.${i}.text`, true)}>{c.text}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),

    velemenyek: on("velemenyek") && (edit || quotes.length > 0) && (
      <section className="mhk-sec" id="velemenyek" {...sec("velemenyek")}>
        <div className="mhk-wrap">
          <Head p="velemenyek" e={e} title={velemenyek.title} highlight={velemenyek.highlight} />
          <div className="mhk-quotes">
            {quotes[0] && (
              <div className="mhk-q-main mhk-reveal" {...item("velemenyek.items.0")}>
                <blockquote>„<span {...f("velemenyek.items.0.quote", true)}>{quotes[0].quote}</span>”</blockquote>
                <div className="mhk-q-who"><Avatar name={quotes[0].name} /><div><b {...f("velemenyek.items.0.name")}>{quotes[0].name}</b><small {...f("velemenyek.items.0.who")}>{quotes[0].who}</small></div></div>
              </div>
            )}
            {quotes.length > 1 && (
              <div className="mhk-q-side">
                {quotes.slice(1).map((q, j) => {
                  const i = j + 1;
                  return (
                    <div className={`mhk-q-card mhk-reveal${d(i)}`} key={q.id ?? i} {...item(`velemenyek.items.${i}`)}>
                      <blockquote>„<span {...f(`velemenyek.items.${i}.quote`, true)}>{q.quote}</span>”</blockquote>
                      <div className="mhk-q-who"><Avatar name={q.name} /><div><b {...f(`velemenyek.items.${i}.name`)}>{q.name}</b><small {...f(`velemenyek.items.${i}.who`)}>{q.who}</small></div></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    gyik: on("gyik") && (
      <section className="mhk-sec mhk-section-light" id="gyik" {...sec("gyik")}>
        <div className="mhk-wrap">
          <Head p="gyik" e={e} title={gyik.title} highlight={gyik.highlight} />
          <div className="bb-faq">
            {(gyik.items ?? []).map((q, i) => (
              <details key={q.id ?? i} open={edit} {...item(`gyik.items.${i}`)}><summary {...f(`gyik.items.${i}.q`)}>{q.q}</summary><p {...f(`gyik.items.${i}.a`, true)}>{q.a}</p></details>
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
            {(edit || kapcsolat.text) && <p {...f("kapcsolat.text", true)}>{kapcsolat.text}</p>}
          </div>
          <div className="mhk-closing-card mhk-reveal mhk-reveal-d1">
            {(edit || kapcsolat.cardTitle) && <h3 {...f("kapcsolat.cardTitle")}>{kapcsolat.cardTitle}</h3>}
            <ul className="mhk-list">
              {(kapcsolat.rows ?? []).map((r, i) => <li key={r.id ?? i} {...item(`kapcsolat.rows.${i}`)}><b {...f(`kapcsolat.rows.${i}.label`)}>{r.label}</b><span {...f(`kapcsolat.rows.${i}.value`)}>{r.value}</span></li>)}
            </ul>
            <Btn b={kapcsolat.button} primary p="kapcsolat.button" e={e} />
          </div>
        </div>
      </section>
    ),
  };

  return (
    <>
      <section className="mhk-hero-slider bb-hero" id="fooldal" {...e.block("hero")}>
        <div className="mhk-hs-slide mhk-is-active">
          <div className="mhk-hs-bg" style={{ backgroundImage: `url(${img(hero.image)})` }} {...im("hero.image")} />
          <div className="mhk-wrap mhk-hs-inner">
            <h1><span {...f("hero.title")}>{hero.title}</span> {(edit || hero.highlight) && <em {...f("hero.highlight")}>{hero.highlight}</em>}{(edit || hero.byline) && <small className="bb-byline" {...f("hero.byline")}>{hero.byline}</small>}</h1>
            {(edit || hero.text) && <p {...f("hero.text", true)}>{hero.text}</p>}
            <div className="mhk-hero-actions"><Btn b={hero.primary} primary p="hero.primary" e={e} /><Btn b={hero.secondary} p="hero.secondary" e={e} /></div>
          </div>
        </div>
        {!!hero.stats?.length && (
          <div className="mhk-hero-stats">
            {hero.stats.map((s, i) => (
              <div className="mhk-hstat" key={s.id ?? i} {...item(`hero.stats.${i}`)}><span><b><span {...f(`hero.stats.${i}.value`)}>{s.value}</span> <span {...f(`hero.stats.${i}.unit`)}>{s.unit}</span></b>{(edit || s.label) && <small {...f(`hero.stats.${i}.label`)}>{s.label}</small>}</span></div>
            ))}
          </div>
        )}
      </section>
      {order.map((k) => <Fragment key={k}>{blocks[k]}</Fragment>)}
    </>
  );
}
