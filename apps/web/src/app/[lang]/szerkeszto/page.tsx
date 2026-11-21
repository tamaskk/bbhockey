import type { Metadata } from "next";
import { ADMIN_PUBLIC_URL } from "@/lib/cms";
import { isLang } from "@/lib/i18n";
import Site from "../../Site";
import EditMode from "./EditMode";

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The site in edit mode; shown inside the admin's "Oldalszerkesztő" iframe, which does the saving.
export default async function Szerkeszto({ params }: PageProps<"/[lang]/szerkeszto">) {
  const { lang } = await params;
  return (
    <>
      <Site edit lang={isLang(lang) ? lang : "hu"} />
      <EditMode adminOrigin={ADMIN_PUBLIC_URL && new URL(ADMIN_PUBLIC_URL).origin} />
    </>
  );
}
