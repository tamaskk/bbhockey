'use client'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

// colour picker + hex code for a text field
export const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path ?? field.name })
  const label = typeof field.label === 'string' ? field.label : field.name
  const ok = /^#[0-9a-f]{6}$/i.test(value ?? '')
  return (
    <div className="field-type" style={{ marginBottom: 16 }}>
      <label className="field-label" htmlFor={`c-${path}`}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" aria-label={label} value={ok ? value : '#000000'} onChange={(e) => setValue(e.target.value)} style={{ width: 44, height: 36, padding: 0, border: 0, background: 'none', cursor: 'pointer' }} />
        <input id={`c-${path}`} value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder="#rrggbb" style={{ width: 110, height: 36, padding: '0 10px', background: 'var(--theme-input-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-elevation-150)', borderRadius: 4, fontFamily: 'monospace' }} />
      </div>
    </div>
  )
}
