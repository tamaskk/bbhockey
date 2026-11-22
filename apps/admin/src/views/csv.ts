// Submissions -> CSV that Excel opens correctly (UTF-8 BOM, ";" separator as in Hungarian Excel). Tested in csv.test.ts.
type Row = { createdAt?: string; statusz?: string | null; fizetve?: boolean | null; kozlemeny?: string | null; valaszok?: { kerdes?: string | null; valasz?: string | null }[] | null }

const cell = (v: string) => {
  // a leading = + - @ would run as a formula in Excel
  const s = /^[=+\-@]/.test(v) ? `'${v}` : v
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// header + one line per submission; shared by the CSV and the XLSX export
export function toTable(rows: Row[], folderOf: (r: Row) => string, statusLabel: (s?: string | null) => string): string[][] {
  // one column per question, in the order they first appear
  const questions = [...new Set(rows.flatMap((r) => (r.valaszok ?? []).map((a) => a.kerdes ?? '')).filter(Boolean))]
  const head = ['Beérkezett', 'Mappa', 'Státusz', 'Fizetett', 'Közlemény', ...questions]
  const lines = rows.map((r) => {
    const by = new Map((r.valaszok ?? []).map((a) => [a.kerdes ?? '', a.valasz ?? '']))
    const date = r.createdAt ? new Date(r.createdAt).toLocaleString('hu-HU') : ''
    return [date, folderOf(r), statusLabel(r.statusz), r.fizetve ? 'Igen' : 'Nem', r.kozlemeny ?? '', ...questions.map((q) => by.get(q) ?? '')]
  })
  return [head, ...lines]
}

export const toCsv = (rows: Row[], folderOf: (r: Row) => string, statusLabel: (s?: string | null) => string): string =>
  '﻿' + toTable(rows, folderOf, statusLabel).map((l) => l.map(cell).join(';')).join('\r\n')
