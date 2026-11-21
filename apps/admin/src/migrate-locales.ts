// One-off, after localization was switched on: existing texts were stored as plain values, Payload now expects
// { hu: value } for translatable fields. Wraps them in place (raw MongoDB), idempotent. Run:
//   PAYLOAD_SECRET=x pnpm payload run src/migrate-locales.ts        (add DRY=1 to only print)
import type { Field } from 'payload'
import { getPayload } from 'payload'
import config from './payload.config'

const LOCALE_KEYS = new Set(['hu', 'en', 'de', 'sv'])
const isWrapped = (v: unknown) =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LOCALE_KEYS.has(k))

let changed = 0
function walk(fields: Field[], data: Record<string, unknown> | undefined) {
  if (!data || typeof data !== 'object') return
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const t of f.tabs) walk(t.fields, 'name' in t && t.name ? (data[t.name] as Record<string, unknown>) : data)
      continue
    }
    if (f.type === 'row' || f.type === 'collapsible') { walk(f.fields, data); continue }
    if (!('name' in f)) continue
    const v = data[f.name]
    if ('localized' in f && f.localized) {
      if (v !== undefined && v !== null && !isWrapped(v)) { data[f.name] = { hu: v }; changed++ }
      continue
    }
    if (f.type === 'group') walk(f.fields, v as Record<string, unknown>)
    else if (f.type === 'array' && Array.isArray(v)) v.forEach((row) => walk(f.fields, row))
    else if (f.type === 'blocks' && Array.isArray(v))
      v.forEach((row) => {
        const b = f.blocks.find((x) => x.slug === row?.blockType)
        if (b) walk(b.fields, row)
      })
  }
}

const payload = await getPayload({ config })
const raw = (payload.db as unknown as { globals: { collection: { findOne: (q: object) => Promise<Record<string, unknown> | null>; replaceOne: (q: object, d: object) => Promise<unknown> } } }).globals.collection
for (const g of payload.config.globals) {
  const doc = await raw.findOne({ globalType: g.slug })
  if (!doc) continue
  const before = changed
  walk(g.fields, doc)
  payload.logger.info(`${g.slug}: ${changed - before} fields wrapped`)
  if (!process.env.DRY && changed > before) await raw.replaceOne({ _id: doc._id }, doc)
}
process.exit(0)
