// Builds the confirmation e-mail from the "Visszaigazoló e-mail" settings and one submission.
// Pure (no Payload imports): used by the send hook and by the live preview in the admin. Tested in template.test.ts.
type Answer = { kerdes?: string | null; valasz?: string | null }
export type Submission = Record<string, unknown> & { valaszok?: Answer[] | null }

export type Design = {
  logoUrl?: string | null; logoWidth?: number | null; headerTitle?: string | null
  pageBg?: string | null; cardBg?: string | null; headerBg?: string | null; headerText?: string | null
  textColor?: string | null; accent?: string | null; buttonText?: string | null
  font?: string | null; fontSize?: number | null; radius?: number | null
  answers?: 'table' | 'list' | 'none' | null
  buttonLabel?: string | null; buttonUrl?: string | null; footer?: string | null
  replyTo?: string | null
}

// replies and the contact line at the bottom of the e-mail go here unless the admin sets another reply address
export const CONTACT_EMAIL = 'bbyourskills@gmail.com'

// sender address (server only). shortcut: hello@bbskills.hu assumes bbskills.hu is verified in Resend; EMAIL_FROM overrides
export const emailFrom = () => process.env.EMAIL_FROM || process.env.SMTP_USER || (process.env.RESEND_API_KEY ? 'hello@bbskills.hu' : undefined)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// the applicant's address: the "email" field, or the first answer that is an e-mail address
export function recipient(doc: Submission): string | undefined {
  if (typeof doc.email === 'string' && EMAIL.test(doc.email.trim())) return doc.email.trim()
  return doc.valaszok?.map((a) => a.valasz?.trim() ?? '').find((v) => EMAIL.test(v))
}

const filled = (doc: Submission) => (doc.valaszok ?? []).filter((a) => a.valasz)
const answersText = (doc: Submission) => filled(doc).map((a) => `${a.kerdes}: ${a.valasz}`).join('\n')

const value = (doc: Submission, k: string) => {
  const v = doc[k]
  return typeof v === 'string' || typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'Igen' : 'Nem') : ''
}
const TOKEN = /\{\{\s*(\w+)\s*\}\}/g

// {{field}} -> that field's value, {{valaszok}} -> every answer; unknown names become empty
export const fill = (text: string, doc: Submission) => text.replace(TOKEN, (_, k: string) => (k === 'valaszok' ? answersText(doc) : value(doc, k)))

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const COLOR = /^#[0-9a-f]{6}$/i
const col = (v: string | null | undefined, d: string) => (v && COLOR.test(v) ? v : d)
const num = (v: number | null | undefined, d: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v!)) : d)
const FONTS: Record<string, string> = {
  arial: 'Arial, Helvetica, sans-serif', georgia: 'Georgia, "Times New Roman", serif', verdana: 'Verdana, Geneva, sans-serif',
  trebuchet: '"Trebuchet MS", Arial, sans-serif', tahoma: 'Tahoma, Geneva, sans-serif', courier: '"Courier New", monospace',
}
export const EMAIL_FONTS = [
  { label: 'Arial', value: 'arial' }, { label: 'Georgia (talpas)', value: 'georgia' }, { label: 'Verdana', value: 'verdana' },
  { label: 'Trebuchet', value: 'trebuchet' }, { label: 'Tahoma', value: 'tahoma' }, { label: 'Courier (írógép)', value: 'courier' },
]
const safeUrl = (u?: string | null) => (u && /^(https?:\/\/|mailto:|tel:)/i.test(u.trim()) ? u.trim() : '')

// HTML e-mail: table layout and inline styles, the only thing every mail client renders reliably
export function renderEmail(body: string, design: Design, doc: Submission): string {
  const d = {
    page: col(design.pageBg, '#f2f2f2'), card: col(design.cardBg, '#ffffff'), head: col(design.headerBg, '#111111'),
    headText: col(design.headerText, '#f4eb06'), text: col(design.textColor, '#222222'), accent: col(design.accent, '#f4eb06'),
    btnText: col(design.buttonText, '#111111'), font: FONTS[design.font ?? ''] ?? FONTS.arial,
    size: num(design.fontSize, 15, 11, 22), radius: num(design.radius, 8, 0, 30), logoW: num(design.logoWidth, 120, 30, 400),
  }
  const answersHtml = () => {
    const rows = filled(doc)
    if (design.answers === 'none' || !rows.length) return ''
    if (design.answers === 'list') return `<ul style="margin:8px 0;padding-left:20px">${rows.map((a) => `<li><b>${esc(a.kerdes ?? '')}:</b> ${esc(a.valasz ?? '')}</li>`).join('')}</ul>`
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;font-size:${d.size - 1}px">${rows
      .map((a, i) => `<tr style="background:${i % 2 ? 'transparent' : 'rgba(0,0,0,0.04)'}"><td style="padding:6px 10px;border-bottom:1px solid rgba(0,0,0,0.08);width:40%;opacity:.75">${esc(a.kerdes ?? '')}</td><td style="padding:6px 10px;border-bottom:1px solid rgba(0,0,0,0.08);font-weight:600">${esc(a.valasz ?? '')}</td></tr>`)
      .join('')}</table>`
  }
  // text with {{tokens}}: escaped, line breaks kept; {{valaszok}} becomes the answers block
  const content = body
    // the answers block is already a block: drop the line break right after it
    .split(/\{\{\s*valaszok\s*\}\}\n?/)
    .map((part) => esc(part.replace(TOKEN, (_, k: string) => value(doc, k))).replace(/\n/g, '<br>'))
    .join(answersHtml())
  const logo = safeUrl(design.logoUrl)
  const btnUrl = safeUrl(fill(design.buttonUrl ?? '', doc))
  const header = logo || design.headerTitle
    ? `<tr><td align="center" style="background:${d.head};padding:24px 24px 20px">${logo ? `<img src="${esc(logo)}" width="${d.logoW}" alt="" style="display:block;max-width:100%;height:auto;margin:0 auto${design.headerTitle ? ' 12px' : ''}">` : ''}${design.headerTitle ? `<div style="color:${d.headText};font-size:${d.size + 9}px;font-weight:800;letter-spacing:.5px">${esc(fill(design.headerTitle, doc))}</div>` : ''}</td></tr>`
    : ''
  const button = design.buttonLabel && btnUrl
    ? `<tr><td align="center" style="padding:0 28px 28px"><a href="${esc(btnUrl)}" style="display:inline-block;background:${d.accent};color:${d.btnText};text-decoration:none;font-weight:700;padding:13px 26px;border-radius:${Math.min(d.radius, 24)}px">${esc(fill(design.buttonLabel, doc))}</a></td></tr>`
    : ''
  const contact = design.replyTo && EMAIL.test(design.replyTo) ? design.replyTo : ''
  const footerLines = [
    design.footer && esc(fill(design.footer, doc)).replace(/\n/g, '<br>'),
    contact && `Kapcsolattartó: <a href="mailto:${esc(contact)}" style="color:${d.text}">${esc(contact)}</a>`,
  ].filter(Boolean)
  const footer = footerLines.length
    ? `<tr><td align="center" style="padding:16px 24px;font-size:${d.size - 3}px;color:${d.text};opacity:.6;border-top:1px solid rgba(0,0,0,0.08)">${footerLines.join('<br>')}</td></tr>`
    : ''
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:${d.page}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${d.page}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${d.card};border-radius:${d.radius}px;overflow:hidden;font-family:${d.font};font-size:${d.size}px;line-height:1.55;color:${d.text}">
${header}<tr><td style="padding:28px">${content}</td></tr>${button}${footer}
</table></td></tr></table></body></html>`
}
