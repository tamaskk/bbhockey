import type { Field, GlobalConfig } from 'payload'
import { heading, image } from '../fields'
import { revalidateHook } from '../revalidate'

const CHOICE_TYPES = ['select', 'radio', 'checkboxes']
const INPUT_TYPES = ['text', 'email', 'tel', 'number', 'textarea']
const onlyFor = (types: string[]) => (_: unknown, sibling: { type?: string }) => types.includes(sibling?.type ?? '')

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'mezo'

type FormField = { name?: string | null; label?: string | null; type?: string | null }
type FormGroup = { fields?: FormField[] | null }

const fieldItem: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'label', label: 'Felirat', type: 'text', required: true, admin: { width: '60%' } },
      {
        name: 'type',
        label: 'Típus',
        type: 'select',
        required: true,
        defaultValue: 'text',
        admin: { width: '40%' },
        options: [
          { label: 'Rövid szöveg', value: 'text' },
          { label: 'E-mail', value: 'email' },
          { label: 'Telefonszám', value: 'tel' },
          { label: 'Dátum', value: 'date' },
          { label: 'Szám', value: 'number' },
          { label: 'Hosszú szöveg', value: 'textarea' },
          { label: 'Legördülő lista', value: 'select' },
          { label: 'Gombok (egy választható)', value: 'radio' },
          { label: 'Jelölőnégyzetek (több választható)', value: 'checkboxes' },
          { label: 'Nyilatkozat (pipa)', value: 'consent' },
          { label: 'Csak szöveg / megjegyzés', value: 'note' },
          { label: 'Kép', value: 'image' },
        ],
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'width',
        label: 'Szélesség',
        type: 'radio',
        defaultValue: 'half',
        options: [
          { label: 'Fél sor', value: 'half' },
          { label: 'Teljes sor', value: 'full' },
        ],
        admin: { width: '50%' },
      },
      { name: 'required', label: 'Kötelező', type: 'checkbox', defaultValue: false, admin: { width: '50%', condition: (_, s) => !['note', 'image'].includes(s?.type) } },
    ],
  },
  {
    name: 'options',
    label: 'Választási lehetőségek',
    type: 'text',
    hasMany: true,
    admin: { condition: onlyFor(CHOICE_TYPES), description: 'Írd be az opciót, majd Enter. Sorrend húzással állítható.' },
  },
  { name: 'placeholder', label: 'Minta szöveg a mezőben', type: 'text', admin: { condition: onlyFor(INPUT_TYPES) } },
  { name: 'link', label: 'Link (a felirat erre mutat)', type: 'text', admin: { condition: onlyFor(['consent']) } },
  { ...image('image', 'Kép'), admin: { condition: onlyFor(['image']) } } as Field,
  { name: 'help', label: 'Segítő szöveg (a mező alatt)', type: 'textarea', admin: { condition: (_, s) => s?.type !== 'image' } },
  {
    type: 'collapsible',
    label: 'Haladó: azonosító és feltétel',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'name',
        label: 'Azonosító',
        type: 'text',
        admin: { description: 'Üresen hagyva a feliratból készül. Ne változtasd, ha már jöttek jelentkezések – ezen a néven mentődik a válasz.' },
      },
      {
        type: 'row',
        fields: [
          { name: 'ifField', label: 'Csak akkor látszik, ha ez a mező (azonosító)…', type: 'text' },
          { name: 'ifValue', label: '…ezt az értéket kapta', type: 'text' },
        ],
      },
    ],
  },
]

export const Urlap: GlobalConfig = {
  slug: 'urlap',
  label: 'Jelentkezési űrlap',
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateHook],
    beforeChange: [
      ({ data }) => {
        // every field needs a unique key: it is the name the answer is stored under
        const used = new Set<string>()
        for (const g of (data.groups ?? []) as FormGroup[])
          for (const f of g.fields ?? []) {
            let n = slug(f.name || f.label || '')
            for (let i = 2; used.has(n); i++) n = `${slug(f.name || f.label || '')}_${i}`
            used.add(n)
            f.name = n
          }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Szövegek',
          fields: [
            {
              name: 'open',
              label: 'Jelentkezés nyitva',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Ha ki van kapcsolva, az űrlap helyett a lenti „lezárva” szöveg látszik.' },
            },
            { name: 'closedText', label: 'Szöveg, ha a jelentkezés lezárva', type: 'textarea', defaultValue: 'A jelentkezés jelenleg lezárult. Kövess minket a legfrissebb információkért!' },
            ...heading(),
            { name: 'intro', label: 'Bevezető', type: 'textarea' },
            { name: 'submitLabel', label: 'Küldés gomb felirata', type: 'text', defaultValue: 'Jelentkezés elküldése' },
            { name: 'successMessage', label: 'Sikeres küldés üzenet', type: 'textarea', defaultValue: 'Köszönjük, megkaptuk a jelentkezést! Hamarosan e-mailben jelentkezünk.' },
          ],
        },
        {
          label: 'Mezők',
          description: 'Csoportok és mezők: húzással rendezhetők, a „+” gombbal bővíthetők. Minden mezőnél állítható a szélesség (fél / teljes sor).',
          fields: [
            {
              name: 'groups',
              label: 'Csoportok',
              type: 'array',
              labels: { singular: 'Csoport', plural: 'Csoportok' },
              admin: { initCollapsed: true, components: { RowLabel: '/components/RowLabel#GroupRowLabel' } },
              fields: [
                { name: 'title', label: 'Csoport címe', type: 'text', required: true },
                {
                  name: 'fields',
                  label: 'Mezők',
                  type: 'array',
                  labels: { singular: 'Mező', plural: 'Mezők' },
                  admin: { initCollapsed: true, components: { RowLabel: '/components/RowLabel#FieldRowLabel' } },
                  fields: fieldItem,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
