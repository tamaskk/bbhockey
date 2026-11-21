import { isLang } from "@/lib/i18n";
import Site from "../Site";

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  return <Site lang={isLang(lang) ? lang : "hu"} />;
}
