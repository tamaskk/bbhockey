// Bank transfer details of a submission: the reference is the child's name and birth date ("Kiss Gábor 2019.07.01"),
// the amount comes from the chosen application type ("Egyedül jelentkezem – 160 000 Ft / fő").
type Doc = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function reference(doc: Doc): string {
  const name = [str(doc.jatekos_vezeteknev), str(doc.jatekos_keresztnev)].filter(Boolean).join(' ') || str(doc.jatekos_nev)
  const date = str(doc.szuletesi_datum).replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$1.$2.$3') // date input sends 2019-07-01
  return [name, date].filter(Boolean).join(' ')
}

export const amount = (doc: Doc): string => /(\d[\d\s.]*\d)\s*Ft/.exec(str(doc.jelentkezes))?.[1].replace(/\s+/g, ' ').concat(' Ft') ?? ''

export type Payment = { title: string; rows: [string, string][]; text: string }

// shown after sending the form and in the confirmation e-mail; settings from Jelentkezési űrlap → Fizetés
export function payment(form: Doc, doc: Doc): Payment | null {
  if (form.paymentShow === false || !str(form.paymentAccount)) return null
  const rows: [string, string][] = [
    ['Kedvezményezett', str(form.paymentHolder)],
    ['Számlaszám', str(form.paymentAccount)],
    ['Összeg', str(doc.osszeg) || amount(doc)],
    ['Közlemény', str(doc.kozlemeny) || reference(doc)],
  ]
  return { title: str(form.paymentTitle) || 'Fizetési adatok', rows: rows.filter(([, v]) => v), text: str(form.paymentText) }
}

export const paymentText = (p: Payment) => [p.title.toUpperCase(), ...p.rows.map(([k, v]) => `${k}: ${v}`), p.text].filter(Boolean).join('\n')
