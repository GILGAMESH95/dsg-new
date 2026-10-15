import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

export const postCategories = [
  { label: 'Новости компании', value: 'news' },
  { label: 'Ход строительства', value: 'construction' },
  { label: 'Инвестиции', value: 'investment' },
  { label: 'Жизнь в Батуми', value: 'batumi' },
]

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Статья', plural: 'Блог и новости' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Контент',
  },
  versions: { drafts: true },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  defaultSort: '-publishedAt',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
    { name: 'excerpt', type: 'textarea', label: 'Анонс', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обложка' },
    { name: 'content', type: 'richText', label: 'Текст', localized: true },
    seoField,
    slugField(),
    {
      name: 'category',
      type: 'select',
      label: 'Рубрика',
      options: postCategories,
      defaultValue: 'news',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
  ],
}
