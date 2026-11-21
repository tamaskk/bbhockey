import type { CollectionConfig } from 'payload'

const isAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

// folders for submissions; a folder can sit inside another one (subfolder) and can be hidden
export const Csoportok: CollectionConfig = {
  slug: 'csoportok',
  labels: { singular: 'Mappa', plural: 'Mappák' },
  admin: { useAsTitle: 'name', group: 'Minden jelentkezés', hidden: true },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    // deleting a folder: its subfolders move up one level, its submissions become unfiled
    beforeDelete: [
      async ({ id, req }) => {
        const self = await req.payload.findByID({ collection: 'csoportok', id, depth: 0, req })
        await req.payload.update({ collection: 'csoportok', where: { parent: { equals: id } }, data: { parent: (self.parent as string | null) ?? null }, req })
        await req.payload.update({ collection: 'jelentkezesek', where: { csoport: { equals: id } }, data: { csoport: null }, req })
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Név', type: 'text', required: true },
    { name: 'parent', label: 'Szülő mappa', type: 'relationship', relationTo: 'csoportok' },
    { name: 'hidden', label: 'Elrejtve', type: 'checkbox', defaultValue: false },
  ],
}
