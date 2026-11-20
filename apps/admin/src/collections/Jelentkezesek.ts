import type { CollectionConfig, Field } from 'payload'

// the form is built in the admin (Űrlap global); the website validates required fields, so none are required here
const t = (name: string, label: string, _required = false): Field => ({ name, label, type: 'text' })
const yes = (name: string, label: string): Field => ({ name, label, type: 'checkbox', defaultValue: false })
const row = (...fields: Field[]): Field => ({ type: 'row', fields })
const box = (label: string, fields: Field[]): Field => ({ type: 'collapsible', label, fields })

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Jelentkezesek: CollectionConfig = {
  slug: 'jelentkezesek',
  labels: { singular: 'Jelentkezés', plural: 'Jelentkezések' },
  admin: {
    useAsTitle: 'jatekos_nev',
    defaultColumns: ['jatekos_nev', 'korosztaly', 'szulo_nev', 'email', 'telefon', 'statusz', 'createdAt'],
    listSearchableFields: ['jatekos_nev', 'szulo_nev', 'email', 'telefon', 'klub'],
    group: 'Jelentkezések',
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
      ({ data }) => {
        // list-view friendly full names
        if (data.jatekos_vezeteknev || data.jatekos_keresztnev) data.jatekos_nev = `${data.jatekos_vezeteknev ?? ''} ${data.jatekos_keresztnev ?? ''}`.trim()
        if (data.szulo_vezeteknev || data.szulo_keresztnev) data.szulo_nev = `${data.szulo_vezeteknev ?? ''} ${data.szulo_keresztnev ?? ''}`.trim()
        return data
      },
    ],
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
    { name: 'jatekos_nev', label: 'Játékos', type: 'text', admin: { hidden: true } },
    { name: 'szulo_nev', label: 'Szülő', type: 'text', admin: { hidden: true } },
    {
      name: 'valaszok',
      label: 'Összes válasz (az űrlap sorrendjében)',
      type: 'array',
      admin: { readOnly: true, initCollapsed: false },
      fields: [{ type: 'row', fields: [t('kerdes', 'Kérdés'), { name: 'valasz', label: 'Válasz', type: 'textarea' }] }],
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
