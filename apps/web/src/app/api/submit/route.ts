import { CMS_API, getContent } from "@/lib/cms";
import { allFields, isInput, isVisible } from "@/lib/form";
import { isLang, t } from "@/lib/i18n";

// admin-only or system columns a form field must never write
const RESERVED = new Set(["id", "_id", "createdAt", "updatedAt", "statusz", "megjegyzes", "valaszok", "jatekos_nev", "szulo_nev", "fizetve", "kozlemeny", "osszeg"]);

const fail = (message: string, status = 400) => Response.json({ success: false, data: { message } }, { status });

export async function POST(req: Request) {
  const fd = await req.formData();
  // the page language: form texts, error messages and the confirmation e-mail follow it
  const l = fd.get("nyelv");
  const lang = typeof l === "string" && isLang(l) ? l : "hu";
  const tr = t(lang);
  // honeypot filled in = bot: pretend success, store nothing
  if (fd.get("website")) return Response.json({ success: true, data: { message: tr.thanks } });

  const { form } = await getContent(lang);
  if (!form.open) return fail(form.closedText ?? tr.closed, 403);

  // only fields defined in the admin are accepted; values are trimmed and capped
  const values = (name: string) =>
    fd.getAll(name).filter((v): v is string => typeof v === "string").map((v) => v.trim().slice(0, 2000)).filter(Boolean);

  const data: Record<string, unknown> = {};
  const valaszok: { kerdes: string; valasz: string; mezo: string }[] = [];
  for (const f of allFields(form)) {
    if (!isInput(f) || !f.name || !isVisible(f, values)) continue;
    let v = values(f.name);
    // choices must be one of the configured options
    if (["select", "radio", "checkboxes"].includes(f.type)) v = v.filter((x) => f.options?.includes(x));
    if (f.type !== "checkboxes") v = v.slice(0, 1);
    if (f.required && !v.length) return fail(tr.required(f.label));
    // dates arrive as YYYY-MM-DD, so plain string comparison is a date comparison
    if (f.type === "date" && v[0] && ((f.minDate && v[0] < f.minDate) || (f.maxDate && v[0] > f.maxDate))) return fail(tr.dateRange(f.label, f.minDate, f.maxDate));

    const consent = f.type === "consent";
    if (!RESERVED.has(f.name)) data[f.name] = consent ? v[0] === "igen" : v.join(", ");
    valaszok.push({ kerdes: f.label, valasz: consent ? (v[0] === "igen" ? "Igen" : "Nem") : v.join(", "), mezo: f.name });
  }
  data.valaszok = valaszok;
  data.nyelv = lang;

  const res = await fetch(`${CMS_API}/jelentkezesek`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shared-secret": process.env.SHARED_SECRET ?? "" },
    body: JSON.stringify(data),
  }).catch(() => null);

  if (!res?.ok) {
    console.error("[submit] admin rejected", res?.status, res && (await res.text()).slice(0, 500));
    return fail(tr.saveFailed, 502);
  }
  // bank transfer details for the pop-up; the admin worked out the reference and amount (admin/src/payment.ts)
  const doc = ((await res.json().catch(() => ({}))) as { doc?: Record<string, unknown> }).doc ?? {};
  // [label, value, copy button]
  const rows = [
    [tr.pay.holder, form.paymentHolder, false],
    [tr.pay.account, form.paymentAccount, true],
    [tr.pay.amount, doc.osszeg, false],
    [tr.pay.reference, doc.kozlemeny, true],
  ].filter((r): r is [string, string, boolean] => typeof r[1] === "string" && !!r[1].trim());
  const payment = form.paymentShow !== false && form.paymentAccount ? { title: form.paymentTitle || tr.pay.title, rows, text: form.paymentText ?? "" } : undefined;
  return Response.json({ success: true, data: { message: form.successMessage, payment } });
}
