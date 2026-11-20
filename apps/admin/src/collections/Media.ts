import type { CollectionConfig } from 'payload'
import { revalidateHook } from '../revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Kép', plural: 'Képek' },
  admin: { group: 'Weboldal' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateHook], afterDelete: [revalidateHook] },
  fields: [{ name: 'alt', label: 'Leírás (akadálymentesség, Google)', type: 'text' }],
  upload: { mimeTypes: ['image/*'] },
}
