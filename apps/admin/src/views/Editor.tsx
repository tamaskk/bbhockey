'use client'
import { useEffect, useRef, useState } from 'react'

type Doc = Record<string, unknown>

// Sets an existing value at "a.b.0.c". Refuses paths that don't exist yet, so the iframe can't invent fields.
export function setPath(doc: Doc, path: string, value: unknown): boolean {
  const keys = path.split('.')
  const last = keys.pop()!
  let o: unknown = doc
  for (const k of keys) {
    if (!o || typeof o !== 'object' || !(k in o)) return false
    o = (o as Doc)[k]
  }
  if (!o || typeof o !== 'object') return false
  ;(o as Doc)[last] = value
  return true
}

const API = '/api/globals/fooldal?depth=0'

export function Editor({ webUrl }: { webUrl: string }) {
  const doc = useRef<Doc | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [status, setStatus] = useState('Betöltés…')
  const [error, setError] = useState(false)

  useEffect(() => {
    const origin = new URL(webUrl).origin
    fetch(API)
      .then((r) => r.json())
      .then((d) => {
        const { id: _id, createdAt: _c, updatedAt: _u, globalType: _g, ...rest } = d
        doc.current = rest
        setStatus('Kattints egy szövegre a szerkesztéshez, a szekciókat a ⠿ gombbal húzhatod.')
      })
      .catch(() => (setError(true), setStatus('Nem sikerült betölteni a tartalmat.')))

    const save = async () => {
      timer.current = undefined
      setStatus('Mentés…')
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc.current),
        })
        const body = await res.json().catch(() => ({}))
        setError(!res.ok)
        // Payload validation errors, e.g. a required title left empty
        setStatus(res.ok ? 'Mentve ✓' : `Nem mentve: ${body?.errors?.[0]?.data?.errors?.map((e: { message: string }) => e.message).join(', ') || body?.errors?.[0]?.message || res.status}`)
      } catch {
        setError(true)
        setStatus('Nem mentve: nincs kapcsolat.')
      }
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || !e.data?.bbEdit || !doc.current) return
      const { path, value } = e.data
      if (typeof path !== 'string') return
      const ok = path === 'order'
        ? Array.isArray(value) && value.every((v) => typeof v === 'string') && ((doc.current.order = value), true)
        : (typeof value === 'string' || typeof value === 'boolean') && setPath(doc.current, path, value)
      if (!ok) return
      setStatus('Változás…')
      clearTimeout(timer.current)
      timer.current = setTimeout(save, 800)
    }
    // don't lose a pending edit when leaving within the debounce window
    const onLeave = (e: BeforeUnloadEvent) => {
      if (timer.current) e.preventDefault()
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [webUrl])

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--theme-elevation-150)' }}>
        <a href="/admin" style={{ fontWeight: 600 }}>← Admin</a>
        <strong>Oldalszerkesztő</strong>
        <span role="status" style={{ color: error ? 'var(--theme-error-500)' : 'var(--theme-elevation-600)', flex: 1 }}>{status}</span>
        <a href="/admin/globals/fooldal">Részletes űrlap (képek, listák)</a>
        <a href={webUrl} target="_blank" rel="noreferrer">Oldal megnyitása ↗</a>
      </div>
      <iframe src={`${webUrl}/szerkeszto`} title="Oldalszerkesztő" style={{ flex: 1, border: 0, width: '100%' }} />
    </div>
  )
}
