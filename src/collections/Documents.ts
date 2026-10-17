import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

export const documentCategories = [
  { label: 'Разрешения', value: 'permits' },
  { label: 'Договоры и бланки', value: 'contracts' },
  { label: 'Презентации и буклеты', value: 'presentations' },
  { label: 'Прочее', value: 'other' },
]

/** Документы для скачивания: сама коллекция является хранилищем файлов */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Документ', plural: 'Документы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'order'],
    group: 'Контент',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  upload: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true, localized: true },
    { name: 'description', type: 'textarea', label: 'Описание', localized: true },
    {
      name: 'category',
      type: 'select',
      label: 'Раздел',
      options: documentCategories,
      defaultValue: 'other',
      required: true,
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
