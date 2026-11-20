// Google Drive share links ("…/file/d/<id>/view", "…open?id=<id>", "…uc?id=<id>") point to an HTML page, not the image.
// shortcut: lh3.googleusercontent.com/d/<id> is Google's unofficial direct-image URL; if Google drops it, switch to drive.google.com/thumbnail?id=<id>&sz=w2000.
export function directImageUrl(link: string): string {
  const url = link.trim()
  if (!/^https?:\/\//i.test(url)) return url
  const id = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([\w-]{10,})/.exec(url)?.[1]
  return id ? `https://lh3.googleusercontent.com/d/${id}` : url // any other image URL is used as is
}
