import type { GlobalConfig } from 'payload'
import { ADATKEZELES, ASZF, IMPRESSZUM, NYILATKOZAT, SUTIK } from '../documents'
import { revalidateHook } from '../revalidate'

const help = 'Üres sor: új bekezdés. "## " a sor elején: címsor, "- " a sor elején: felsorolás.'
const doc = (name: string, label: string, path: string, defaultValue: string) => ({
  name,
  label,
  type: 'textarea' as const,
  defaultValue,
  admin: { rows: 30, description: `Oldal: bbskills.hu/${path}. ${help}` },
})

// legal pages (ÁSZF, privacy policy, imprint, cookies), each shown on its own page of the site
export const Dokumentumok: GlobalConfig = {
  slug: 'dokumentumok',
  label: 'Jogi dokumentumok',
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateHook] },
  fields: [
    doc('aszf', 'Általános Szerződési Feltételek', 'aszf', ASZF),
    doc('adatkezeles', 'Adatkezelési tájékoztató', 'adatkezeles', ADATKEZELES),
    doc('nyilatkozat', 'Beleegyező nyilatkozat (GDPR, saját felelősség)', 'nyilatkozat', NYILATKOZAT),
    doc('impresszum', 'Impresszum', 'impresszum', IMPRESSZUM),
    doc('sutik', 'Süti tájékoztató', 'sutik', SUTIK),
  ],
}
