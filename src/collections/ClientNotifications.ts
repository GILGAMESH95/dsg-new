import type { Access, CollectionConfig } from 'payload'

const adminOnly: Access = ({ req }) => req.user?.collection === 'users'

/** Уведомления клиента (например, смена статуса брони). Тексты строятся на сайте по типу и данным. */
export const ClientNotifications: CollectionConfig = {
  slug: 'client-notifications',
  labels: { singular: 'Уведомление клиента', plural: 'Уведомления клиентов' },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['client', 'type', 'status', 'read', 'createdAt'],
    group: 'Продажи',
  },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  defaultSort: '-createdAt',
  fields: [
    { name: 'client', type: 'relationship', relationTo: 'clients', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'booking',
      options: [{ label: 'Статус брони', value: 'booking' }],
    },
    { name: 'booking', type: 'relationship', relationTo: 'bookings', label: 'Бронь' },
    { name: 'status', type: 'text', label: 'Новый статус' },
    { name: 'read', type: 'checkbox', defaultValue: false, label: 'Прочитано' },
  ],
}
