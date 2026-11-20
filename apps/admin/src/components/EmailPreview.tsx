'use client'
import { useAllFormFields } from '@payloadcms/ui'
import { useMemo, useState } from 'react'
import { directImageUrl } from '../drive'
import { fill, renderEmail, type Design } from '../email/template'

// a made-up applicant, so the preview shows what a real e-mail looks like
const SAMPLE = {
  email: 'szulo@pelda.hu', szulo_keresztnev: 'Anna', szulo_vezeteknev: 'Kovács', szulo_nev: 'Kovács Anna', jatekos_nev: 'Kovács Bence',
  jelentkezes: 'Egyedül jelentkezem', korosztaly: 'U12', telefon: '+36 30 123 4567',
  valaszok: [
    { kerdes: 'Játékos neve', valasz: 'Kovács Bence' }, { kerdes: 'Születési dátum', valasz: '2014-05-12' },
    { kerdes: 'Korosztály', valasz: 'U12' }, { kerdes: 'Póló méret', valasz: 'M' }, { kerdes: 'Allergia', valasz: 'Nincs' },
  ],
}

// live preview of the confirmation e-mail, updated on every keystroke in the form
export function EmailPreview() {
  const [fields] = useAllFormFields()
  const [mobile, setMobile] = useState(false)
  const v = useMemo(() => Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f?.value])) as Record<string, unknown>, [fields])
  const design = { ...(v as Design), logoUrl: v.logoUrl ? directImageUrl(String(v.logoUrl)) : '' }
  const html = renderEmail(String(v.body ?? ''), design, SAMPLE)
  return (
    <div style={{ margin: '8px 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <strong>Előnézet</strong>
        <span style={{ opacity: 0.7 }}>Tárgy: {fill(String(v.subject ?? ''), SAMPLE)}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setMobile((m) => !m)}>
          {mobile ? '🖥 Asztali nézet' : '📱 Telefon nézet'}
        </button>
      </div>
      <iframe title="E-mail előnézet" srcDoc={html} sandbox="" style={{ width: mobile ? 375 : '100%', maxWidth: '100%', height: 640, border: '1px solid var(--theme-elevation-150)', borderRadius: 6, background: '#fff', display: 'block' }} />
      <small style={{ opacity: 0.7 }}>Minta adatokkal (Kovács Anna / Bence). A valódi e-mailben a jelentkező adatai szerepelnek.</small>
    </div>
  )
}
