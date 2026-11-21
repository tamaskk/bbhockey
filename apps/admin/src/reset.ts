import { commitTransaction, initTransaction, killTransaction, type Endpoint } from 'payload'
import { beallitasokData, fooldalData, MEDIA, type Media, urlapData } from './defaults'

const SYSTEM = ['id', 'createdAt', 'updatedAt', 'globalType']

// POST /admin/api/alaphelyzet: the editor's "Alaphelyzet" button. Puts the page content, settings and form
// back to the original (seed) content, in one transaction so a failure leaves everything as it was.
export const resetEndpoint: Endpoint = {
  path: '/alaphelyzet',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Bejelentkezés szükséges' }] }, { status: 401 })
    const shouldCommit = await initTransaction(req)
    try {
      // the original images are already uploaded: find them by alt text (missing ones stay empty)
      const m: Media = {}
      for (const [key, [, alt]] of Object.entries(MEDIA)) {
        const found = await req.payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1, depth: 0, req })
        if (found.docs[0]) m[key as keyof Media] = String(found.docs[0].id)
      }
      const all = { beallitasok: beallitasokData(m), fooldal: fooldalData(m), urlap: urlapData(m) }
      for (const [slug, data] of Object.entries(all) as [keyof typeof all, Record<string, unknown>][]) {
        const current = (await req.payload.findGlobal({ slug, depth: 0, req })) as Record<string, unknown>
        // fields the seed never set (styles, section order, custom sections, fonts…) are cleared too
        const cleared = Object.fromEntries(
          Object.keys(current).filter((k) => !SYSTEM.includes(k) && !(k in data)).map((k) => [k, Array.isArray(current[k]) ? [] : null]),
        )
        await req.payload.updateGlobal({ slug, data: { ...cleared, ...data } as never, depth: 0, req })
      }
      if (shouldCommit) await commitTransaction(req)
      return Response.json({ ok: true })
    } catch (err) {
      if (shouldCommit) await killTransaction(req)
      req.payload.logger.error({ err, msg: '[alaphelyzet] reset failed' })
      return Response.json({ errors: [{ message: 'A visszaállítás nem sikerült, semmi nem változott.' }] }, { status: 500 })
    }
  },
}
