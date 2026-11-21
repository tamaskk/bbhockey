import { commitTransaction, initTransaction, killTransaction, type Endpoint } from 'payload'
import baseline from './baseline.json'

const SYSTEM = ['id', 'createdAt', 'updatedAt', 'globalType']

// POST /admin/api/alaphelyzet: the editor's "Alaphelyzet" button. Puts the page content, settings and form
// back to baseline.json (the 2026-11-13 version of the site from the earlier database), in one transaction so a failure changes nothing.
// To make the current state the new baseline: dump the three globals from the database into baseline.json.
export const resetEndpoint: Endpoint = {
  path: '/alaphelyzet',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Bejelentkezés szükséges' }] }, { status: 401 })
    const shouldCommit = await initTransaction(req)
    try {
      for (const [slug, data] of Object.entries(baseline) as [keyof typeof baseline, Record<string, unknown>][]) {
        const current = (await req.payload.findGlobal({ slug, depth: 0, req })) as Record<string, unknown>
        // fields added after the snapshot are cleared too
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
