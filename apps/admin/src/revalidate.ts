// Tell the public site to drop its cached CMS content so edits show on the next page load.
export async function revalidateWeb(): Promise<void> {
  // on Vercel both apps share one deployment; its rewrites send /api/* to web (a web binding here would be circular)
  const url = process.env.WEB_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
  const secret = process.env.SHARED_SECRET
  if (!url || !secret) return
  try {
    const res = await fetch(`${url}/api/revalidate`, { method: 'POST', headers: { 'x-shared-secret': secret } })
    if (!res.ok) console.error(`[revalidate] web answered ${res.status}`)
  } catch (err) {
    // the save itself must not fail because the site is unreachable
    console.error('[revalidate] web unreachable', err)
  }
}

export const revalidateHook = async () => {
  await revalidateWeb()
}
