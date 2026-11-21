import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import type { Beallitasok, Dokumentumok, Fooldal, Media, Urlap } from "../../../admin/src/payload-types";

export type { Beallitasok, Fooldal, Urlap };

// Server-to-server: on Vercel ADMIN_URL is the admin service binding (internal URL, runtime only).
export const CMS_API = `${process.env.ADMIN_URL ?? "http://localhost:3001"}/admin/api`;
// Browser-facing admin origin: empty on Vercel (same domain, admin under /admin); http://localhost:3001 in local dev.
export const ADMIN_PUBLIC_URL = process.env.ADMIN_PUBLIC_URL ?? "";

async function getGlobal<T>(slug: string): Promise<T> {
  const res = await fetch(`${CMS_API}/globals/${slug}?depth=1`);
  if (!res.ok) throw new Error(`CMS (${CMS_API}) answered ${res.status} for ${slug}`);
  return res.json();
}

// All page content in one cached read; the admin calls /api/revalidate after every save.
// connection(): read at request time, never at build, because the admin URL (a Vercel service binding) only exists at runtime.
export async function getContent() {
  await connection();
  return readContent();
}

async function readContent() {
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

// legal pages; read separately so the home page never waits for them
export async function getDocuments() {
  await connection();
  return readDocuments();
}

async function readDocuments() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");
  return getGlobal<Dokumentumok>("dokumentumok");
}

// Upload fields come back as a Media object (depth=1); local uploads have a relative URL (/admin/api/media/...).
export function img(m: string | Media | null | undefined): string | undefined {
  if (!m || typeof m === "string" || !m.url) return undefined;
  return m.url.startsWith("http") ? m.url : `${ADMIN_PUBLIC_URL}${m.url}`;
}

export function alt(m: string | Media | null | undefined): string {
  return m && typeof m !== "string" ? (m.alt ?? "") : "";
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
