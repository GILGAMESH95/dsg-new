import type { Access, CollectionConfig } from 'payload'

import { notifySupportTelegram } from '../lib/telegram'

const adminOnly: Access = ({ req }) => req.user?.collection === 'users'

export const supportTopics = [
  { label: 'Бронирование', value: 'booking' },
  { label: 'Документы и договор', value: 'documents' },
  { label: 'Оплата и рассрочка', value: 'payment' },
  { label: 'Другое', value: 'other' },
]

/** Обращения клиентов из личного кабинета */
export const SupportRequests: CollectionConfig = {
  slug: 'support-requests',
  labels: { singular: 'Обращение в поддержку', plural: 'Обращения в поддержку' },
  admin: {
    useAsTitle: 'topic',
    defaultColumns: ['client', 'topic', 'status', 'createdAt'],
    group: 'Продажи',
  },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        try {
          await notifySupportTelegram(doc, req.payload)
        } catch (error) {
          req.payload.logger.error({ err: error, msg: 'Не удалось отправить обращение в Telegram' })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'client', type: 'relationship', relationTo: 'clients', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'topic', type: 'select', options: supportTopics, required: true, label: 'Тема' },
        { name: 'contactMethod', type: 'text', label: 'Способ связи' },
        { name: 'reference', type: 'text', label: 'Номер брони / договора' },
      ],
    },
    { name: 'message', type: 'textarea', required: true, label: 'Обращение' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: 'Статус',
      options: [
        { label: 'Новое', value: 'new' },
        { label: 'В работе', value: 'in_progress' },
        { label: 'Решено', value: 'done' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'note', type: 'textarea', label: 'Заметка менеджера', admin: { position: 'sidebar' } },
  ],
}
