import type { GlobalConfig } from 'payload'
import { FONTS } from '../fonts'
import { image } from '../fields'
import { directImageUrl, validateImageLink } from '../drive'
import { revalidateHook } from '../revalidate'

const sectionTargets = [
  { label: 'Főoldal (teteje)', value: 'fooldal' },
  { label: 'Táborról', value: 'taborrol' },
  { label: 'Napirend', value: 'napirend' },
  { label: 'Étlap', value: 'etlap' },
  { label: 'Rólunk', value: 'rolunk' },
  { label: 'Vélemények', value: 'velemenyek' },
  { label: 'GYIK', value: 'gyik' },
  { label: 'Kapcsolat', value: 'kapcsolat' },
  { label: 'Jelentkezés', value: 'jelentkezes' },
]

// one icon each on the site (web/src/app/Chrome.tsx); „Egyéb” is a plain link icon
export const SOCIAL_PLATFORMS = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X (Twitter)', value: 'x' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Egyéb', value: 'egyeb' },
]

const color = (name: string, label: string, defaultValue: string) => ({
  name,
  label,
  type: 'text' as const,
  required: true,
  defaultValue,
  admin: { description: 'Hex színkód, pl. #f4eb06' },
  validate: (v: unknown) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) || 'Hex színkód kell, pl. #f4eb06',
})

export const Beallitasok: GlobalConfig = {
  slug: 'beallitasok',
  label: 'Beállítások',
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateHook] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Arculat',
          fields: [
            image('logo', 'Logó (sötét háttérre, fejléc és lábléc)', true),
            image('favicon', 'Favicon (böngészőfül ikon, négyzetes)'),
            {
              type: 'row',
              fields: [
                color('accent', 'Fő kiemelő szín', '#f4eb06'),
                color('accentLight', 'Világosabb (hover) szín', '#fff35c'),
                color('accentDark', 'Sötétebb szín (világos háttéren)', '#857f00'),
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'fontHeading', label: 'Címek betűtípusa', type: 'select', options: FONTS.filter((f) => f.value), admin: { description: 'Üresen: Saira Condensed' } },
                { name: 'fontBody', label: 'Szövegek betűtípusa', type: 'select', options: FONTS.filter((f) => f.value), admin: { description: 'Üresen: Barlow' } },
              ],
            },
            // per-element looks set in the page editor (🎨): { "<global>:<field path>": { color, bg, font, size, … } }
            { name: 'styles', type: 'json', admin: { hidden: true } },
          ],
        },
        {
          label: 'Elérhetőség',
          fields: [
            { name: 'name', label: 'Név (szervező)', type: 'text', required: true, defaultValue: 'BB Your Hockey Skills' },
            { name: 'phone', label: 'Telefonszám', type: 'text', required: true },
            { name: 'email', label: 'E-mail', type: 'email' },
            { name: 'location', label: 'Helyszín / cím', type: 'text' },
            {
              name: 'social',
              label: 'Közösségi oldalak',
              type: 'array',
              labels: { singular: 'Ikon', plural: 'Ikonok' },
              admin: { description: 'Ikonok a fejléc tetején és a láblécben; a sorrend itt állítható. Új oldalhoz adj hozzá egy sort (pl. YouTube).' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'platform', label: 'Oldal', type: 'select', required: true, defaultValue: 'facebook', options: SOCIAL_PLATFORMS },
                    {
                      name: 'url',
                      label: 'Link',
                      type: 'text',
                      required: true,
                      validate: (v: unknown) => (typeof v === 'string' && /^https?:\/\/\S+$/.test(v)) || 'Teljes link kell, https://-sel',
                    },
                    { name: 'label', label: 'Felirat (egérrel rámutatva)', type: 'text', admin: { description: 'Üresen: az oldal neve' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Menü',
          fields: [
            {
              name: 'nav',
              label: 'Menüpontok',
              type: 'array',
              labels: { singular: 'Menüpont', plural: 'Menüpontok' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Felirat', type: 'text', required: true },
                    { name: 'target', label: 'Hova görgessen', type: 'select', required: true, options: sectionTargets },
                  ],
                },
              ],
            },
            { name: 'ctaLabel', label: 'Fejléc gomb felirata', type: 'text', defaultValue: 'Jelentkezés' },
            { name: 'quickTabLabel', label: 'Oldalsó fül felirata', type: 'text', defaultValue: 'Jelentkezés' },
          ],
        },
        {
          label: 'Jelentkezés',
          fields: [
            {
              name: 'youngestBirthYear',
              label: 'Legfiatalabb jelentkező születési éve',
              type: 'number',
              min: 2000,
              max: 2100,
              admin: { description: 'Pl. 2018: aki 2019-ben vagy később született, nem tud jelentkezni. Az űrlap kiírja a határt. Üresen: nincs korlát.' },
            },
          ],
        },
        {
          label: 'Lábléc',
          fields: [
            { name: 'footerText', label: 'Rövid leírás a logó alatt', type: 'textarea' },
            {
              name: 'footerLinks',
              label: '„Tábor” oszlop linkjei',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Felirat', type: 'text', required: true },
                    { name: 'target', label: 'Hova görgessen', type: 'select', options: sectionTargets },
                    { name: 'href', label: 'Vagy külső link', type: 'text' },
                  ],
                },
              ],
            },
            { name: 'footerColumnTitle', label: '„Tábor” oszlop címe', type: 'text', defaultValue: 'Tábor' },
            { name: 'copyright', label: 'Copyright szöveg', type: 'text' },
            { name: 'privacyUrl', label: 'Adatkezelési tájékoztató linkje', type: 'text' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'siteTitle', label: 'Oldal címe (böngészőfül, Google)', type: 'text', required: true },
            { name: 'description', label: 'Leírás (Google, megosztás)', type: 'textarea' },
            image('ogImage', 'Megosztási kép (Facebook, Messenger előnézet)'),
          ],
        },
        {
          label: 'Süti sáv',
          fields: [
            { name: 'cookieShow', label: 'Süti sáv megjelenjen', type: 'checkbox', defaultValue: true },
            { name: 'cookieTitle', label: 'Cím', type: 'text', defaultValue: 'Sütiket használunk' },
            { name: 'cookieText', label: 'Szöveg', type: 'textarea' },
            { name: 'cookieAccept', label: 'Elfogadás gomb', type: 'text', defaultValue: 'Elfogadom' },
            { name: 'cookieNecessary', label: 'Csak szükséges gomb', type: 'text', defaultValue: 'Csak a szükségesek' },
          ],
        },
        {
          label: 'Képes blokk',
          description: 'Cím, szöveg és max 3 kép a „Táborról” szekció alatt, a napirend előtt.',
          fields: [
            { name: 'extraShow', label: 'Megjelenjen az oldalon', type: 'checkbox', defaultValue: false },
            { name: 'extraTitle', label: 'Cím', type: 'text' },
            { name: 'extraText', label: 'Szöveg', type: 'textarea', admin: { rows: 6, description: 'Üres sor: új bekezdés.' } },
            { name: 'extraImages', label: 'Képek (max 3, egymás mellett)', type: 'array', maxRows: 3, labels: { singular: 'Kép', plural: 'Képek' }, fields: [
              {
                name: 'url',
                label: 'Kép linkje',
                type: 'text',
                required: true,
                admin: { description: 'Google Drive: kép → Megosztás → „Bárki, aki rendelkezik a linkkel” → Link másolása. Más https kép link is jó.' },
                validate: validateImageLink,
                hooks: { beforeChange: [({ value }) => (typeof value === 'string' ? directImageUrl(value.trim()) : value)] },
              },
            ] },
          ],
        },
        {
          label: 'Promóció',
          description:
            'Felugró ablak az aktuális akcióról a főoldalon. Bármikor átírható vagy kikapcsolható; a lejárat után magától eltűnik. ' +
            'Egy látogatónak egyszer jön fel, de ha átírod a szöveget, újra megjelenik neki.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'promoShow', label: 'Promóció bekapcsolva', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
                {
                  name: 'promoUntil',
                  label: 'Eddig látszik (üresen: amíg ki nem kapcsolod)',
                  type: 'date',
                  admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy.MM.dd.' } },
                },
              ],
            },
            { name: 'promoBadge', label: 'Kis felirat a cím fölött', type: 'text', admin: { placeholder: 'pl. Karácsonyi akció' } },
            { name: 'promoTitle', label: 'Cím', type: 'text' },
            { name: 'promoText', label: 'Szöveg', type: 'textarea', admin: { rows: 6, description: 'Üres sor: új bekezdés. "- " a sor elején: felsorolás.' } },
            image('promoImage', 'Kép (nem kötelező)'),
            {
              type: 'row',
              fields: [
                { name: 'promoButton', label: 'Gomb felirata', type: 'text', defaultValue: 'Jelentkezem', admin: { width: '50%' } },
                { name: 'promoLink', label: 'Gomb linkje (üresen: a jelentkezéshez ugrik)', type: 'text', admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
