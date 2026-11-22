import type { CollectionConfig } from 'payload'
import { directImageUrl } from '../drive'
import { revalidateHook } from '../revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Kép', plural: 'Képek' },
  // images are managed from the page editor; the collection only stores them
  admin: { group: 'Weboldal', hidden: true },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateHook],
    afterDelete: [revalidateHook],
    // a linked image is served straight from its link (Drive links converted to the direct image URL)
    afterRead: [({ doc }) => (doc.driveUrl ? { ...doc, url: directImageUrl(doc.driveUrl), thumbnailURL: directImageUrl(doc.driveUrl) } : doc)],
  },
  fields: [
    { name: 'alt', label: 'Leírás (akadálymentesség, Google)', type: 'text' },
    {
      name: 'driveUrl',
      label: 'Google Drive link (feltöltés helyett)',
      type: 'text',
      admin: { description: 'A Drive-ban a kép megosztása legyen „Bárki, aki rendelkezik a linkkel”. Más képlink (https://…) is működik.' },
      validate: async (v: string | null | undefined) => {
        if (!v) return true
        if (!/^https:\/\//i.test(v.trim())) return 'https:// kezdetű link kell'
        if (typeof window !== 'undefined') return true // the browser can't read Google's headers (CORS): checked on the server
        // a Drive file not shared publicly redirects to the Google login: only its owner would see the image
        const res = await fetch(directImageUrl(v), { redirect: 'manual' }).catch(() => null)
        if (!res) return true // Google unreachable: don't block saving
        if (res.ok && res.headers.get('content-type')?.startsWith('image/')) return true
        return /drive\.google\.com/.test(v)
          ? 'Ez a Drive kép nincs nyilvánosan megosztva, csak a tulajdonosa látná. Drive-ban: Megosztás → Általános hozzáférés → „Bárki, aki rendelkezik a linkkel”, utána mentsd újra.'
          : 'Ezen a linken nem érhető el kép.'
      },
    },
  ],
  upload: { mimeTypes: ['image/*'], filesRequiredOnCreate: false },
}
