import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getDocuments } from "@/lib/cms";
import { Footer, Header } from "../Chrome";

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

const DOCS = {
  aszf: { title: "Általános Szerződési Feltételek", ghost: "ÁSZF" },
  adatkezeles: { title: "Adatkezelési tájékoztató", ghost: "GDPR" },
  nyilatkozat: { title: "Beleegyező nyilatkozat", ghost: "GDPR" },
  impresszum: { title: "Impresszum", ghost: "Impresszum" },
  sutik: { title: "Süti tájékoztató", ghost: "Sütik" },
} as const;
type Slug = keyof typeof DOCS;
const isDoc = (s: string): s is Slug => Object.hasOwn(DOCS, s);

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  return isDoc(doc) ? { title: DOCS[doc].title } : {};
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

export default async function DocumentPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();
  const [{ site }, docs] = await Promise.all([getContent(), getDocuments()]);
  const text = docs[doc];
  if (!text) notFound();
  return (
    <>
      <Header site={site} base="/" />
      <main id="mhk-content">
        <section className="mhk-page-head" data-ghost={DOCS[doc].ghost}>
          <div className="mhk-wrap"><h1>{DOCS[doc].title}</h1></div>
        </section>
        <section className="mhk-sec">
          <div className="mhk-wrap" style={{ maxWidth: 860 }}><Text text={text} /></div>
        </section>
      </main>
      <Footer site={site} base="/" />
    </>
  );
}
