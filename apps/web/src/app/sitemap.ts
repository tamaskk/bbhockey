import type { MetadataRoute } from "next";
import { LANGS, languageUrls, prefix, SITE_URL } from "@/lib/i18n";
import { DOC_LINKS } from "./Chrome";

// home page + the legal pages linked in the footer, each in every language
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...DOC_LINKS.map((d) => `/${d}`)].flatMap((path) =>
    LANGS.map((l) => ({
      url: `${SITE_URL}${prefix(l)}${path}` || SITE_URL,
      changeFrequency: "weekly" as const,
      priority: path ? 0.3 : 1,
      alternates: { languages: languageUrls(path) },
    })),
  );
}
