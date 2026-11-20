import { cacheLife, cacheTag } from "next/cache";
import type { Beallitasok, Fooldal, Media, Urlap } from "../../../admin/src/payload-types";

export type { Beallitasok, Fooldal, Urlap };

export const ADMIN_URL = process.env.ADMIN_URL ?? "http://localhost:3001";

async function getGlobal<T>(slug: string): Promise<T> {
  const res = await fetch(`${ADMIN_URL}/api/globals/${slug}?depth=1`);
  if (!res.ok) throw new Error(`CMS (${ADMIN_URL}) answered ${res.status} for ${slug}`);
  return res.json();
}

// All page content in one cached read; the admin calls /api/revalidate after every save.
export async function getContent() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");
  const [site, home, form] = await Promise.all([
    getGlobal<Beallitasok>("beallitasok"),
    getGlobal<Fooldal>("fooldal"),
    getGlobal<Urlap>("urlap"),
  ]);
  return { site, home, form };
}

// Upload fields come back as a Media object (depth=1); local uploads have a relative URL on the admin host.
export function img(m: string | Media | null | undefined): string | undefined {
  if (!m || typeof m === "string" || !m.url) return undefined;
  return m.url.startsWith("http") ? m.url : `${ADMIN_URL}${m.url}`;
}

export function alt(m: string | Media | null | undefined): string {
  return m && typeof m !== "string" ? (m.alt ?? "") : "";
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
