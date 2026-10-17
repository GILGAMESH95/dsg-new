import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

export const faqCategories = [
  { label: 'Покупка', value: 'buying' },
  { label: 'Оплата и рассрочка', value: 'payment' },
  { label: 'Документы и регистрация', value: 'legal' },
  { label: 'Строительство', value: 'construction' },
]

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Вопрос', plural: 'Вопросы и ответы' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'order'],
    group: 'Контент',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'question', type: 'text', label: 'Вопрос', required: true, localized: true },
    { name: 'answer', type: 'textarea', label: 'Ответ', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      label: 'Раздел',
      options: faqCategories,
      defaultValue: 'buying',
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
