'use client'
import { useEffect, useRef, useState } from 'react'
import { FONTS } from '../fonts'
import { addSection, currentOrder, deleteSection, remapLooks, removeBuiltin, removedBuiltins, restoreBuiltin, SECTION_TYPES, type Look } from './ops'

type Doc = Record<string, unknown>
export type Schema = { name: string; label: string; type: string; options?: { label: string; value: string }[]; hasMany?: boolean; fields?: Schema[]; showFor?: string[]; blocks?: Record<string, Schema[]> }

const SLUGS = ['fooldal', 'urlap', 'beallitasok']
const api = (slug: string) => `/admin/api/globals/${slug}?depth=0`

export function getPath(doc: unknown, path: string): unknown {
  return path ? path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Doc)[k] : undefined), doc) : doc
}

// Sets a value at "a.b.0.c". Refuses paths whose parents don't exist, so the iframe can't invent structure.
export function setPath(doc: Doc, path: string, value: unknown): boolean {
  const keys = path.split('.')
  const last = keys.pop()!
  const parent = getPath(doc, keys.join('.'))
  if (!parent || typeof parent !== 'object') return false
  ;(parent as Doc)[last] = value
  return true
}

// a copied list item must get new ids (Payload assigns them), or it would clash with the original
const withoutIds = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(withoutIds) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, withoutIds(x)])) : v

const errorText = (body: { errors?: { message?: string; data?: { errors?: { message: string }[] } }[] }, status: number) =>
  body?.errors?.[0]?.data?.errors?.map((e) => e.message).join(', ') || body?.errors?.[0]?.message || String(status)

// An image given by link (Google Drive or any https image URL) becomes a Media document without an uploaded file.
async function createMedia(link: string, alt: string): Promise<string> {
  const fd = new FormData()
  fd.append('_payload', JSON.stringify({ driveUrl: link.trim(), alt }))
  const res = await fetch('/admin/api/media', { method: 'POST', body: fd })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorText(body, res.status))
  return body.doc.id
}

// fields of the object at `path` ("tabor.tiles.3" -> the tile's fields; "blocks.2" -> that section type's fields)
function schemaAt(root: Schema[], path: string, doc: unknown): Schema[] {
  let fields = root, value = doc, cur: Schema | undefined
  for (const k of path ? path.split('.') : []) {
    value = (value as Doc | undefined)?.[k]
    if (/^\d+$/.test(k)) {
      if (cur?.blocks) fields = cur.blocks[String((value as Doc | undefined)?.blockType)] ?? []
      continue
    }
    cur = fields.find((f) => f.name === k)
    fields = cur?.fields ?? []
  }
  return fields
}

// a human name for a list item or section: its label, title, name…
const itemName = (v: unknown) => {
  const o = (v ?? {}) as Doc
  return [o.label ?? o.title ?? o.name ?? o.q ?? o.day ?? o.time, o.highlight].filter(Boolean).join(' ').slice(0, 40)
}

type Modal = { kind: 'img' | 'gallery' | 'settings' | 'add' | 'style' | 'section'; slug: string; path: string } | null

export function Editor({ webUrl, schema }: { webUrl: string; schema: Record<string, Schema[]> }) {
  const docs = useRef<Record<string, Doc>>({})
  const dirty = useRef(new Set<string>())
  const reloadAfter = useRef(false)
  const chain = useRef(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const frame = useRef<HTMLIFrameElement>(null)
  const [status, setStatus] = useState('Betöltés…')
  const [error, setError] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  // undo: snapshots of all docs taken before each change; typing into the same text counts as one step
  const history = useRef<Record<string, Doc>[]>([])
  const last = useRef<Record<string, Doc>>({})
  const lastKey = useRef('')
  const [undoCount, setUndoCount] = useState(0)
  const [addAt, setAddAt] = useState(-2) // list position a new item goes after (-1 = first, -2 = last)
  const box = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const fit = () => box.current && setHeight(window.innerHeight - box.current.getBoundingClientRect().top - window.scrollY)
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  const src = `${webUrl}/szerkeszto`

  // after a failed list change, drop the unsaved structure: reload the server state into memory and the page
  const resync = async (slug: string) => {
    const res = await fetch(api(slug))
    if (res.ok) {
      const { id: _i, createdAt: _c, updatedAt: _u, globalType: _g, ...doc } = await res.json()
      docs.current[slug] = doc
      dirty.current.delete(slug)
    }
    reloadAfter.current = false
    if (frame.current) frame.current.src = src
  }

  const save = () => {
    timer.current = undefined
    chain.current = chain.current.then(async () => {
      const slugs = [...dirty.current]
      dirty.current.clear()
      if (!slugs.length) return
      setStatus('Mentés…')
      for (const slug of slugs) {
        try {
          const sent = JSON.stringify(docs.current[slug])
          const res = await fetch(api(slug), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docs.current[slug]) })
          const body = await res.json().catch(() => ({}))
          if (!res.ok) {
            dirty.current.add(slug) // retried with the next change
            if (reloadAfter.current) await resync(slug)
            setError(true)
            // Payload validation errors, e.g. a required title left empty
            return setStatus(`Nem mentve: ${errorText(body, res.status)}`)
          }
          // keep server-assigned ids (new list items) so later edits address the same rows
          const { id: _i, createdAt: _c, updatedAt: _u, globalType: _g, ...doc } = body.result ?? body
          // only if nothing changed meanwhile (typing or undo during the save must not be overwritten)
          if (JSON.stringify(docs.current[slug]) === sent) {
            docs.current[slug] = doc
            last.current[slug] = structuredClone(doc)
          }
        } catch {
          dirty.current.add(slug)
          if (reloadAfter.current) await resync(slug).catch(() => {})
          setError(true)
          return setStatus('Nem mentve: nincs kapcsolat.')
        }
      }
      setError(false)
      setStatus('Mentve ✓')
      if (reloadAfter.current && frame.current) {
        reloadAfter.current = false
        frame.current.src = src
      }
    })
  }

  const changed = (slug: string, structural = false, key = '') => {
    if (!key || key !== lastKey.current) {
      history.current.push(last.current)
      if (history.current.length > 50) history.current.shift()
      setUndoCount(history.current.length)
    }
    lastKey.current = key
    last.current = structuredClone(docs.current)
    dirty.current.add(slug)
    if (structural) reloadAfter.current = true
    setStatus('Változás…')
    clearTimeout(timer.current)
    timer.current = setTimeout(save, structural ? 0 : 800)
  }

  useEffect(() => {
    const origin = webUrl ? new URL(webUrl).origin : window.location.origin
    Promise.all(SLUGS.map((s) => fetch(api(s)).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))))
      .then((list) => {
        list.forEach(({ id: _i, createdAt: _c, updatedAt: _u, globalType: _g, ...d }, i) => (docs.current[SLUGS[i]] = d))
        last.current = structuredClone(docs.current)
        setStatus('Kattints egy szövegre és írj. 🎨 kinézet, ⚙ beállítások, ⠿ húzás, ⧉ másolat, ✕ törlés.')
      })
      .catch(() => (setError(true), setStatus('Nem sikerült betölteni a tartalmat.')))

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || !e.data?.bbEdit || typeof e.data.path !== 'string') return
      const { op, value } = e.data
      const [slug, path = ''] = (e.data.path as string).split(':')
      const doc = docs.current[slug]
      if (!doc) return
      if (op === 'img' || op === 'gallery' || op === 'settings') return setModal({ kind: op, slug, path })
      if (op === 'style') return setModal({ kind: 'style', slug, path })
      if (op === 'hide') {
        if (typeof value !== 'boolean') return
        const key = `${slug}:${path}`
        const all = { ...looks() }
        const l: Look = { ...all[key], hide: value }
        if (!value) delete l.hide
        if (Object.keys(l).length) all[key] = l
        else delete all[key]
        docs.current.beallitasok.styles = all
        return changed('beallitasok', true)
      }
      if (op === 'nudge') {
        const { x, y } = (value ?? {}) as { x?: unknown; y?: unknown }
        if (!Number.isFinite(x) || !Number.isFinite(y)) return
        const key = `${slug}:${path}`
        const all = { ...looks() }
        const l: Look = { ...all[key], x, y }
        if (!x) delete l.x
        if (!y) delete l.y
        if (Object.keys(l).length) all[key] = l
        else delete all[key]
        docs.current.beallitasok.styles = all
        return changed('beallitasok') // the page already shows it: no reload
      }
      if (op === 'addSection') return setModal({ kind: 'section', slug, path })
      // a rejected change leaves the page showing (and locked on) something unsaved: reload it
      const reject = () => void (frame.current && (frame.current.src = src))
      if (op === 'delSection') {
        if (slug !== 'fooldal') return reject()
        if (path.startsWith('blocks.')) {
          const i = Number(path.split('.')[1])
          if (!deleteSection(doc, i)) return reject()
          moveLooks(`fooldal:blocks`, { kind: 'del', i })
        } else if (!removeBuiltin(doc, path)) return reject()
        return changed(slug, true)
      }
      if (op === 'dup' || op === 'del' || op === 'move') {
        const list = op === 'move' ? path : path.slice(0, path.lastIndexOf('.'))
        const arr = getPath(doc, list)
        if (!Array.isArray(arr)) return reject()
        if (op === 'move') {
          const order = value ?? e.data.order
          if (!Array.isArray(order) || order.length !== arr.length || [...order].sort((a, b) => a - b).some((n, i) => n !== i)) return reject()
          setPath(doc, list, order.map((i: number) => arr[i]))
        } else {
          const i = Number(path.slice(list.length + 1))
          if (!(i in arr)) return reject()
          if (op === 'dup') arr.splice(i + 1, 0, withoutIds(arr[i]))
          else arr.splice(i, 1)
        }
        moveLooks(`${slug}:${list}`, op === 'move' ? { kind: 'move', order: value ?? e.data.order } : { kind: op, i: Number(path.slice(list.length + 1)) })
        return changed(slug, true)
      }
      if (path === 'order') {
        if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return reject()
        setPath(doc, path, value)
        return changed(slug, true)
      }
      if (typeof value === 'string' || typeof value === 'boolean')
        if (setPath(doc, path, value)) changed(slug, false, `${slug}:${path}`)
    }
    // don't lose a pending edit when leaving within the debounce window
    const onLeave = (e: BeforeUnloadEvent) => {
      if (timer.current || dirty.current.size) e.preventDefault()
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webUrl])

  const undo = () => {
    const prev = history.current.pop()
    setUndoCount(history.current.length)
    if (!prev) return
    clearTimeout(timer.current)
    for (const slug of SLUGS) if (JSON.stringify(prev[slug]) !== JSON.stringify(docs.current[slug])) dirty.current.add(slug)
    docs.current = structuredClone(prev)
    last.current = prev
    lastKey.current = ''
    reloadAfter.current = true
    setModal(null)
    setStatus('Visszavonva, mentés…')
    save()
  }
  useEffect(() => {
    // Ctrl/Cmd+Z in the admin (inside the page text the browser's own undo works)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !(e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]')) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // per-element looks live in Beallitasok.styles, keyed by "<global>:<path>"
  const looks = () => ((docs.current.beallitasok.styles ??= {}) as Record<string, Look>)
  const moveLooks = (list: string, change: Parameters<typeof remapLooks>[2]) => {
    const before = looks()
    const after = remapLooks(before, list, change)
    if (JSON.stringify(after) === JSON.stringify(before)) return
    docs.current.beallitasok.styles = after
    dirty.current.add('beallitasok')
  }
  const setLook = (key: string, look: Look | null) => {
    const all = { ...looks() }
    if (look && Object.keys(look).length) all[key] = look
    else delete all[key]
    docs.current.beallitasok.styles = all
    setModal(null)
    changed('beallitasok', true)
  }

  // everything back to the original content; waits for pending saves so they cannot overwrite the reset
  const reset = async () => {
    if (!window.confirm('Minden szöveg, kép, szekció, szín és az űrlap visszaáll az alapállapotra. Ez nem vonható vissza. Folytatod?')) return
    clearTimeout(timer.current)
    dirty.current.clear()
    await chain.current
    setStatus('Visszaállítás…')
    const res = await fetch('/admin/api/alaphelyzet', { method: 'POST' })
    if (res.ok) return window.location.reload()
    setError(true)
    setStatus(`Nem sikerült: ${errorText(await res.json().catch(() => ({})), res.status)}`)
  }

  const apply = (slug: string, path: string, value: unknown) => {
    const doc = docs.current[slug]
    if (path) setPath(doc, path, value)
    else Object.assign(doc, value)
    setModal(null)
    changed(slug, true)
  }

  return (
    // fills the admin content area (below Payload's header, beside its nav) so the admin menu keeps working
    <div ref={box} style={{ height: height || '80vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', padding: '10px 16px', borderBottom: '1px solid var(--theme-elevation-150)' }}>
        <strong>Oldalszerkesztő</strong>
        <span role="status" style={{ color: error ? 'var(--theme-error-500)' : 'var(--theme-elevation-600)', flex: 1, minWidth: 200 }}>{status}</span>
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={!undoCount} onClick={undo} title="Az utolsó változás visszavonása (Ctrl/Cmd+Z)">↶ Visszavonás{undoCount ? ` (${undoCount})` : ''}</button>
        <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} onClick={() => setModal({ kind: 'section', slug: 'fooldal', path: '' })}>＋ Új szekció</button>
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setModal({ kind: 'settings', slug: 'beallitasok', path: '' })}>⚙ Oldal beállításai (színek, betűk)</button>
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setModal({ kind: 'settings', slug: 'urlap', path: '' })}>⚙ Űrlap</button>
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={reset} title="Az oldal tartalma és kinézete vissza az eredetire">⟲ Alaphelyzet</button>
        <a href="/admin/collections/jelentkezesek">Jelentkezések</a>
        <a href="/admin/globals/email">✉ Visszaigazoló e-mail</a>
        <a href="/admin/globals/fooldal">Haladó admin</a>
        <a href={webUrl || '/'} target="_blank" rel="noreferrer">Oldal ↗</a>
      </div>
      <iframe ref={frame} src={src} title="Oldalszerkesztő" style={{ flex: 1, border: 0, width: '100%' }} />
      {modal?.kind === 'img' && <ImageModal onClose={() => setModal(null)} onSave={(id) => apply(modal.slug, modal.path, id)} />}
      {modal?.kind === 'gallery' && (
        <GalleryModal
          value={String(getPath(docs.current[modal.slug], `${modal.path}.galleryLinks`) ?? '')}
          uploaded={((getPath(docs.current[modal.slug], `${modal.path}.gallery`) as unknown[] | undefined) ?? []).length}
          onClose={() => setModal(null)}
          onSave={(text) => apply(modal.slug, `${modal.path}.galleryLinks`, text)}
        />
      )}
      {modal?.kind === 'settings' && (
        <SettingsModal
          title={modal.path ? `Beállítások: ${itemName(getPath(docs.current[modal.slug], modal.path)) || 'elem'}` : modal.slug === 'urlap' ? 'Űrlap beállításai' : 'Oldal beállításai'}
          fields={schemaAt(schema[modal.slug] ?? [], modal.path, docs.current[modal.slug])}
          value={structuredClone(getPath(docs.current[modal.slug], modal.path) ?? {}) as Doc}
          onClose={() => setModal(null)}
          onSave={(v) => apply(modal.slug, modal.path, v)}
          onAdd={(list) => (setAddAt(-2), setModal({ kind: 'add', slug: modal.slug, path: [modal.path, list].filter(Boolean).join('.') }))}
        />
      )}
      {modal?.kind === 'add' && (
        <SettingsModal
          title="Új elem"
          fields={schemaAt(schema[modal.slug] ?? [], modal.path, docs.current[modal.slug])}
          value={{}}
          top={(() => {
            const list = getPath(docs.current[modal.slug], modal.path)
            const names = Array.isArray(list) ? list.map((x, i) => itemName(x) || `${i + 1}. elem`) : []
            return names.length > 0 && <Where names={names} value={addAt} onChange={setAddAt} />
          })()}
          onClose={() => setModal(null)}
          onSave={(v) => {
            const doc = docs.current[modal.slug]
            const list = getPath(doc, modal.path)
            if (Array.isArray(list)) {
              const at = addAt === -2 ? list.length : addAt + 1
              list.splice(at, 0, v)
              moveLooks(`${modal.slug}:${modal.path}`, { kind: 'ins', i: at })
            } else if (!setPath(doc, modal.path, [v])) return
            setModal(null)
            changed(modal.slug, true)
          }}
        />
      )}
      {modal?.kind === 'style' && (
        <StyleModal
          target={modal.path}
          value={structuredClone(looks()[`${modal.slug}:${modal.path}`] ?? {})}
          onClose={() => setModal(null)}
          onSave={(l) => setLook(`${modal.slug}:${modal.path}`, l)}
        />
      )}
      {modal?.kind === 'section' && (
        <SectionModal
          sections={currentOrder(docs.current.fooldal).map((k) => [k, sectionName(docs.current.fooldal, k)])}
          removed={removedBuiltins(docs.current.fooldal).map((k) => [k, sectionName(docs.current.fooldal, k)])}
          after={modal.path || currentOrder(docs.current.fooldal).at(-1)!}
          onClose={() => setModal(null)}
          onPick={(type, after) => {
            const doc = docs.current.fooldal
            if (!(type.startsWith('restore:') ? restoreBuiltin(doc, type.slice(8), after) : addSection(doc, type, after))) return
            setModal(null)
            changed('fooldal', true)
          }}
        />
      )}
    </div>
  )
}

// "where should the new one go": after which existing item
function Where({ names, value, onChange }: { names: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <label>Hová kerüljön?
      <select style={inputStyle} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={-1}>Legelejére</option>
        {names.map((n, i) => <option key={i} value={i === names.length - 1 ? -2 : i}>„{n}” után{i === names.length - 1 ? ' (a végére)' : ''}</option>)}
      </select>
    </label>
  )
}

const BUILTIN: Record<string, string> = { marquee: 'Futószalag', tabor: 'Tábor', napirend: 'Napirend', etlap: 'Étlap', rolunk: 'Rólunk', velemenyek: 'Vélemények', gyik: 'GYIK', kapcsolat: 'Kapcsolat' }
function sectionName(doc: Doc, key: string) {
  const v = key.startsWith('b:') ? (doc.blocks as Doc[] | undefined)?.find((b) => `b:${b.id}` === key) : doc[key]
  const name = itemName(v)
  return BUILTIN[key] ? `${BUILTIN[key]}${name ? ` – ${name}` : ''}` : name || 'Saját szekció'
}

function SectionModal({ sections, removed, after, onClose, onPick }: { sections: [string, string][]; removed: [string, string][]; after: string; onClose: () => void; onPick: (type: string, after: string) => void }) {
  const [at, setAt] = useState(after)
  return (
    <Dialog title="Új szekció" onClose={onClose} onSubmit={onClose} busy={false} err="" submitLabel={null}>
      <label>Hová kerüljön?
        <select style={inputStyle} value={at} onChange={(e) => setAt(e.target.value)}>
          <option value="">Legfelülre (a nyitókép alá)</option>
          {sections.map(([k, n]) => <option key={k} value={k}>„{n}” alá</option>)}
        </select>
      </label>
      <p style={{ margin: 0 }}>Válaszd ki, milyen szekció legyen. Utána minden szövege, képe, színe szerkeszthető, és ⠿-vel bárhová húzható.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {SECTION_TYPES.map((t) => (
          <button key={t.type} type="button" onClick={() => onPick(t.type, at)} style={{ textAlign: 'left', padding: 12, borderRadius: 6, border: '1px solid var(--theme-elevation-250)', background: 'var(--theme-elevation-50)', color: 'inherit', cursor: 'pointer', font: 'inherit' }}>
            <strong>{t.label}</strong>
            <br />
            <small style={{ opacity: 0.75 }}>{t.hint}</small>
          </button>
        ))}
      </div>
      {removed.length > 0 && (
        <>
          <p style={{ margin: '8px 0 0' }}>Törölt szekció visszahozása:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {removed.map(([k, n]) => (
              <button key={k} type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => onPick(`restore:${k}`, at)}>↺ {n}</button>
            ))}
          </div>
        </>
      )}
    </Dialog>
  )
}

// One element's look. Empty / "alap" values fall back to the theme.
function StyleModal({ target, value, onClose, onSave }: { target: string; value: Look; onClose: () => void; onSave: (l: Look | null) => void }) {
  const [l, setL] = useState<Look>(value)
  const set = (k: string, v: unknown) => setL((o) => {
    const n = { ...o }
    if (v === '' || v === undefined || v === null || Number.isNaN(v)) delete n[k]
    else n[k] = v
    return n
  })
  const color = (k: string, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ flex: 1 }}>{label}</span>
      <input type="color" value={String(l[k] ?? '#000000')} onChange={(e) => set(k, e.target.value)} style={{ width: 48, height: 32, padding: 0, border: 0, background: 'none', opacity: l[k] ? 1 : 0.35 }} />
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={!l[k]} onClick={() => set(k, '')}>alap</button>
    </label>
  )
  const select = (k: string, label: string, options: [string, string][]) => (
    <label>{label}
      <select style={inputStyle} value={String(l[k] ?? '')} onChange={(e) => set(k, e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value)}>
        <option value="">Alap (téma szerint)</option>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  )
  const isBox = !/(^|\.)(title|highlight|subtitle|text|label|q|a|name|role|quote|who|cta|value|unit|time|day|date|soup|caption|help|intro|byline)$/.test(target) && !/^(phone|email|location|copyright|footerText|footerColumnTitle|ctaLabel|submitLabel|closedText)$/.test(target)
  return (
    <Dialog title="🎨 Kinézet" onClose={onClose} onSubmit={() => onSave(l)} busy={false} err="" extra={<button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0, marginRight: 'auto' }} onClick={() => onSave(null)}>Minden visszaállítása</button>}>
      {color('color', 'Szöveg színe')}
      {color('bg', 'Háttérszín')}
      {select('font', 'Betűtípus', FONTS.filter((f) => f.value).map((f) => [f.value, f.label]))}
      <label>Betűméret (px)
        <input style={inputStyle} type="number" min={8} max={160} placeholder="alap" value={l.size === undefined ? '' : String(l.size)} onChange={(e) => set('size', e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
      {select('weight', 'Vastagság', [['400', 'Normál'], ['600', 'Félkövér'], ['800', 'Vastag']])}
      {select('italic', 'Dőlt', [['true', 'Dőlt'], ['false', 'Nem dőlt']])}
      {select('upper', 'Nagybetűk', [['upper', 'CSUPA NAGYBETŰ'], ['none', 'Ahogy írtam']])}
      {select('align', 'Igazítás', [['left', 'Balra'], ['center', 'Középre'], ['right', 'Jobbra']])}
      <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={l.underline === true} onChange={(e) => set('underline', e.target.checked || '')} />Aláhúzott</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1 }}>Eltolás vízszintesen (px)
          <input style={inputStyle} type="number" placeholder="0" value={l.x === undefined ? '' : String(l.x)} onChange={(e) => set('x', e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
        <label style={{ flex: 1 }}>Eltolás függőlegesen (px)
          <input style={inputStyle} type="number" placeholder="0" value={l.y === undefined ? '' : String(l.y)} onChange={(e) => set('y', e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      </div>
      {isBox && (
        <label>Térköz fent és lent (px)
          <input style={inputStyle} type="number" min={0} max={300} placeholder="alap" value={l.pad === undefined ? '' : String(l.pad)} onChange={(e) => set('pad', e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      )}
    </Dialog>
  )
}

function Dialog({ title, children, onClose, onSubmit, busy, err, submitLabel = 'Mentés', extra }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void; busy: boolean; err: string; submitLabel?: string | null; extra?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 200 }}>
      <form
        onSubmit={(e) => (e.preventDefault(), onSubmit())}
        style={{ background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', borderRadius: 8, padding: 20, width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', display: 'grid', gap: 12 }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        {children}
        {err && <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', position: 'sticky', bottom: -20, margin: '0 -20px -20px', padding: '12px 20px', background: 'var(--theme-elevation-0)', borderTop: '1px solid var(--theme-elevation-150)' }}>
          {extra}
          <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={onClose}>{submitLabel ? 'Mégse' : 'Bezárás'}</button>
          {submitLabel && <button type="submit" className="btn btn--style-primary btn--size-small" style={{ margin: 0 }} disabled={busy}>{busy ? 'Mentés…' : submitLabel}</button>}
        </div>
      </form>
    </div>
  )
}

const inputStyle = { width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--theme-elevation-250)', background: 'var(--theme-input-bg, var(--theme-elevation-50))', color: 'inherit', font: 'inherit' }
const LINK_HELP = 'Google Drive: jobb klikk a képen → Megosztás → „Bárki, aki rendelkezik a linkkel” → Link másolása. Más https képlink is jó.'

function ImageModal({ onClose, onSave }: { onClose: () => void; onSave: (mediaId: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const link = useRef(''), alt = useRef('')
  const submit = async () => {
    if (!/^https:\/\//i.test(link.current.trim())) return setErr('Illessz be egy https:// kezdetű linket.')
    setBusy(true)
    try {
      onSave(await createMedia(link.current, alt.current))
    } catch (e) {
      setErr(`Nem sikerült: ${(e as Error).message}`)
      setBusy(false)
    }
  }
  return (
    <Dialog title="Kép cseréje" onClose={onClose} onSubmit={submit} busy={busy} err={err}>
      <label>Google Drive link<input autoFocus style={inputStyle} placeholder="https://drive.google.com/file/d/…/view" onChange={(e) => (link.current = e.target.value)} /></label>
      <small>{LINK_HELP}</small>
      <label>Leírás (mi látható a képen)<input style={inputStyle} onChange={(e) => (alt.current = e.target.value)} /></label>
    </Dialog>
  )
}

// a card's gallery: one image link per line (the admin turns Drive links into direct image URLs on save)
function GalleryModal({ value, uploaded, onClose, onSave }: { value: string; uploaded: number; onClose: () => void; onSave: (text: string) => void }) {
  const [err, setErr] = useState('')
  const text = useRef(value)
  const submit = () => {
    const lines = text.current.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.some((l) => !/^https:\/\//i.test(l))) return setErr('Minden sor egy https:// kezdetű link legyen.')
    if (lines.length + uploaded > 10) return setErr(`Legfeljebb 10 kép lehet${uploaded ? ` (${uploaded} feltöltött kép már van)` : ''}.`)
    onSave(lines.join('\n'))
  }
  return (
    <Dialog title="Galéria" onClose={onClose} onSubmit={submit} busy={false} err={err}>
      <label>
        Képek linkje, soronként egy (max 10)
        <textarea autoFocus rows={8} style={inputStyle} defaultValue={value} placeholder={'https://drive.google.com/file/d/…/view\nhttps://drive.google.com/file/d/…/view'} onChange={(e) => (text.current = e.target.value)} />
      </label>
      <small>{LINK_HELP} A kártya sarkában az első 2 kép látszik, kattintásra nagyban lapozható az összes. Üresen hagyva nincs galéria.</small>
    </Dialog>
  )
}

// an image field in a settings panel: shows the current image and its link; a changed link becomes a new image on save
function UploadField({ label, id, onChange }: { label?: string; id?: string; onChange: (link: string) => void }) {
  const [cur, setCur] = useState<{ link: string; src: string } | null>(null)
  useEffect(() => {
    if (!id) return
    fetch(`/admin/api/media/${id}?depth=0`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && setCur({ link: m.driveUrl || m.url || '', src: m.thumbnailURL || m.url || '' }))
      .catch(() => {})
  }, [id])
  return (
    <label>{label} – kép linkje
      {cur?.src && <img src={cur.src} alt="" style={{ display: 'block', maxWidth: 160, maxHeight: 90, objectFit: 'cover', margin: '6px 0', borderRadius: 4 }} />}
      {/* key: the current link arrives after the first render */}
      <input key={cur?.link ?? ''} style={inputStyle} defaultValue={cur?.link ?? ''} placeholder="https://drive.google.com/file/d/…/view" onChange={(e) => onChange(e.target.value.trim() === (cur?.link ?? '') ? '' : e.target.value)} />
    </label>
  )
}

function SettingsModal({ title, fields, value, onClose, onSave, onAdd, top }: { title: string; fields: Schema[]; value: Doc; onClose: () => void; onSave: (v: Doc) => void; onAdd?: (list: string) => void; top?: React.ReactNode }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const links = useRef(new Map<string, string>()) // upload field path -> new image link
  const [, rerender] = useState(0) // a changed "type" shows/hides the fields that depend on it
  const submit = async () => {
    setBusy(true)
    try {
      for (const [p, link] of links.current) if (link.trim()) setPath(value, p, await createMedia(link, ''))
      onSave(value)
    } catch (e) {
      setErr(`Nem sikerült: ${(e as Error).message}`)
      setBusy(false)
    }
  }
  return (
    <Dialog title={title} onClose={onClose} onSubmit={submit} busy={busy} err={err}>
      {top}
      <Fields fields={fields} obj={value} prefix="" links={links.current} onAdd={onAdd} onChange={() => rerender((n) => n + 1)} />
    </Dialog>
  )
}

function Fields({ fields, obj, prefix, links, onAdd, onChange }: { fields: Schema[]; obj: Doc; prefix: string; links: Map<string, string>; onAdd?: (list: string) => void; onChange?: () => void }) {
  return (
    <>
      {fields.map((f) => {
        const v = obj[f.name]
        if (f.showFor && !f.showFor.includes(String(obj.type ?? ''))) return null
        const set = (x: unknown) => {
          obj[f.name] = x
          if (f.name === 'type') onChange?.()
        }
        const key = prefix + f.name
        if (f.type === 'heading') return f.label ? <h4 key={`h-${f.label}`} style={{ margin: '8px 0 0', borderBottom: '1px solid var(--theme-elevation-150)', paddingBottom: 4 }}>{f.label}</h4> : null
        if (f.type === 'group')
          return (
            <fieldset key={key} style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6, padding: 12, display: 'grid', gap: 10 }}>
              <legend>{f.label}</legend>
              <Fields fields={f.fields ?? []} obj={(obj[f.name] ??= {}) as Doc} prefix={`${key}.`} links={links} onAdd={onAdd} onChange={onChange} />
            </fieldset>
          )
        if (f.type === 'checkbox')
          return <label key={key} style={{ display: 'flex', gap: 8 }}><input type="checkbox" defaultChecked={!!v} onChange={(e) => set(e.target.checked)} />{f.label}</label>
        if (f.type === 'upload') return <UploadField key={key} label={f.label} id={typeof v === 'string' ? v : undefined} onChange={(link) => links.set(key, link)} />
        if (f.type === 'array')
          return onAdd ? (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{f.label}: {((v as unknown[]) ?? []).length} elem – az oldalon húzhatók, másolhatók, törölhetők.</span>
              <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => onAdd(key)}>+ Új elem</button>
            </div>
          ) : null
        let input: React.ReactNode
        if (f.options)
          input = (
            <select style={inputStyle} defaultValue={String(v ?? '')} onChange={(e) => set(e.target.value || null)}>
              <option value="">–</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )
        else if (f.hasMany) input = <textarea style={inputStyle} rows={4} defaultValue={((v as string[]) ?? []).join('\n')} onChange={(e) => set(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
        else if (f.type === 'textarea') input = <textarea style={inputStyle} rows={3} defaultValue={String(v ?? '')} onChange={(e) => set(e.target.value)} />
        else if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v))
          input = <input style={{ ...inputStyle, height: 40, padding: 2 }} type="color" defaultValue={v} onChange={(e) => set(e.target.value)} />
        else if (['text', 'email', 'number', 'date'].includes(f.type))
          input = <input style={inputStyle} type={f.type === 'number' ? 'number' : 'text'} defaultValue={String(v ?? '')} onChange={(e) => set(f.type === 'number' ? Number(e.target.value) : e.target.value)} />
        else return null // lists, rich text: edited on the page
        return <label key={key}>{f.label}{f.hasMany && ' (soronként egy)'}{input}</label>
      })}
    </>
  )
}
