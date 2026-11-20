import type { GlobalConfig } from 'payload'
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

const subtitle = { name: 'subtitle', label: 'Alcím / bevezető', type: 'textarea' as const }

export const Fooldal: GlobalConfig = {
  slug: 'fooldal',
  label: 'Főoldal tartalma',
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateHook] },
  fields: [
    // section order, set by drag and drop in the page editor (Oldalszerkesztő)
    { name: 'order', type: 'text', hasMany: true, admin: { hidden: true } },
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
