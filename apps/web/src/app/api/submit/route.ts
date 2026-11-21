import { CMS_API, getContent } from "@/lib/cms";
import { allFields, isInput, isVisible } from "@/lib/form";

// admin-only or system columns a form field must never write
const RESERVED = new Set(["id", "_id", "createdAt", "updatedAt", "statusz", "megjegyzes", "valaszok", "jatekos_nev", "szulo_nev", "fizetve", "kozlemeny", "osszeg"]);

const fail = (message: string, status = 400) => Response.json({ success: false, data: { message } }, { status });

export async function POST(req: Request) {
  const fd = await req.formData();
  // honeypot filled in = bot: pretend success, store nothing
  if (fd.get("website")) return Response.json({ success: true, data: { message: "Köszönjük!" } });

  const { form } = await getContent();
  if (!form.open) return fail(form.closedText ?? "A jelentkezés lezárult.", 403);

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
    if (f.required && !v.length) return fail(`Kérjük, töltsd ki: ${f.label}`);

    const consent = f.type === "consent";
    if (!RESERVED.has(f.name)) data[f.name] = consent ? v[0] === "igen" : v.join(", ");
    valaszok.push({ kerdes: f.label, valasz: consent ? (v[0] === "igen" ? "Igen" : "Nem") : v.join(", "), mezo: f.name });
  }
  data.valaszok = valaszok;

  const res = await fetch(`${CMS_API}/jelentkezesek`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shared-secret": process.env.SHARED_SECRET ?? "" },
    body: JSON.stringify(data),
  }).catch(() => null);

  if (!res?.ok) {
    console.error("[submit] admin rejected", res?.status, res && (await res.text()).slice(0, 500));
    return fail("A jelentkezést most nem sikerült elmenteni. Kérjük, próbáld újra, vagy írj nekünk e-mailt.", 502);
  }
  // bank transfer details for the pop-up; the admin worked out the reference and amount (admin/src/payment.ts)
  const doc = ((await res.json().catch(() => ({}))) as { doc?: Record<string, unknown> }).doc ?? {};
  const rows = [
    ["Kedvezményezett", form.paymentHolder],
    ["Számlaszám", form.paymentAccount],
    ["Összeg", doc.osszeg],
    ["Közlemény", doc.kozlemeny],
  ].filter((r): r is [string, string] => typeof r[1] === "string" && !!r[1].trim());
  const payment = form.paymentShow !== false && form.paymentAccount ? { title: form.paymentTitle || "Fizetési adatok", rows, text: form.paymentText ?? "" } : undefined;
  return Response.json({ success: true, data: { message: form.successMessage, payment } });
}
