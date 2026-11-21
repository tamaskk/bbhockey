import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import { Editor, type Schema } from './Editor'

const SLUGS = ['fooldal', 'urlap', 'beallitasok']

const text = (l: unknown, fallback: string): string =>
  typeof l === 'string' ? l : l && typeof l === 'object' && 'hu' in l ? String((l as { hu: unknown }).hu) : fallback

// Payload field config -> plain, serialisable description for the editor's settings panel
// (layout-only fields like rows/collapsibles are flattened, hidden and system fields dropped).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function simplify(fields: any[]): Schema[] {
  return fields.flatMap((f): Schema[] => {
    if (f.type === 'tabs')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return f.tabs.flatMap((t: any): Schema[] =>
        t.name
          ? [{ name: t.name, label: text(t.label, t.name), type: 'group', fields: simplify(t.fields) }]
          : [{ name: '', label: text(t.label, ''), type: 'heading' }, ...simplify(t.fields)],
      )
    if (!f.name) return f.fields ? simplify(f.fields) : []
    if (f.name === 'id' || f.admin?.hidden || f.admin?.disabled) return []
    const s: Schema = { name: f.name, label: text(f.label, f.name), type: f.type }
    if (f.options) s.options = f.options.map((o: string | { label: unknown; value: string }) => (typeof o === 'string' ? { label: o, value: o } : { label: text(o.label, o.value), value: o.value }))
    if (f.hasMany) s.hasMany = true
    if (f.admin?.custom?.showFor) s.showFor = f.admin.custom.showFor
    if (f.fields) s.fields = simplify(f.fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (f.blocks) s.blocks = Object.fromEntries(f.blocks.map((b: any) => [b.slug, simplify(b.fields)]))
    return [s]
  })
}

// Admin home: the live site in edit mode, saved automatically into the globals.
export const Szerkeszto = ({ initPageResult }: AdminViewServerProps) => {
  const { user, payload } = initPageResult.req
  // redirect() adds the /admin basePath itself
  if (!user) redirect('/login')
  const schema = Object.fromEntries(payload.config.globals.filter((g) => SLUGS.includes(g.slug)).map((g) => [g.slug, simplify(g.fields)]))
  // public site URL for the browser; empty on Vercel, where both apps share one domain
  return <Editor webUrl={process.env.WEB_PUBLIC_URL ?? ''} schema={schema} />
}
