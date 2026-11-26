// Google Drive share links ("…/file/d/<id>/view", "…open?id=<id>", "…uc?id=<id>") point to an HTML page, not the image.
// shortcut: lh3.googleusercontent.com/d/<id> is Google's unofficial direct-image URL; if Google drops it, switch to drive.google.com/thumbnail?id=<id>&sz=w2000.
export function directImageUrl(link: string): string {
  const url = link.trim()
  if (!/^https?:\/\//i.test(url)) return url
  const id = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([\w-]{10,})/.exec(url)?.[1]
  return id ? `https://lh3.googleusercontent.com/d/${id}` : url // any other image URL is used as is
}

// a Drive file not shared publicly redirects to the Google login: only its owner would see the image
export async function validateImageLink(v: string | null | undefined): Promise<true | string> {
  if (!v) return true
  if (!/^https:\/\//i.test(v.trim())) return 'https:// kezdetű link kell'
  if (typeof window !== 'undefined') return true // the browser can't read Google's headers (CORS): checked on the server
  const res = await fetch(directImageUrl(v), { redirect: 'manual' }).catch(() => null)
  if (!res) return true // Google unreachable: don't block saving
  if (res.ok && res.headers.get('content-type')?.startsWith('image/')) return true
  return /drive\.google\.com/.test(v)
    ? 'Ez a Drive kép nincs nyilvánosan megosztva, csak a tulajdonosa látná. Drive-ban: Megosztás → Általános hozzáférés → „Bárki, aki rendelkezik a linkkel”, utána mentsd újra.'
    : 'Ezen a linken nem érhető el kép.'
}
