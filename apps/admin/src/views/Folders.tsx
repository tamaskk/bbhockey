'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toCsv } from './csv'
import { compare, toRegex } from './sort'

type Folder = { id: string; name: string; parent?: string | null; hidden?: boolean | null }
type Sub = {
  id: string; jatekos_nev?: string | null; szulo_nev?: string | null; email?: string | null; telefon?: string | null
  korosztaly?: string | null; statusz?: string | null; csoport?: string | null; createdAt?: string; megjegyzes?: string | null
  fizetve?: boolean | null; kozlemeny?: string | null; osszeg?: string | null
  valaszok?: { kerdes?: string | null; valasz?: string | null; mezo?: string | null }[] | null
}
type Sel = 'all' | 'none' | string

const API = '/admin/api'
const STATUS: Record<string, string> = { uj: 'Új', feldolgozva: 'Feldolgozva', fizetve: 'Fizetve', lemondva: 'Lemondva' }

async function call(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API}${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.errors?.[0]?.message ?? String(res.status))
  return json
}
const idsQuery = (ids: string[]) => ids.map((id, i) => `where[id][in][${i}]=${encodeURIComponent(id)}`).join('&')

const btn = 'btn btn--style-secondary btn--size-small'
const small: React.CSSProperties = { margin: 0 }

export function Folders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [subs, setSubs] = useState<Sub[]>([])
  const [sel, setSel] = useState<Sel>('all')
  const [showHidden, setShowHidden] = useState(false)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null) // folder id being renamed, or "new:<parent>"
  const [msg, setMsg] = useState('Betöltés…')
  const [over, setOver] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [rx, setRx] = useState(false) // search is a regex on the player's and parent's name
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'createdAt', dir: -1 })
  const [view, setView] = useState<string | null>(null) // submission shown in the details modal
  const [formFields, setFormFields] = useState<Map<string, { name: string; type: string }[]>>(new Map())

  const load = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([
        call('/csoportok?depth=0&pagination=false&sort=name'),
        call('/jelentkezesek?depth=0&pagination=false&sort=-createdAt'),
      ])
      setFolders(f.docs)
      setSubs(s.docs)
      // question label -> form field, so an edited answer also updates its own column (name, e-mail, phone…)
      const form = await call('/globals/urlap?depth=0').catch(() => null)
      // a label can repeat (two "Telefonszám" fields): keep every field with it, in form order
      const m = new Map<string, { name: string; type: string }[]>()
      for (const g of form?.groups ?? []) for (const fl of g.fields ?? []) if (fl.label && fl.name) m.set(fl.label, [...(m.get(fl.label) ?? []), { name: fl.name, type: fl.type }])
      setFormFields(m)
      setMsg('')
    } catch (e) {
      setMsg(`Nem sikerült betölteni: ${(e as Error).message}`)
    }
  }, [])
  useEffect(() => void load(), [load])

  const children = useMemo(() => {
    const m = new Map<string | null, Folder[]>()
    for (const f of folders) m.set(f.parent ?? null, [...(m.get(f.parent ?? null) ?? []), f])
    return m
  }, [folders])
  const byId = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders])
  // a folder and everything below it
  const below = useCallback((id: string): string[] => [id, ...(children.get(id) ?? []).flatMap((c) => below(c.id))], [children])
  // hidden itself or inside a hidden folder
  const isHidden = useCallback((id?: string | null): boolean => {
    for (let f = id ? byId.get(id) : undefined; f; f = f.parent ? byId.get(f.parent) : undefined) if (f.hidden) return true
    return false
  }, [byId])
  const path = (id?: string | null) => {
    const names: string[] = []
    for (let f = id ? byId.get(id) : undefined; f; f = f.parent ? byId.get(f.parent) : undefined) names.unshift(f.name)
    return names.join(' / ')
  }

  const list = useMemo(() => {
    let l: Sub[]
    if (sel === 'none') l = subs.filter((s) => !s.csoport || !byId.has(s.csoport))
    else if (sel === 'all') l = subs.filter((s) => showHidden || !isHidden(s.csoport))
    else {
      const ids = new Set(below(sel))
      l = subs.filter((s) => s.csoport && ids.has(s.csoport))
    }
    if (rx && q) {
      const re = toRegex(q)
      if (re) l = l.filter((s) => re.test(s.jatekos_nev ?? '') || re.test(s.szulo_nev ?? ''))
    } else {
      // search in names, contact data and every answer
      const words = q.toLocaleLowerCase('hu').split(/\s+/).filter(Boolean)
      if (words.length)
        l = l.filter((s) => {
          const hay = [s.jatekos_nev, s.szulo_nev, s.email, s.telefon, s.korosztaly, ...(s.valaszok ?? []).map((a) => a.valasz)].join(' ').toLocaleLowerCase('hu')
          return words.every((w) => hay.includes(w))
        })
    }
    const val = (s: Sub): string => {
      if (sort.key.startsWith('q:')) return s.valaszok?.find((a) => a.kerdes === sort.key.slice(2))?.valasz ?? ''
      if (sort.key === 'mappa') return path(s.csoport)
      if (sort.key === 'statusz') return STATUS[s.statusz ?? ''] ?? s.statusz ?? ''
      return String(s[sort.key as keyof Sub] ?? '')
    }
    return [...l].sort((a, b) => compare(val(a), val(b), sort.dir))
  }, [sel, subs, showHidden, below, isHidden, byId, q, rx, sort, path])
  // every question asked on any submission, for "sort by any answer"
  const questions = useMemo(() => [...new Set(subs.flatMap((s) => (s.valaszok ?? []).map((a) => a.kerdes ?? '')).filter(Boolean))], [subs])
  const sortTh = (key: string, label: string) => (
    <th style={{ ...th, cursor: 'pointer', userSelect: 'none' }} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
      onClick={() => setSort((o) => ({ key, dir: o.key === key ? (-o.dir as 1 | -1) : 1 }))}>
      {label} {sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : <span style={{ opacity: 0.3 }}>↕</span>}
    </th>
  )
  const count = (id: string) => { const ids = new Set(below(id)); return subs.filter((s) => s.csoport && ids.has(s.csoport)).length }

  const act = async (what: string, fn: () => Promise<unknown>) => {
    setMsg(`${what}…`)
    try {
      await fn()
      await load()
      setMsg(`${what} ✓`)
    } catch (e) {
      setMsg(`Nem sikerült: ${(e as Error).message}`)
    }
  }
  const moveSubs = (ids: string[], folder: string | null) =>
    act(`${ids.length} jelentkezés áthelyezése`, async () => {
      await call(`/jelentkezesek?${idsQuery(ids)}`, 'PATCH', { csoport: folder })
      setChecked(new Set())
    })
  const moveFolder = (id: string, parent: string | null) => {
    if (parent && below(id).includes(parent)) return setMsg('Mappa nem tehető a saját almappájába.')
    act('Mappa áthelyezése', () => call(`/csoportok/${id}`, 'PATCH', { parent }))
  }
  // Drag with mouse/touch (pointer events; native HTML5 drag is unreliable across browsers).
  // A drag starts after a 6px move, so clicks still select; drop targets carry data-drop="<folder id>|none|root".
  const [ghost, setGhost] = useState<{ x: number; y: number; text: string } | null>(null)
  const startDrag = (e: React.PointerEvent, what: { subs?: string[]; folder?: string }, text: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('input, button, a, select, [role=button]')) return
    const x0 = e.clientX, y0 = e.clientY
    let dragging = false
    const targetAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return
      dragging = true
      document.body.style.userSelect = 'none'
      setGhost({ x: ev.clientX, y: ev.clientY, text })
      setOver(targetAt(ev.clientX, ev.clientY))
    }
    const up = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.body.style.userSelect = ''
      setGhost(null)
      setOver(null)
      if (!dragging) return
      const t = targetAt(ev.clientX, ev.clientY)
      if (!t) return
      const folder = t === 'none' || t === 'root' ? null : t
      if (what.subs?.length) moveSubs(what.subs, folder)
      else if (what.folder && what.folder !== folder) moveFolder(what.folder, folder)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }
  const dropProps = (_target: string | null, key: string) => ({ 'data-drop': key })

  const exportCsv = (rows: Sub[], name: string) => {
    const csv = toCsv(rows, (r) => path((r as Sub).csoport) || '–', (s) => STATUS[s ?? ''] ?? s ?? '')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
      download: `jelentkezesek-${name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const NameInput = ({ initial, onDone }: { initial: string; onDone: (v: string | null) => void }) => (
    <input
      autoFocus
      defaultValue={initial}
      placeholder="Mappa neve"
      onKeyDown={(e) => { if (e.key === 'Enter') onDone(e.currentTarget.value.trim() || null); if (e.key === 'Escape') onDone(null) }}
      onBlur={(e) => onDone(e.currentTarget.value.trim() || null)}
      style={{ flex: 1, minWidth: 0, padding: '4px 6px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-elevation-250)', borderRadius: 4 }}
    />
  )
  const newFolder = (parent: string | null) => (name: string | null) => {
    setEditing(null)
    if (!name) return
    if (parent) setOpen((o) => new Set(o).add(parent))
    act('Mappa létrehozása', () => call('/csoportok', 'POST', { name, parent }))
  }

  const rowStyle = (active: boolean, key: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
    background: over === key ? 'var(--theme-success-100, rgba(0,160,80,.2))' : active ? 'var(--theme-elevation-150)' : 'transparent',
    outline: over === key ? '2px dashed var(--theme-success-500, #16a34a)' : undefined,
  })

  const tree = (parent: string | null, depth: number): React.ReactNode =>
    (children.get(parent) ?? [])
      .filter((f) => showHidden || !f.hidden)
      .map((f) => {
        const kids = (children.get(f.id) ?? []).filter((k) => showHidden || !k.hidden)
        const isOpen = open.has(f.id)
        return (
          <div key={f.id}>
            <div
              className="bb-folder"
              onPointerDown={(e) => editing !== f.id && startDrag(e, { folder: f.id }, `📁 ${f.name}`)}
              {...dropProps(f.id, f.id)}
              onClick={() => setSel(f.id)}
              style={{ ...rowStyle(sel === f.id, f.id), paddingLeft: 8 + depth * 18, opacity: f.hidden ? 0.5 : 1 }}
            >
              <span
                role="button"
                aria-label={isOpen ? 'Összecsukás' : 'Kinyitás'}
                onClick={(e) => (e.stopPropagation(), setOpen((o) => { const n = new Set(o); if (n.has(f.id)) n.delete(f.id); else n.add(f.id); return n }))}
                style={{ width: 14, visibility: kids.length ? 'visible' : 'hidden' }}
              >
                {isOpen ? '▾' : '▸'}
              </span>
              {editing === f.id ? (
                <NameInput initial={f.name} onDone={(v) => { setEditing(null); if (v && v !== f.name) act('Átnevezés', () => call(`/csoportok/${f.id}`, 'PATCH', { name: v })) }} />
              ) : (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📁 {f.name}{f.hidden ? ' (rejtett)' : ''}</span>
              )}
              <span style={{ opacity: 0.6, fontSize: 12 }}>{count(f.id)}</span>
              <span className="bb-folder-tools" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 2 }}>
                <button type="button" title="Új almappa" onClick={() => setEditing(`new:${f.id}`)}>＋</button>
                <button type="button" title="Átnevezés" onClick={() => setEditing(f.id)}>✎</button>
                <button type="button" title={f.hidden ? 'Megjelenítés' : 'Elrejtés'} onClick={() => act(f.hidden ? 'Megjelenítés' : 'Elrejtés', () => call(`/csoportok/${f.id}`, 'PATCH', { hidden: !f.hidden }))}>{f.hidden ? '👁' : '🙈'}</button>
                <button
                  type="button"
                  title="Törlés (a jelentkezések megmaradnak, „Nincs mappában” lesznek)"
                  onClick={(e) => {
                    const b = e.currentTarget
                    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Törlöd?'; setTimeout(() => { delete b.dataset.armed; b.textContent = '🗑' }, 3000); return }
                    if (sel === f.id) setSel('all')
                    act('Mappa törlése', () => call(`/csoportok/${f.id}`, 'DELETE'))
                  }}
                >🗑</button>
              </span>
            </div>
            {editing === `new:${f.id}` && (
              <div style={{ display: 'flex', paddingLeft: 30 + (depth + 1) * 18, paddingRight: 8 }}><NameInput initial="" onDone={newFolder(f.id)} /></div>
            )}
            {isOpen && tree(f.id, depth + 1)}
          </div>
        )
      })

  const allChecked = list.length > 0 && list.every((s) => checked.has(s.id))
  const selName = sel === 'all' ? 'összes' : sel === 'none' ? 'nincs-mappaban' : path(sel)
  const dragRow = (s: Sub) => (e: React.PointerEvent) => {
    // dragging a checked row takes every checked row along
    const ids = checked.has(s.id) ? [...checked] : [s.id]
    startDrag(e, { subs: ids }, ids.length > 1 ? `${ids.length} jelentkezés` : s.jatekos_nev || '1 jelentkezés')
  }
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-150)', fontWeight: 600, whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--theme-elevation-100)' }

  return (
    <div style={{ padding: '24px 0' }}>
      <style>{`.bb-folder .bb-folder-tools{visibility:hidden}.bb-folder:hover .bb-folder-tools{visibility:visible}
.bb-folder-tools button{all:unset;cursor:pointer;padding:2px 5px;border-radius:4px;font-size:13px}.bb-folder-tools button:hover{background:var(--theme-elevation-250)}
.bb-subs tbody tr,.bb-folder{cursor:grab}
.bb-name{all:unset;cursor:pointer;text-decoration:underline;font-weight:600}.bb-name:hover{color:var(--theme-success-500,#16a34a)}.bb-subs tr:hover td{background:var(--theme-elevation-50)}`}</style>
      {view && subs.some((s) => s.id === view) && (
        <Details
          sub={subs.find((s) => s.id === view)!}
          folders={folders.map((f) => ({ id: f.id, name: path(f.id) }))}
          // arrows step through the list as it is currently filtered
          onStep={(d) => { const i = list.findIndex((s) => s.id === view); const n = list[i + d]; if (n) setView(n.id) }}
          position={`${list.findIndex((s) => s.id === view) + 1} / ${list.length}`}
          onClose={() => setView(null)}
          formFields={formFields}
          onSave={(id, data) => act('Mentés', () => call(`/jelentkezesek/${id}`, 'PATCH', data))}
          onDelete={(id) => { setView(null); act('Jelentkezés törlése', () => call(`/jelentkezesek/${id}`, 'DELETE')) }}
        />
      )}
      {ghost && (
        <div style={{ position: 'fixed', left: ghost.x + 12, top: ghost.y + 12, zIndex: 1000, pointerEvents: 'none', background: 'var(--theme-elevation-800)', color: 'var(--theme-elevation-0)', padding: '6px 10px', borderRadius: 6, fontSize: 13, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}>
          {ghost.text}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Jelentkezések</h1>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={rx ? 'Regex a névre, pl. ^Kov|né$' : 'Keresés: név, e-mail, telefon, válasz…'}
          aria-label="Keresés"
          aria-invalid={rx && !!q && !toRegex(q)}
          style={{ width: 'min(320px, 100%)', padding: '8px 10px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: `1px solid ${rx && q && !toRegex(q) ? '#dc2626' : 'var(--theme-elevation-250)'}`, borderRadius: 4, fontFamily: rx ? 'monospace' : undefined }}
        />
        <button type="button" className={btn} style={{ ...small, ...(rx && { background: 'var(--theme-success-500, #16a34a)', color: '#fff' }) }} aria-pressed={rx}
          title="Regex keresés a játékos és a szülő nevére" onClick={() => setRx((v) => !v)}>.* Regex</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Rendezés:
          <select value={sort.key} onChange={(e) => setSort((o) => ({ ...o, key: e.target.value }))}
            style={{ padding: '7px 8px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-elevation-250)', borderRadius: 4, maxWidth: 220 }}>
            <optgroup label="Oszlopok">
              {[['createdAt', 'Beérkezett'], ['jatekos_nev', 'Játékos'], ['szulo_nev', 'Szülő'], ['email', 'E-mail'], ['telefon', 'Telefon'], ['korosztaly', 'Korosztály'], ['mappa', 'Mappa'], ['statusz', 'Státusz']].map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </optgroup>
            <optgroup label="Bármelyik kérdés">
              {questions.map((k) => <option key={k} value={`q:${k}`}>{k}</option>)}
            </optgroup>
          </select>
          <button type="button" className={btn} style={small} title="Irány megfordítása" onClick={() => setSort((o) => ({ ...o, dir: (-o.dir as 1 | -1) }))}>{sort.dir === 1 ? '▲ A→Z' : '▼ Z→A'}</button>
        </label>
        <span role="status" style={{ opacity: 0.75 }}>{msg}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 24, alignItems: 'start' }}>
        <aside style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: 8, position: 'sticky', top: 80 }}>
          <div onClick={() => setSel('all')} style={rowStyle(sel === 'all', 'all')}>
            <span style={{ flex: 1 }}>🗂 Összes jelentkezés</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>{subs.filter((s) => showHidden || !isHidden(s.csoport)).length}</span>
          </div>
          <div onClick={() => setSel('none')} {...dropProps(null, 'none')} style={rowStyle(sel === 'none', 'none')}>
            <span style={{ flex: 1 }}>📥 Nincs mappában</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>{subs.filter((s) => !s.csoport || !byId.has(s.csoport)).length}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--theme-elevation-150)', margin: '6px 0' }} />
          {/* dropping a folder here moves it to the top level */}
          <div {...dropProps(null, 'root')} style={{ minHeight: 8, borderRadius: 6, outline: over === 'root' ? '2px dashed var(--theme-success-500, #16a34a)' : undefined }}>
            {tree(null, 0)}
            {editing === 'new:' && <div style={{ display: 'flex', padding: '4px 8px' }}><NameInput initial="" onDone={newFolder(null)} /></div>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className={btn} style={small} onClick={() => setEditing('new:')}>＋ Új mappa</button>
            {folders.some((f) => f.hidden) && (
              <button type="button" className={btn} style={small} onClick={() => setShowHidden((v) => !v)}>
                {showHidden ? '🙈 Rejtettek elrejtése' : `👁 Rejtett mappák (${folders.filter((f) => f.hidden).length})`}
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, opacity: 0.65, margin: '10px 4px 2px' }}>
            Jelentkezést vagy mappát egérrel ráhúzhatsz egy mappára. Mappa fölé víve: ＋ almappa, ✎ átnevezés, 🙈 elrejtés, 🗑 törlés.
          </p>
        </aside>

        <section style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <strong style={{ flex: 1 }}>{sel === 'all' ? 'Összes jelentkezés' : sel === 'none' ? 'Nincs mappában' : `📁 ${path(sel)}`} · {list.length} db</strong>
            {checked.size > 0 && (
              <>
                <span>{checked.size} kijelölve →</span>
                <select
                  aria-label="Áthelyezés mappába"
                  value=""
                  onChange={(e) => e.target.value && moveSubs([...checked], e.target.value === '-' ? null : e.target.value)}
                  style={{ padding: '6px 8px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-elevation-250)', borderRadius: 4 }}
                >
                  <option value="">Áthelyezés mappába…</option>
                  <option value="-">📥 Nincs mappában</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>📁 {path(f.id)}</option>)}
                </select>
                <button type="button" className={btn} style={small} onClick={() => exportCsv(subs.filter((s) => checked.has(s.id)), 'kijelolt')}>⬇ Kijelöltek exportja</button>
              </>
            )}
            <button type="button" className="btn btn--style-primary btn--size-small" style={small} disabled={!list.length} onClick={() => exportCsv(list, selName)}>
              ⬇ Export Excelbe (CSV)
            </button>
          </div>
          {list.length === 0 ? (
            <p style={{ opacity: 0.7, padding: 24, textAlign: 'center', border: '1px dashed var(--theme-elevation-250)', borderRadius: 8 }}>
              {msg === 'Betöltés…' || msg.startsWith('Nem sikerült betölteni') ? msg : sel === 'all' && folders.some((f) => f.hidden) ? 'Nincs látható jelentkezés. A rejtett mappákban lévők a „👁 Rejtett mappák” gombbal látszanak.' : 'Ebben a mappában nincs jelentkezés. Húzz ide jelentkezéseket a bal oldali mappára engedve.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--theme-elevation-150)', borderRadius: 8 }}>
              <table className="bb-subs" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={th}><input type="checkbox" aria-label="Összes kijelölése" checked={allChecked} onChange={() => setChecked(allChecked ? new Set() : new Set(list.map((s) => s.id)))} /></th>
                    {sortTh('jatekos_nev', 'Játékos')}{sortTh('szulo_nev', 'Szülő')}{sortTh('email', 'E-mail')}{sortTh('telefon', 'Telefon')}
                    {sortTh('korosztaly', 'Korosztály')}{sortTh('mappa', 'Mappa')}{sortTh('statusz', 'Státusz')}<th style={th}>Fizetett</th>{sortTh('createdAt', 'Beérkezett')}
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.id} onPointerDown={dragRow(s)}>
                      <td style={td}><input type="checkbox" aria-label="Kijelölés" checked={checked.has(s.id)} onChange={() => setChecked((c) => { const n = new Set(c); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n })} /></td>
                      <td style={td}><button type="button" className="bb-name" onClick={() => setView(s.id)}>{s.jatekos_nev || '(név nélkül)'}</button></td>
                      <td style={td}>{s.szulo_nev}</td>
                      <td style={td}>{s.email}</td>
                      <td style={td}>{s.telefon}</td>
                      <td style={td}>{s.korosztaly}</td>
                      <td style={td}>{path(s.csoport) || '–'}</td>
                      <td style={td}>{STATUS[s.statusz ?? ''] ?? s.statusz}</td>
                      <td style={{ ...td, textAlign: 'center' }} onPointerDown={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Fizetett: ${s.jatekos_nev ?? ''}`} title={s.kozlemeny ? `Közlemény: ${s.kozlemeny}` : undefined} checked={!!s.fizetve} onChange={(e) => act('Mentés', () => call(`/jelentkezesek/${s.id}`, 'PATCH', { fizetve: e.target.checked }))} />
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('hu-HU') : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const field: React.CSSProperties = { width: '100%', padding: '7px 9px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-elevation-250)', borderRadius: 4, font: 'inherit' }

// one submission: every answer, plus status / folder / internal note editable in place
// columns a form field must never overwrite (same list as apps/web api/submit RESERVED)
const RESERVED = new Set(['id', '_id', 'createdAt', 'updatedAt', 'statusz', 'megjegyzes', 'valaszok', 'jatekos_nev', 'szulo_nev', 'csoport', 'fizetve', 'kozlemeny', 'osszeg'])

function Details({ sub, folders, position, formFields, onStep, onClose, onSave, onDelete }: {
  sub: Sub; folders: { id: string; name: string }[]; position: string; formFields: Map<string, { name: string; type: string }[]>
  onStep: (d: -1 | 1) => void; onClose: () => void
  onSave: (id: string, data: Partial<Sub>) => void; onDelete: (id: string) => void
}) {
  const [armed, setArmed] = useState(false)
  const [draft, setDraft] = useState<string[] | null>(null) // answers being edited
  useEffect(() => (setArmed(false), setDraft(null)), [sub.id])
  const saveAnswers = () => {
    if (!draft) return
    const valaszok = (sub.valaszok ?? []).map((a, i) => ({ ...a, valasz: draft[i] ?? a.valasz }))
    const data: Record<string, unknown> = { valaszok }
    // answers are stored in form order, so the n-th answer with a label belongs to the n-th field with that label
    const seen = new Map<string, number>()
    valaszok.forEach((a, i) => {
      const n = seen.get(a.kerdes ?? '') ?? 0
      seen.set(a.kerdes ?? '', n + 1)
      // newer submissions store the field name; older ones are matched by label and position
      const byName = a.mezo ? [...formFields.values()].flat().find((x) => x.name === a.mezo) : undefined
      const f = byName ?? (a.kerdes ? formFields.get(a.kerdes)?.[n] : undefined)
      if (!f || RESERVED.has(f.name) || draft[i] === (sub.valaszok?.[i]?.valasz ?? '')) return
      data[f.name] = f.type === 'consent' ? /^igen$/i.test(draft[i].trim()) : draft[i]
    })
    onSave(sub.id, data as Partial<Sub>)
    setDraft(null)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'Escape') return draft ? setDraft(null) : onClose()
      if (draft) return // don't leave unsaved edits with the arrows
      if (e.key === 'ArrowLeft') onStep(-1)
      if (e.key === 'ArrowRight') onStep(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep, draft])
  const answers = (sub.valaszok ?? []).map((a, i) => ({ ...a, i })).filter((a) => a.kerdes)
  const link = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? <a href={`mailto:${v}`}>{v}</a> : /^\+?[\d\s()/-]{7,}$/.test(v) ? <a href={`tel:${v.replace(/[^\d+]/g, '')}`}>{v}</a> : v
  return (
    <div role="dialog" aria-modal="true" aria-label={sub.jatekos_nev ?? 'Jelentkezés'} onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 300 }}>
      <div style={{ background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', borderRadius: 10, width: 'min(720px, 100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid var(--theme-elevation-150)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{sub.jatekos_nev || '(név nélkül)'}</h2>
            <small style={{ opacity: 0.7 }}>Beérkezett: {sub.createdAt ? new Date(sub.createdAt).toLocaleString('hu-HU') : '–'} · {position}</small>
          </div>
          <button type="button" className={btn} style={small} title="Előző (←)" onClick={() => onStep(-1)}>←</button>
          <button type="button" className={btn} style={small} title="Következő (→)" onClick={() => onStep(1)}>→</button>
          <button type="button" className={btn} style={small} title="Bezárás (Esc)" onClick={onClose}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: '16px 20px', display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <label>Státusz
              <select key={`s${sub.id}`} style={field} defaultValue={sub.statusz ?? 'uj'} onChange={(e) => onSave(sub.id, { statusz: e.target.value })}>
                {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>Mappa
              <select key={`f${sub.id}`} style={field} defaultValue={sub.csoport ?? ''} onChange={(e) => onSave(sub.id, { csoport: e.target.value || null })}>
                <option value="">📥 Nincs mappában</option>
                {folders.map((f) => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input key={`p${sub.id}`} type="checkbox" defaultChecked={!!sub.fizetve} onChange={(e) => onSave(sub.id, { fizetve: e.target.checked })} />
              Fizetett{sub.osszeg ? ` (${sub.osszeg})` : ''}
            </label>
            {sub.kozlemeny && <div><small style={{ opacity: 0.7 }}>Utalás közleménye</small><br /><b>{sub.kozlemeny}</b></div>}
          </div>
          <label>Belső megjegyzés (csak az adminban látszik)
            <textarea key={`m${sub.id}`} style={{ ...field, minHeight: 60 }} defaultValue={sub.megjegyzes ?? ''} placeholder="pl. befizetve, kapus edzésre kéri…"
              onBlur={(e) => e.target.value !== (sub.megjegyzes ?? '') && onSave(sub.id, { megjegyzes: e.target.value })} />
          </label>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {answers.length ? answers.map((a, n) => (
                <tr key={a.i} style={{ background: n % 2 ? 'transparent' : 'var(--theme-elevation-50)' }}>
                  <td style={{ padding: '7px 10px', width: '40%', opacity: 0.75, verticalAlign: draft ? 'middle' : 'top' }}>{a.kerdes}</td>
                  <td style={{ padding: draft ? '4px 10px' : '7px 10px', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {draft ? (
                      (draft[a.i] ?? '').length > 60 || (draft[a.i] ?? '').includes('\n') ? (
                        <textarea aria-label={a.kerdes ?? ''} style={{ ...field, minHeight: 70 }} value={draft[a.i] ?? ''} onChange={(e) => setDraft((d) => d && Object.assign([...d], { [a.i]: e.target.value }))} />
                      ) : (
                        <input aria-label={a.kerdes ?? ''} style={field} value={draft[a.i] ?? ''} onChange={(e) => setDraft((d) => d && Object.assign([...d], { [a.i]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && saveAnswers()} />
                      )
                    ) : a.valasz ? link(a.valasz) : <span style={{ opacity: 0.4 }}>–</span>}
                  </td>
                </tr>
              )) : <tr><td style={{ padding: 10, opacity: 0.7 }}>Nincsenek elmentett válaszok.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--theme-elevation-150)', flexWrap: 'wrap' }}>
          <button type="button" className={btn} style={{ ...small, ...(armed && { background: '#dc2626', color: '#fff' }) }}
            onClick={() => (armed ? onDelete(sub.id) : setArmed(true))}>{armed ? 'Biztosan törlöd? Kattints újra' : '🗑 Törlés'}</button>
          <span style={{ flex: 1 }} />
          {draft ? (
            <>
              <button type="button" className={btn} style={small} onClick={() => setDraft(null)}>Mégse</button>
              <button type="button" className="btn btn--style-primary btn--size-small" style={small} onClick={saveAnswers}>💾 Mentés</button>
            </>
          ) : (
            <>
              <button type="button" className={btn} style={small} onClick={() => setDraft((sub.valaszok ?? []).map((a) => a.valasz ?? ''))}>✎ Szerkesztés</button>
              <button type="button" className="btn btn--style-primary btn--size-small" style={small} onClick={onClose}>Kész</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
