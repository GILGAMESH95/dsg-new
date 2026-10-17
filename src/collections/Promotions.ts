import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

export const Promotions: CollectionConfig = {
  slug: 'promotions',
  labels: { singular: 'Акция', plural: 'Акции' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'badge', 'validUntil', 'active'],
    group: 'Продажи',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
    {
      name: 'badge',
      type: 'text',
      label: 'Плашка (например, «−10%» или «0%»)',
      localized: true,
    },
    { name: 'description', type: 'textarea', label: 'Описание (для карточки)', localized: true },
    { name: 'body', type: 'richText', label: 'Подробное описание', localized: true },
    {
      name: 'conditions',
      type: 'textarea',
      label: 'Условия акции (мелким шрифтом)',
      localized: true,
    },
    slugField(),
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Картинка' },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: 'Жилой комплекс' },
    {
      name: 'validUntil',
      type: 'date',
      label: 'Действует до',
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Активна',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
