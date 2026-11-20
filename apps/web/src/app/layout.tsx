import type { Metadata } from "next";
import { getContent, img } from "@/lib/cms";

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

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  const icon = img(site.favicon) ?? img(site.logo);
  const og = img(site.ogImage);
  return {
    title: site.siteTitle,
    description: site.description ?? undefined,
    icons: icon ? { icon, apple: icon } : undefined,
    openGraph: og ? { images: og } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { site } = await getContent();
  // brand colours from the admin override the stylesheet defaults
  const colors = `:root{--mhk-accent:${site.accent};--mhk-accent-2:${site.accentLight};--mhk-accent-dk:${site.accentDark}}`;
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        {css.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
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
