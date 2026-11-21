import type { Block, Field, GlobalConfig } from 'payload'
import { heading, image, show } from '../fields'
import { revalidateHook } from '../revalidate'

const button = (name: string, label: string) => ({
  name,
  label,
  type: 'group' as const,
  fields: [
    {
      type: 'row' as const,
      fields: [
        { name: 'label', label: 'Felirat', type: 'text' as const },
        { name: 'href', label: 'Link (pl. #jelentkezes vagy https://…)', type: 'text' as const },
      ],
    },
  ],
})

// extra photos on a card: the first two show in its bottom-right corner, a click opens all of them large
const gallery: Field = {
  name: 'gallery',
  label: 'Galéria (max 10 kép)',
  type: 'upload',
  relationTo: 'media',
  hasMany: true,
  maxRows: 10,
  admin: { description: 'A kártya jobb alsó sarkában az első 2 kép látszik; rákattintva nagyban lapozható az összes.' },
}

const subtitle = { name: 'subtitle', label: 'Alcím / bevezető', type: 'textarea' as const }
const text = { name: 'text', label: 'Szöveg (új bekezdés: üres sor)', type: 'textarea' as const }

// Sections the editor can add anywhere on the page ("+ Új szekció"), any number of times.
export const customBlocks: Block[] = [
  { slug: 'szoveg', labels: { singular: 'Szöveg', plural: 'Szövegek' }, fields: [show, ...heading(), text, button('button', 'Gomb')] },
  {
    slug: 'kepszoveg',
    labels: { singular: 'Kép + szöveg', plural: 'Kép + szöveg' },
    fields: [show, ...heading(), text, image('image', 'Kép'), { name: 'imageRight', label: 'Kép a jobb oldalon', type: 'checkbox' }, button('button', 'Gomb')],
  },
  {
    slug: 'kartyak',
    labels: { singular: 'Kártyák', plural: 'Kártyák' },
    fields: [
      show,
      ...heading(),
      subtitle,
      { name: 'items', label: 'Kártyák', type: 'array', fields: [{ name: 'title', label: 'Cím', type: 'text', required: true }, { name: 'text', label: 'Szöveg', type: 'textarea' }, image('image', 'Kép')] },
    ],
  },
  {
    slug: 'galeria',
    labels: { singular: 'Képgaléria', plural: 'Képgalériák' },
    fields: [show, ...heading(), { name: 'images', label: 'Képek', type: 'array', fields: [image('image', 'Kép'), { name: 'caption', label: 'Képaláírás', type: 'text' }] }],
  },
  {
    slug: 'video',
    labels: { singular: 'Videó', plural: 'Videók' },
    fields: [
      show,
      ...heading(),
      {
        name: 'url',
        label: 'YouTube link',
        type: 'text',
        validate: (v: string | null | undefined) => !v || /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(v) || 'YouTube link kell (https://www.youtube.com/…)',
      },
    ],
  },
  { slug: 'gomb', labels: { singular: 'Felhívás gombbal', plural: 'Felhívások' }, fields: [show, { name: 'title', label: 'Cím', type: 'text', required: true }, text, button('button', 'Gomb')] },
]

export const Fooldal: GlobalConfig = {
  slug: 'fooldal',
  label: 'Főoldal tartalma',
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateHook] },
  fields: [
    // section order, set by drag and drop in the page editor (Oldalszerkesztő)
    { name: 'order', type: 'text', hasMany: true, admin: { hidden: true } },
    { name: 'blocks', label: 'Saját szekciók', type: 'blocks', blocks: customBlocks, admin: { description: 'A szerkesztőben a „+ Új szekció” gombbal adhatók hozzá.' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Fejléc kép (hero)',
          name: 'hero',
          fields: [
            ...heading(),
            { name: 'byline', label: 'Kis felirat a cím alatt (pl. by BB)', type: 'text' },
            { name: 'text', label: 'Szöveg', type: 'textarea' },
            image('image', 'Háttérkép', true),
            { type: 'row', fields: [button('primary', 'Fő gomb'), button('secondary', 'Második gomb')] },
            {
              name: 'stats',
              label: 'Statisztika dobozok',
              type: 'array',
              maxRows: 6,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', label: 'Szám / érték', type: 'text', required: true },
                    { name: 'unit', label: 'Egység', type: 'text' },
                    { name: 'label', label: 'Alatta kis szöveg', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Futó szalag',
          name: 'marquee',
          fields: [show, { name: 'words', label: 'Szavak', type: 'text', hasMany: true }],
        },
        {
          label: 'Táborról',
          name: 'tabor',
          fields: [
            show,
            ...heading(),
            subtitle,
            {
              name: 'tiles',
              label: 'Kártyák',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'title', label: 'Cím', type: 'text', required: true }, { name: 'cta', label: 'Link felirat', type: 'text' }] },
                { name: 'text', label: 'Szöveg', type: 'textarea' },
                image('image', 'Kép', true),
                gallery,
              ],
            },
          ],
        },
        {
          label: 'Napirend',
          name: 'napirend',
          fields: [
            show,
            ...heading(),
            subtitle,
            {
              name: 'items',
              label: 'Programpontok',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'time', label: 'Időpont', type: 'text', required: true }, { name: 'title', label: 'Cím', type: 'text', required: true }] },
                { name: 'text', label: 'Leírás', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Napirend: fotók',
          name: 'eszkozok',
          fields: [
            show,
            ...heading(),
            subtitle,
            {
              name: 'items',
              label: 'Kártyák (fotó + szöveg)',
              type: 'array',
              fields: [
                { name: 'title', label: 'Cím', type: 'text', required: true },
                { name: 'text', label: 'Szöveg', type: 'textarea' },
                image('image', 'Fotó', true),
                gallery,
              ],
            },
          ],
        },
        {
          label: 'Étlap',
          name: 'etlap',
          fields: [
            show,
            ...heading(),
            subtitle,
            {
              name: 'days',
              label: 'Napok',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'day', label: 'Nap neve', type: 'text', required: true }, { name: 'date', label: 'Dátum', type: 'text' }] },
                { name: 'soup', label: 'Leves', type: 'text' },
                { type: 'row', fields: [{ name: 'a', label: '„A” menü', type: 'text' }, { name: 'b', label: '„B” menü', type: 'text' }] },
              ],
            },
          ],
        },
        {
          label: 'Rólunk',
          name: 'rolunk',
          fields: [
            show,
            ...heading(),
            { name: 'text', label: 'Szöveg (új bekezdés: üres sor, alcím: "## " a sor elején)', type: 'textarea' },
            image('image', 'Kép'),
            {
              name: 'coaches',
              label: 'Edzők',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'name', label: 'Név', type: 'text', required: true }, { name: 'role', label: 'Szerep', type: 'text' }] },
                { name: 'text', label: 'Bemutatkozás', type: 'textarea' },
                image('photo', 'Fotó (ha nincs, a monogram látszik)'),
              ],
            },
          ],
        },
        {
          label: 'Vélemények',
          name: 'velemenyek',
          fields: [
            show,
            ...heading(),
            {
              name: 'items',
              label: 'Vélemények (az első nagyban jelenik meg)',
              type: 'array',
              fields: [
                { type: 'row', fields: [{ name: 'name', label: 'Név', type: 'text', required: true }, { name: 'who', label: 'Ki ő (pl. U12 szülő)', type: 'text' }] },
                { name: 'quote', label: 'Vélemény', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'GYIK',
          name: 'gyik',
          fields: [
            show,
            ...heading(),
            {
              name: 'items',
              label: 'Kérdések',
              type: 'array',
              fields: [
                { name: 'q', label: 'Kérdés', type: 'text', required: true },
                { name: 'a', label: 'Válasz', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'Kapcsolat',
          name: 'kapcsolat',
          fields: [
            show,
            { name: 'title', label: 'Cím (új sor: Enter)', type: 'textarea', required: true },
            { name: 'text', label: 'Szöveg', type: 'textarea' },
            { name: 'cardTitle', label: 'Kártya címe', type: 'text' },
            {
              name: 'rows',
              label: 'Kártya sorai',
              type: 'array',
              fields: [{ type: 'row', fields: [{ name: 'label', label: 'Megnevezés', type: 'text', required: true }, { name: 'value', label: 'Érték', type: 'text', required: true }] }],
            },
            button('button', 'Gomb'),
          ],
        },
      ],
    },
  ],
}
