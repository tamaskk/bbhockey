import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Felhasználó', plural: 'Felhasználók' },
  admin: { useAsTitle: 'email', group: 'Rendszer' },
  auth: true,
  fields: [{ name: 'name', label: 'Név', type: 'text' }],
}
