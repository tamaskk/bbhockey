import type { Endpoint } from 'payload'
import { emailFrom } from './email/template'

// POST /admin/api/email-teszt {to}: sends one plain test e-mail and answers with the mail provider's error, if any
// (the confirmation e-mail swallows errors so a submission never fails). Logged-in admins only.
export const emailTestEndpoint: Endpoint = {
  path: '/email-teszt',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Bejelentkezés szükséges' }] }, { status: 401 })
    const { to } = ((await req.json?.()) ?? {}) as { to?: string }
    const from = emailFrom()
    const config = { from: from ?? '(nincs)', smtp: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY) }
    try {
      const info = await req.payload.sendEmail({ to: to || req.user.email, subject: 'BB Skills e-mail teszt', text: 'Ha ezt megkaptad, az e-mail küldés működik.', ...(from && { from }) })
      return Response.json({ ok: true, config, info: JSON.parse(JSON.stringify(info ?? null)) })
    } catch (err) {
      return Response.json({ ok: false, config, error: (err as Error).message }, { status: 500 })
    }
  },
}
