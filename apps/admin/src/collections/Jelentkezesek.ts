import type { CollectionAfterChangeHook, CollectionConfig, Field } from 'payload'
import { directImageUrl } from '../drive'
import { CONTACT_EMAIL, emailFrom, fill, recipient, renderEmail, type Submission } from '../email/template'
import { amount, payment, paymentText, reference } from '../payment'
import { LOCALES, type Locale } from '../localize'

const CONTACT_LABEL: Record<Locale, string> = { hu: 'Kapcsolattartó', en: 'Contact', de: 'Kontakt', sv: 'Kontakt' }

// the form is built in the admin (Űrlap global); the website validates required fields, so none are required here
const t = (name: string, label: string, _required = false): Field => ({ name, label, type: 'text' })
const yes = (name: string, label: string): Field => ({ name, label, type: 'checkbox', defaultValue: false })
const row = (...fields: Field[]): Field => ({ type: 'row', fields })
const box = (label: string, fields: Field[]): Field => ({ type: 'collapsible', label, fields })

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

// confirmation e-mail to the applicant (+ copy to the organisers), text from the "Visszaigazoló e-mail" page.
// A failed e-mail is logged and never fails the submission itself.
const sendConfirmation: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  try {
    const d = doc as Submission
    // e-mail texts in the language the applicant used on the site
    const locale = (LOCALES as readonly string[]).includes(String(d.nyelv)) ? (d.nyelv as Locale) : 'hu'
    const tpl = await req.payload.findGlobal({ slug: 'email', req, overrideAccess: true, locale })
    if (!tpl.enabled) return doc
    const form = await req.payload.findGlobal({ slug: 'urlap', req, overrideAccess: true, depth: 0, locale })
    const pay = payment(form as Record<string, unknown>, d, locale)
    const contactLabel = CONTACT_LABEL[locale]
    const subject = fill(tpl.subject ?? '', d).replace(/\s+/g, ' ').trim()
    const text = [fill(tpl.body ?? '', d), pay && paymentText(pay)].filter(Boolean).join('\n\n')
    const from = emailFrom()
    const replyTo = tpl.replyTo || CONTACT_EMAIL
    const html = renderEmail(tpl.body ?? '', { ...tpl, replyTo, contactLabel, logoUrl: tpl.logoUrl ? directImageUrl(tpl.logoUrl) : '' }, d, pay)
    const mail = { subject, text: `${text}\n\n${contactLabel}: ${replyTo}`, html, replyTo, ...(from && { from: `"${(tpl.fromName ?? '').replace(/"/g, '')}" <${from}>` }) }
    const to = recipient(d)
    if (to) await req.payload.sendEmail({ ...mail, to })
    else req.payload.logger.warn(`[email] no applicant address on submission ${doc.id}`)
    const copy = (tpl.notify ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    if (copy.length) await req.payload.sendEmail({ ...mail, to: copy, subject: `[Új jelentkezés] ${subject}`, ...(to && { replyTo: to }) })
  } catch (err) {
    req.payload.logger.error({ err, msg: `[email] confirmation for submission ${doc.id} failed` })
  }
  return doc
}

export const Jelentkezesek: CollectionConfig = {
  slug: 'jelentkezesek',
  labels: { singular: 'Jelentkezés', plural: 'Jelentkezések' },
  admin: {
    useAsTitle: 'jatekos_nev',
    defaultColumns: ['jatekos_nev', 'korosztaly', 'szulo_nev', 'email', 'telefon', 'csoport', 'statusz', 'fizetve', 'createdAt'],
    listSearchableFields: ['jatekos_nev', 'szulo_nev', 'email', 'telefon', 'klub'],
    group: 'Minden jelentkezés',
    // the list is the folder view (folders, drag and drop, export)
    components: { views: { list: { Component: '/views/Mappak#Mappak' } } },
  },
  access: {
    // only the website server (shared secret) or a logged-in admin may create
    create: ({ req }) => Boolean(req.user) || (!!process.env.SHARED_SECRET && req.headers.get('x-shared-secret') === process.env.SHARED_SECRET),
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // bank transfer reference and amount, fixed at submission (shown to the applicant and in the list)
        if (operation === 'create') {
          data.kozlemeny ||= reference(data)
          data.osszeg ||= amount(data)
        }
        // list-view friendly full names
        if (data.jatekos_vezeteknev || data.jatekos_keresztnev) data.jatekos_nev = `${data.jatekos_vezeteknev ?? ''} ${data.jatekos_keresztnev ?? ''}`.trim()
        if (data.szulo_vezeteknev || data.szulo_keresztnev) data.szulo_nev = `${data.szulo_vezeteknev ?? ''} ${data.szulo_keresztnev ?? ''}`.trim()
        return data
      },
    ],
    afterChange: [sendConfirmation],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'statusz',
          label: 'Státusz',
          type: 'select',
          defaultValue: 'uj',
          options: [
            { label: 'Új', value: 'uj' },
            { label: 'Feldolgozva', value: 'feldolgozva' },
            { label: 'Fizetve', value: 'fizetve' },
            { label: 'Lemondva', value: 'lemondva' },
          ],
          access: { create: isAdmin },
        },
        { name: 'megjegyzes', label: 'Belső megjegyzés', type: 'textarea', access: { create: isAdmin } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'fizetve', label: 'Fizetett', type: 'checkbox', defaultValue: false, access: { create: isAdmin } },
        { name: 'kozlemeny', label: 'Utalás közleménye', type: 'text' },
        { name: 'osszeg', label: 'Összeg', type: 'text' },
      ],
    },
    {
      name: 'nyelv',
      label: 'Nyelv',
      type: 'select',
      defaultValue: 'hu',
      options: [
        { label: 'Magyar', value: 'hu' },
        { label: 'English', value: 'en' },
        { label: 'Deutsch', value: 'de' },
        { label: 'Svenska', value: 'sv' },
      ],
      admin: { position: 'sidebar', description: 'Ezen a nyelven jelentkezett, ezen a nyelven kapta az e-mailt.' },
    },
    { name: 'csoport', label: 'Mappa', type: 'relationship', relationTo: 'csoportok', access: { create: isAdmin }, admin: { position: 'sidebar' } },
    { name: 'jatekos_nev', label: 'Játékos', type: 'text', admin: { hidden: true } },
    { name: 'szulo_nev', label: 'Szülő', type: 'text', admin: { hidden: true } },
    {
      name: 'valaszok',
      label: 'Összes válasz (az űrlap sorrendjében)',
      type: 'array',
      admin: { readOnly: true, initCollapsed: false },
      fields: [
        { type: 'row', fields: [t('kerdes', 'Kérdés'), { name: 'valasz', label: 'Válasz', type: 'textarea' }] },
        // form field name, so an edited answer can update its own column
        { name: 'mezo', type: 'text', admin: { hidden: true } },
      ],
    },
    t('jelentkezes', 'Jelentkezés típusa', true),
    box('Szülő / kapcsolattartó', [
      row(t('szulo_vezeteknev', 'Vezetéknév', true), t('szulo_keresztnev', 'Keresztnév', true)),
      row({ name: 'email', label: 'E-mail', type: 'email' }, t('telefon', 'Telefonszám', true)),
    ]),
    box('Számlázás', [
      row(t('szamlazasi_vezeteknev', 'Vezetéknév', true), t('szamlazasi_keresztnev', 'Keresztnév', true)),
      row(t('szamla_iranyitoszam', 'Irányítószám', true), t('szamla_varos', 'Város', true), t('szamla_orszag', 'Ország', true)),
      t('szamla_utca', 'Utca, házszám', true),
      t('szamla_tipus', 'Számla típusa', true),
      row(t('cegnev', 'Cégnév'), t('adoszam', 'Adószám')),
      t('szekhely', 'Székhely'),
    ]),
    box('Játékos', [
      row(t('jatekos_vezeteknev', 'Vezetéknév', true), t('jatekos_keresztnev', 'Keresztnév', true)),
      row(t('szuletesi_datum', 'Születési dátum', true), t('klub', 'Klub / csapat', true)),
      row(t('korosztaly', 'Korosztály', true), t('poszt', 'Poszt', true)),
      row(t('uto_fogas', 'Ütő fogás', true), t('tapasztalat', 'Mióta jégkorongozik', true)),
    ]),
    box('Ruhaméretek', [row(t('polomeret', 'Póló / pulóver', true), t('zokni', 'Zokni', true))]),
    box('Egészség / étkezés', [
      row(t('allergia', 'Allergia', true), t('allergia_reszletek', 'Mire allergiás')),
      t('etelintolerancia', 'Ételintolerancia'),
      t('etkezes', 'Speciális étkezés'),
      { name: 'egeszsegugyi_info', label: 'Egyéb egészségügyi információ', type: 'textarea' },
    ]),
    box('Vészhelyzeti kapcsolattartó', [
      row(t('veszhelyzeti_vezeteknev', 'Vezetéknév', true), t('veszhelyzeti_keresztnev', 'Keresztnév', true)),
      row(t('veszhelyzeti_kapcsolat', 'Kapcsolat a gyermekkel', true), t('veszhelyzeti_telefon', 'Telefonszám', true)),
    ]),
    box('Nyilatkozatok', [
      row(yes('feltetelek', 'Részvételi feltételek'), yes('adatkezeles', 'Adatkezelés'), yes('szuloi_hozzajarulas', 'Szülői hozzájárulás'), yes('foto_hozzajarulas', 'Fotó/videó')),
    ]),
  ],
}
