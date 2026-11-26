import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getDocuments } from "@/lib/cms";
import { isLang, languageUrls, prefix, SITE_URL, t, type Lang } from "@/lib/i18n";
import { Footer, Header } from "../../Chrome";

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

// big faded word behind the title; titles come from lib/i18n
const DOCS = { aszf: "ÁSZF", adatkezeles: "GDPR", nyilatkozat: "GDPR", impresszum: "Impresszum", sutik: "Cookies" } as const;
type Slug = keyof typeof DOCS;
const isDoc = (s: string): s is Slug => Object.hasOwn(DOCS, s);

type Params = { params: Promise<{ lang: string; doc: string }> };
const langOf = (l: string): Lang => (isLang(l) ? l : "hu");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, doc } = await params;
  if (!isDoc(doc)) return {};
  const l = langOf(lang);
  return { title: t(l).docs[doc].title, alternates: { canonical: `${SITE_URL}${prefix(l)}/${doc}`, languages: languageUrls(`/${doc}`) } };
}

// empty line = paragraph, "## " / "### " = heading, "- " lines = list
function Text({ text }: { text: string }) {
  return (
    <div className="mhk-rte">
      {text.split(/\n\s*\n/).filter((b) => b.trim()).map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} style={{ fontSize: "1.6rem", margin: "2.5rem 0 1rem" }}>{b.slice(3)}</h2>;
        if (b.startsWith("### ")) return <h3 key={i}>{b.slice(4)}</h3>;
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- "))) return <ul key={i} style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}

export default async function DocumentPage({ params }: Params) {
  const { doc, lang: l } = await params;
  if (!isDoc(doc)) notFound();
  const lang = langOf(l);
  const [{ site }, docs] = await Promise.all([getContent(lang), getDocuments(lang)]);
  const text = docs[doc];
  if (!text) notFound();
  return (
    <>
      <Header site={site} lang={lang} base={`${prefix(lang)}/`} />
      <main id="mhk-content">
        <section className="mhk-page-head" data-ghost={DOCS[doc]}>
          <div className="mhk-wrap"><h1>{t(lang).docs[doc].title}</h1></div>
        </section>
        <section className="mhk-sec">
          <div className="mhk-wrap" style={{ maxWidth: 860 }}><Text text={text} /></div>
        </section>
      </main>
      <Footer site={site} lang={lang} base={`${prefix(lang)}/`} />
    </>
  );
}
