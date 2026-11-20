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
      validate: (v: string | null | undefined) => !v || /^https:\/\//i.test(v.trim()) || 'https:// kezdetű link kell',
    },
  ],
  upload: { mimeTypes: ['image/*'], filesRequiredOnCreate: false },
}
