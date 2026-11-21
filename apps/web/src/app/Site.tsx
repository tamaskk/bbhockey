import Script from "next/script";
import { getContent } from "@/lib/cms";
import { Footer, Header } from "./Chrome";
import Jelentkezes from "./Jelentkezes";
import Sections from "./Sections";
import type { Looks } from "@/lib/style";
import { t, type Lang } from "@/lib/i18n";

export default async function Site({ lang, edit = false }: { lang: Lang; edit?: boolean }) {
  const { site, home, form } = await getContent(lang);
  const tr = t(lang);
  // texts and language for the theme script (form messages, payment pop-up)
  const mhk = { ajax: "/api/submit", nonce: "", lang, t: { error: tr.saveFailed, thanks: tr.thanks, copy: tr.copy, copied: tr.copied, sending: tr.sending, network: tr.network, emailed: tr.emailed, ok: tr.ok } };
  return (
    <>
      <Header site={site} lang={lang} edit={edit} />
      <main id="mhk-content">
        <Sections home={home} lang={lang} looks={site.styles as Looks} edit={edit} />
        <Jelentkezes form={form} lang={lang} privacyUrl={site.privacyUrl} looks={site.styles as Looks} edit={edit} />
      </main>
      <Footer site={site} lang={lang} edit={edit} />
      <Script id="mhk-config" strategy="beforeInteractive">
        {`window.MHK=${JSON.stringify(mhk)};`}
      </Script>
      <Script src="/wp-content/plugins/mhk-core/assets/js/mhk.js" strategy="afterInteractive" />
      {/* conditional form fields: enable the ones whose trigger field has the chosen value (3 passes for chained conditions) */}
      {/* edit mode shows every conditional field, so the toggling script stays off */}
      {!edit && (
        <Script id="bb-form-if" strategy="afterInteractive">
          {`(()=>{const f=document.querySelector('.bb-form');if(!f)return;const s=()=>{for(let i=0;i<3;i++){const d=new FormData(f);f.querySelectorAll('fieldset[data-if]').forEach(x=>{x.disabled=!d.getAll(x.dataset.if).includes(x.dataset.ifValue)})}};f.addEventListener('change',s);f.addEventListener('reset',()=>setTimeout(s));s()})();`}
        </Script>
      )}
      {/* scrollspy: highlight the nav link of the section in the middle of the viewport */}
      <Script id="bb-scrollspy" strategy="afterInteractive">
        {`(()=>{const l=[...document.querySelectorAll('#mhk-menu a[href^="#"]')];const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)l.forEach(a=>a.classList.toggle('mhk-active',a.hash==='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});l.forEach(a=>{const s=document.querySelector(a.hash);if(s)io.observe(s)})})();`}
      </Script>
    </>
  );
}
