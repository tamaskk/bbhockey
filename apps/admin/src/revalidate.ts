// Tell the public site to drop its cached CMS content so edits show on the next page load.
export async function revalidateWeb(): Promise<void> {
  const url = process.env.WEB_URL
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
