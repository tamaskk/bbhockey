import type { Field, GlobalConfig } from 'payload'

export const LOCALES = ['hu', 'en', 'de', 'sv'] as const
export type Locale = (typeof LOCALES)[number]

// text that is the same in every language: identifiers, links, colours, contact data
const SHARED = new Set([
  'name', 'phone', 'url', 'href', 'link', 'driveUrl', 'galleryLinks', 'ifField', 'order',
  'accent', 'accentLight', 'accentDark', 'notify', 'logoUrl', 'buttonUrl', 'pageBg', 'cardBg', 'headerBg',
  'headerText', 'textColor', 'buttonText', 'paymentAccount', 'paymentHolder', 'privacyUrl', 'promoLink',
])

// Marks every text/textarea field as translatable (Payload localization), except the SHARED ones.
// Images, colours, checkboxes, order and list structure stay common to all languages.
export function localizeFields(fields: Field[]): Field[] {
  return fields.map((f) => {
    if (f.type === 'tabs') return { ...f, tabs: f.tabs.map((t) => ({ ...t, fields: localizeFields(t.fields) })) }
    if (f.type === 'row' || f.type === 'collapsible' || f.type === 'group' || f.type === 'array')
      return { ...f, fields: localizeFields(f.fields) } as Field
    if (f.type === 'blocks') return { ...f, blocks: f.blocks.map((b) => ({ ...b, fields: localizeFields(b.fields) })) }
    if ((f.type === 'text' || f.type === 'textarea') && !SHARED.has(f.name)) return { ...f, localized: true } as Field
    return f
  })
}

export const localizeGlobal = (g: GlobalConfig): GlobalConfig => ({ ...g, fields: localizeFields(g.fields) })
