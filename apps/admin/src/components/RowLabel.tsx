'use client'
import { useRowLabel } from '@payloadcms/ui'

const TYPES: Record<string, string> = {
  text: 'szöveg', email: 'e-mail', tel: 'telefon', date: 'dátum', number: 'szám', textarea: 'hosszú szöveg',
  select: 'legördülő', radio: 'gombok', checkboxes: 'több választás', consent: 'nyilatkozat', note: 'megjegyzés', image: 'kép',
}

// Shows "Label · type · half/full" on collapsed array rows so sorting is easy.
export const FieldRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string; type?: string; width?: string; required?: boolean }>()
  const parts = [TYPES[data?.type ?? ''], data?.width === 'full' ? 'teljes' : 'fél', data?.required && 'kötelező'].filter(Boolean)
  return <span>{data?.label || `Mező ${(rowNumber ?? 0) + 1}`} <span style={{ opacity: 0.55 }}>· {parts.join(' · ')}</span></span>
}

export const GroupRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()
  return <span>{data?.title || `Csoport ${(rowNumber ?? 0) + 1}`}</span>
}
