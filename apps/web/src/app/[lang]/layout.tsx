import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, img } from "@/lib/cms";
import { isLang, LANGS, languageUrls, OG_LOCALE, prefix, SITE_URL, type Lang } from "@/lib/i18n";
import { fontName, fontsHref, type Looks } from "@/lib/style";

const css = [
  "/wp-content/themes/hello-elementor/assets/css/reset.css",
  "/wp-content/themes/hello-elementor/assets/css/theme.css",
  "/wp-content/plugins/elementor/assets/css/frontend.min.css",
  "/wp-content/uploads/elementor/css/post-6.css",
  "/wp-content/plugins/mhk-core/assets/css/fonts.css",
  "/wp-content/plugins/mhk-core/assets/css/mhk.css",
  "/wp-content/uploads/elementor/css/post-123.css",
  "/wp-content/uploads/elementor/css/base-desktop.css",
  "/wp-content/uploads/elementor/css/base-mobile.css",
  "/bb-light.css",
];

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

// /en, /de, /sv are real paths; Hungarian is served at "/" (the proxy rewrites it to /hu)
const langOf = async (params: Promise<{ lang: string }>): Promise<Lang> => {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
};

// the four language roots are known at build time
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const lang = await langOf(params);
  const { site } = await getContent(lang);
  const icon = img(site.favicon) ?? img(site.logo);
  const og = img(site.ogImage);
  const url = `${SITE_URL}${prefix(lang)}`;
  return {
    metadataBase: new URL(SITE_URL),
    // legal pages: "ÁSZF | BB Hockey Skills"
    title: { default: site.siteTitle, template: `%s | ${site.name}` },
    description: site.description ?? undefined,
    icons: icon ? { icon, apple: icon } : undefined,
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      title: site.siteTitle,
      description: site.description ?? undefined,
      locale: OG_LOCALE[lang],
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      images: og,
    },
    // canonical address + the other language versions
    alternates: { canonical: url, languages: languageUrls() },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await langOf(params);
  const { site } = await getContent(lang);
  // brand colours from the admin override the stylesheet defaults
  // fonts chosen in the admin: theme-wide heading/text font + any font used by a single element
  const fh = fontName(site.fontHeading), fb = fontName(site.fontBody);
  const fonts = fontsHref([site.fontHeading, site.fontBody, ...Object.values((site.styles ?? {}) as Looks).map((l) => l?.font)]);
  const colors = `:root{--mhk-accent:${site.accent};--mhk-accent-2:${site.accentLight};--mhk-accent-dk:${site.accentDark}${fh ? `;--bb-fh:"${fh}"` : ""}${fb ? `;--bb-fb:"${fb}"` : ""}}`;
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
        {fonts && <link rel="stylesheet" href={fonts} precedence="default" />}
        <style precedence="high" href="bb-colors">{colors}</style>
        {/* apply the saved theme before first paint (no dark flash for light-mode users) */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("bb-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}` }} />
      </head>
      <body className="home mhk-site elementor-default elementor-page">
        {/* splash: pulsing logo until the page has loaded; CSS removes it after 2s even without JS */}
        <div className="bb-splash" aria-hidden="true">
          {img(site.logo) ? <img src={img(site.logo)} alt="" width={120} height={120} /> : <b>{site.name}</b>}
        </div>
        <script dangerouslySetInnerHTML={{ __html: `addEventListener("load",()=>document.documentElement.dataset.loaded="")` }} />
        {children}
      </body>
    </html>
  );
}
