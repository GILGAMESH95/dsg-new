import type { Field } from 'payload'

export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description: 'Если пусто — используются название и краткое описание.',
  },
  fields: [
    { name: 'title', type: 'text', label: 'Meta title', localized: true },
    { name: 'description', type: 'textarea', label: 'Meta description', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Картинка для соцсетей' },
  ],
}
