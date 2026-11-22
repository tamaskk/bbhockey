import type { Endpoint } from 'payload'
import { directImageUrl } from './drive'
import { CONTACT_EMAIL, emailFrom, fill, recipient, renderEmail, type Submission } from './email/template'

// POST /admin/api/korlevel {ids, subject, body, buttonLabel?, buttonUrl?}: one e-mail per submission, each sent separately
// (nobody sees the other addresses), in the look of the "Visszaigazoló e-mail". {{tokens}} as there. Logged-in admins only.
// The admin page sends small batches and skips duplicate addresses, so one call stays well inside the function time limit.
export const korlevelEndpoint: Endpoint = {
  path: '/korlevel',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Bejelentkezés szükséges' }] }, { status: 401 })
    const { ids, subject, body, buttonLabel, buttonUrl } = ((await req.json?.()) ?? {}) as Record<string, unknown>
    if (!Array.isArray(ids) || !ids.length || ids.length > 25 || typeof subject !== 'string' || !subject.trim() || typeof body !== 'string' || !body.trim())
      return Response.json({ errors: [{ message: 'Tárgy, szöveg és 1–25 címzett kell' }] }, { status: 400 })
    const tpl = await req.payload.findGlobal({ slug: 'email', req, overrideAccess: true })
    const { docs } = await req.payload.find({ collection: 'jelentkezesek', where: { id: { in: ids } }, limit: ids.length, depth: 0, req, overrideAccess: true })
    const from = emailFrom()
    const replyTo = tpl.replyTo || CONTACT_EMAIL
    const design = { ...tpl, replyTo, answers: 'none' as const, buttonLabel: String(buttonLabel ?? ''), buttonUrl: String(buttonUrl ?? ''), logoUrl: tpl.logoUrl ? directImageUrl(tpl.logoUrl) : '' }
    const sent: string[] = []
    const failed: { id: string; error: string }[] = []
    for (const doc of docs) {
      const d = doc as unknown as Submission
      const to = recipient(d)
      if (!to) { failed.push({ id: String(doc.id), error: 'nincs e-mail cím' }); continue }
      try {
        await req.payload.sendEmail({
          to,
          subject: fill(subject, d).replace(/\s+/g, ' ').trim(),
          text: `${fill(body, d)}${design.buttonLabel && design.buttonUrl ? `\n\n${fill(design.buttonLabel, d)}: ${fill(design.buttonUrl, d)}` : ''}\n\n${replyTo}`,
          html: renderEmail(body, design, d, null),
          replyTo,
          ...(from && { from: `"${(tpl.fromName ?? '').replace(/"/g, '')}" <${from}>` }),
        })
        sent.push(String(doc.id))
      } catch (err) {
        failed.push({ id: String(doc.id), error: (err as Error).message })
      }
      // shortcut: fixed pause for Resend's default 2 e-mails/second limit; drop it with a higher plan
      await new Promise((r) => setTimeout(r, 550))
    }
    return Response.json({ sent, failed })
  },
}
