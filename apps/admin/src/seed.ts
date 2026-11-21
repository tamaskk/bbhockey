// One-off: fill the CMS with the current (dummy) site content. Run: pnpm --filter admin seed
// Skips if the Settings global already has a logo, so it never overwrites edits made in the admin.
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import config from './payload.config'
import { beallitasokData, defaultGroups, fooldalData, MEDIA, type Media, urlapData } from './defaults'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const img = (f: string) => path.resolve(dirname, '../../web/public/img', f)

const payload = await getPayload({ config })

const existing = await payload.findGlobal({ slug: 'beallitasok' })
if (existing.logo) {
  // content exists: only fill the form builder if it is still empty (migration from the fixed form)
  const form = await payload.findGlobal({ slug: 'urlap' })
  if (!form.groups?.length) {
    const chart = await payload.find({ collection: 'media', where: { alt: { equals: 'Póló és pulóver mérettáblázat' } }, limit: 1 })
    await payload.updateGlobal({ slug: 'urlap', data: { groups: defaultGroups(chart.docs[0] && String(chart.docs[0].id), existing.privacyUrl) } })
    payload.logger.info('Form fields migrated.')
  } else payload.logger.info('Seed skipped: content already exists.')
  process.exit(0)
}

const upload = async (file: string, alt: string) =>
  String((await payload.create({ collection: 'media', data: { alt }, filePath: img(file) })).id)

const m: Media = {}
for (const [key, [file, alt]] of Object.entries(MEDIA)) m[key as keyof Media] = await upload(file, alt)

await payload.updateGlobal({ slug: 'beallitasok', data: beallitasokData(m) })
await payload.updateGlobal({ slug: 'fooldal', data: fooldalData(m) })
await payload.updateGlobal({ slug: 'urlap', data: urlapData(m) })

payload.logger.info('Seed done.')
process.exit(0)
