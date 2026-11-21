import type { Field, GlobalConfig } from 'payload'
import { CONTACT_EMAIL, EMAIL_FONTS } from '../email/template'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

const color = (name: string, label: string, defaultValue: string): Field => ({
  name,
  label,
  type: 'text',
  defaultValue,
  admin: { width: '33%', components: { Field: '/components/ColorField#ColorField' } },
  validate: (v: unknown) => !v || (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) || 'Hex színkód kell, pl. #f4eb06',
})
const row = (...fields: Field[]): Field => ({ type: 'row', fields })

export const Email: GlobalConfig = {
  slug: 'email',
  label: 'Visszaigazoló e-mail',
  admin: {
    group: 'Jelentkezések',
    description: 'Ez az e-mail megy ki automatikusan minden új jelentkezés után a jelentkező e-mail címére. Lent élő előnézet mutatja, hogyan fog kinézni.',
  },
  access: { read: isAdmin, update: isAdmin },
  fields: [
    { name: 'preview', type: 'ui', admin: { components: { Field: '/components/EmailPreview#EmailPreview' } } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tartalom',
          fields: [
            { name: 'enabled', label: 'E-mail küldése bekapcsolva', type: 'checkbox', defaultValue: true },
            row(
              { name: 'fromName', label: 'Feladó neve', type: 'text', defaultValue: 'BB Skills tábor', admin: { width: '50%' } },
              { name: 'replyTo', label: 'Válaszcím (ide érkeznek a válaszok)', type: 'email', defaultValue: CONTACT_EMAIL, admin: { width: '50%', description: 'A levél alján kapcsolattartóként is megjelenik.' } },
            ),
            { name: 'subject', label: 'Tárgy', type: 'text', required: true, defaultValue: 'Megkaptuk a jelentkezést – {{jatekos_nev}}' },
            {
              name: 'body',
              label: 'Szöveg',
              type: 'textarea',
              required: true,
              admin: {
                rows: 14,
                description:
                  'Változók: a {{ }} közé írt név helyére a jelentkezés adata kerül. {{szulo_keresztnev}}, {{szulo_nev}}, {{jatekos_nev}}, {{jelentkezes}}, ' +
                  '{{korosztaly}}, {{telefon}}, {{email}}, és {{valaszok}}: az összes kitöltött válasz (a Dizájn fülön választható, táblázat vagy lista). ' +
                  'Bármelyik űrlapmező azonosítója használható (Jelentkezési űrlap → mező → Haladó: azonosító).',
              },
              defaultValue: `Kedves {{szulo_keresztnev}}!

Köszönjük, megkaptuk {{jatekos_nev}} jelentkezését a BB Skills táborba.
Hamarosan felvesszük veled a kapcsolatot a további részletekkel (befizetés, csoportbeosztás).

A megadott adatok:
{{valaszok}}

Ha valamit módosítanál, egyszerűen válaszolj erre az e-mailre.

Üdvözlettel:
BB Skills csapat`,
            },
            row(
              { name: 'buttonLabel', label: 'Gomb felirata (üresen: nincs gomb)', type: 'text', defaultValue: 'Tábor részletei', admin: { width: '50%' } },
              { name: 'buttonUrl', label: 'Gomb linkje', type: 'text', admin: { width: '50%', placeholder: 'https://…' } },
            ),
            { name: 'footer', label: 'Lábléc (cím, elérhetőség, közösségi oldalak)', type: 'textarea', defaultValue: 'BB Skills jégkorongtábor' },
            {
              name: 'notify',
              label: 'Másolat a szervezőknek (e-mail cím, több is lehet vesszővel)',
              type: 'text',
              admin: { description: 'Ha kitöltöd, minden jelentkezésről másolat megy ide is.' },
            },
          ],
        },
        {
          label: 'Dizájn',
          fields: [
            row(
              { name: 'logoUrl', label: 'Logó (kép linkje, Google Drive link is jó)', type: 'text', admin: { width: '66%' } },
              { name: 'logoWidth', label: 'Logó szélessége (px)', type: 'number', defaultValue: 120, min: 30, max: 400, admin: { width: '33%' } },
            ),
            { name: 'headerTitle', label: 'Fejléc felirata (üresen: nincs)', type: 'text', defaultValue: 'BB SKILLS TÁBOR' },
            row(color('headerBg', 'Fejléc háttér', '#111111'), color('headerText', 'Fejléc felirat', '#f4eb06'), color('pageBg', 'Külső háttér', '#f2f2f2')),
            row(color('cardBg', 'Levél háttér', '#ffffff'), color('textColor', 'Szöveg', '#222222'), color('accent', 'Gomb / kiemelés', '#f4eb06')),
            row(color('buttonText', 'Gomb felirat', '#111111')),
            row(
              { name: 'font', label: 'Betűtípus', type: 'select', defaultValue: 'arial', options: EMAIL_FONTS, admin: { width: '33%' } },
              { name: 'fontSize', label: 'Betűméret (px)', type: 'number', defaultValue: 15, min: 11, max: 22, admin: { width: '33%' } },
              { name: 'radius', label: 'Sarkok kerekítése (px)', type: 'number', defaultValue: 8, min: 0, max: 30, admin: { width: '33%' } },
            ),
            {
              name: 'answers',
              label: 'A válaszok ({{valaszok}}) megjelenése',
              type: 'radio',
              defaultValue: 'table',
              options: [
                { label: 'Táblázat', value: 'table' },
                { label: 'Lista', value: 'list' },
                { label: 'Ne jelenjen meg', value: 'none' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
