import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  // the page editor (/szerkeszto) is also noindex; the form API has nothing to crawl
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/szerkeszto", "/en/szerkeszto", "/de/szerkeszto", "/sv/szerkeszto", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
