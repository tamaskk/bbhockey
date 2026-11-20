import type { Field } from 'payload'

// Section title split in two: the second part is shown in the accent (yellow) colour.
export const heading = (defaults: { title?: string; highlight?: string } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'title', label: 'Cím', type: 'text', required: true, defaultValue: defaults.title },
      {
        name: 'highlight',
        label: 'Kiemelt rész (sárgával)',
        type: 'text',
        defaultValue: defaults.highlight,
        admin: { description: 'A cím után, kiemelő színnel jelenik meg.' },
      },
    ],
  },
]

export const show: Field = {
  name: 'show',
  label: 'Megjelenjen az oldalon',
  type: 'checkbox',
  defaultValue: true,
}

export const image = (name: string, label: string, required = false): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  required,
})
