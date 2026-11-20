// Pure helpers for the page editor: section order, added sections, and per-element looks.
type Doc = Record<string, unknown>
type Block = { id: string; blockType: string; [k: string]: unknown }
export type Look = Record<string, unknown>

// built-in sections, in default order (same list as apps/web Sections.tsx SECTION_KEYS)
export const SECTION_KEYS = ['marquee', 'tabor', 'napirend', 'etlap', 'rolunk', 'velemenyek', 'gyik', 'kapcsolat']

export const SECTION_TYPES: { type: string; label: string; hint: string; data: Doc }[] = [
  { type: 'szoveg', label: 'Szöveg', hint: 'Cím, bekezdések, gomb', data: { title: 'Új', highlight: 'szekció', text: 'Írd ide a szöveget. Új bekezdés: üres sor.' } },
  { type: 'kepszoveg', label: 'Kép + szöveg', hint: 'Kép az egyik oldalon, szöveg a másikon', data: { title: 'Kép és', highlight: 'szöveg', text: 'Írd ide a szöveget.' } },
  { type: 'kartyak', label: 'Kártyák', hint: 'Képes kártyák rácsban', data: { title: 'Új', highlight: 'kártyák', items: [{ title: 'Első kártya', text: 'Rövid leírás.' }, { title: 'Második kártya', text: 'Rövid leírás.' }, { title: 'Harmadik kártya', text: 'Rövid leírás.' }] } },
  { type: 'galeria', label: 'Képgaléria', hint: 'Képek rácsban, képaláírással', data: { title: 'Képek', highlight: 'a táborból', images: [] } },
  { type: 'video', label: 'Videó', hint: 'YouTube videó beágyazva', data: { title: 'Nézd meg', highlight: 'videón' } },
  { type: 'gomb', label: 'Felhívás gombbal', hint: 'Nagy cím, rövid szöveg, gomb', data: { title: 'Jelentkezz most!', text: 'Korlátozott a létszám.', button: { label: 'Jelentkezem', href: '#jelentkezes' } } },
]

const blocksOf = (doc: Doc) => (Array.isArray(doc.blocks) ? (doc.blocks as Block[]) : [])

// Sections on the page, in order. A built-in section missing from the saved order was deleted;
// custom sections missing from it (just added) go at the end. Same rule as apps/web Sections.tsx.
// shortcut: a built-in section added to the code later won't appear on sites with a saved order; add it via "Visszahozás".
export function currentOrder(doc: Doc): string[] {
  const custom = blocksOf(doc).map((b) => `b:${b.id}`)
  const keys = [...SECTION_KEYS, ...custom]
  const saved = Array.isArray(doc.order) && doc.order.length ? (doc.order as string[]) : SECTION_KEYS
  return [...new Set([...saved, ...custom])].filter((k) => keys.includes(k))
}

const insertKey = (doc: Doc, key: string, afterKey: string | undefined) => {
  const order = currentOrder(doc).filter((k) => k !== key)
  // '' = first; unknown key = last
  const at = afterKey === '' ? 0 : afterKey && order.includes(afterKey) ? order.indexOf(afterKey) + 1 : order.length
  order.splice(at, 0, key)
  doc.order = order
}

export const removedBuiltins = (doc: Doc) => SECTION_KEYS.filter((k) => !currentOrder(doc).includes(k))

// built-in sections: deleting removes them from the order (content is kept), restoring puts them back
export function removeBuiltin(doc: Doc, key: string): boolean {
  if (!SECTION_KEYS.includes(key)) return false
  doc.order = currentOrder(doc).filter((k) => k !== key)
  return true
}
export function restoreBuiltin(doc: Doc, key: string, afterKey: string | undefined): boolean {
  if (!SECTION_KEYS.includes(key)) return false
  insertKey(doc, key, afterKey)
  if (doc[key] && typeof doc[key] === 'object') (doc[key] as Doc).show = true
  return true
}

// 24 hex chars, the id format Payload uses for rows on MongoDB
export const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')

export function addSection(doc: Doc, type: string, afterKey: string | undefined, id = newId()): boolean {
  const def = SECTION_TYPES.find((t) => t.type === type)
  if (!def) return false
  doc.blocks = [...blocksOf(doc), { id, blockType: type, show: true, ...structuredClone(def.data) }]
  insertKey(doc, `b:${id}`, afterKey)
  return true
}

export function deleteSection(doc: Doc, index: number): boolean {
  const blocks = blocksOf(doc)
  const b = blocks[index]
  if (!b) return false
  const order = currentOrder(doc).filter((k) => k !== `b:${b.id}`)
  doc.blocks = blocks.filter((_, i) => i !== index)
  doc.order = order
  return true
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Looks are keyed by path ("fooldal:gyik.items.2.q"); when a list changes, move them with their items.
export function remapLooks(
  looks: Record<string, Look>,
  list: string,
  change: { kind: 'del' | 'dup' | 'ins'; i: number } | { kind: 'move'; order: number[] },
): Record<string, Look> {
  const re = new RegExp(`^${esc(list)}\\.(\\d+)(\\..*)?$`)
  const inv = change.kind === 'move' ? Object.fromEntries(change.order.map((old, n) => [old, n])) : {}
  const out: Record<string, Look> = {}
  for (const [k, v] of Object.entries(looks)) {
    const m = re.exec(k)
    if (!m) { out[k] = v; continue }
    const i = Number(m[1]), rest = m[2] ?? ''
    if (change.kind === 'move') out[`${list}.${inv[i] ?? i}${rest}`] = v
    else if (change.kind === 'del') { if (i !== change.i) out[`${list}.${i > change.i ? i - 1 : i}${rest}`] = v }
    // a new item inserted at i: everything from i on moves down by one
    else if (change.kind === 'ins') out[`${list}.${i >= change.i ? i + 1 : i}${rest}`] = v
    else {
      out[`${list}.${i > change.i ? i + 1 : i}${rest}`] = v
      if (i === change.i) out[`${list}.${i + 1}${rest}`] = structuredClone(v)
    }
  }
  return out
}
