import type { CollectionConfig } from 'payload'

import { notifyBookingTelegram } from '../lib/telegram'

export const bookingStatuses = [
  { label: 'Новая', value: 'new' },
  { label: 'Подтверждена', value: 'confirmed' },
  { label: 'Оплачена', value: 'paid' },
  { label: 'Отменена', value: 'cancelled' },
  { label: 'Истекла', value: 'expired' },
]

/** Заявки на онлайн-бронь квартиры. Создаются серверным действием сайта; статус квартиры менеджер меняет вручную. */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Бронь', plural: 'Брони' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'apartment', 'status', 'holdUntil', 'createdAt'],
    group: 'Продажи',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Уведомление клиенту: заявка принята / статус брони изменился
        const clientId = typeof doc.client === 'object' && doc.client ? doc.client.id : doc.client
        if (clientId && (operation === 'create' || previousDoc?.status !== doc.status)) {
          try {
            await req.payload.create({
              collection: 'client-notifications',
              req, // та же транзакция: бронь при создании ещё не зафиксирована в базе
              overrideAccess: true,
              data: { client: clientId, type: 'booking', booking: doc.id, status: doc.status, read: false },
            })
          } catch (error) {
            req.payload.logger.error({ err: error, msg: 'Не удалось создать уведомление клиента' })
          }
        }
        if (operation !== 'create') return doc
        try {
          await notifyBookingTelegram(doc, req.payload)
        } catch (error) {
          req.payload.logger.error({ err: error, msg: 'Не удалось отправить бронь в Telegram' })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'apartment', type: 'relationship', relationTo: 'apartments', label: 'Квартира', required: true, index: true },
        { name: 'project', type: 'relationship', relationTo: 'projects', label: 'ЖК' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Имя', required: true },
        { name: 'phone', type: 'text', label: 'Телефон', required: true },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    { name: 'client', type: 'relationship', relationTo: 'clients', label: 'Аккаунт клиента (если вошёл)' },
    { name: 'contactMethod', type: 'text', label: 'Удобный способ связи' },
    { name: 'message', type: 'textarea', label: 'Комментарий клиента' },
    {
      type: 'row',
      fields: [
        { name: 'priceAtBooking', type: 'number', label: 'Цена на момент брони, $', admin: { readOnly: true } },
        { name: 'holdUntil', type: 'date', label: 'Бронь действует до', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Источник',
      admin: { initCollapsed: true },
      fields: [
        { name: 'page', type: 'text', label: 'Страница' },
        { name: 'locale', type: 'text', label: 'Язык сайта' },
        { name: 'utm', type: 'text', label: 'UTM-метки' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      options: bookingStatuses,
      defaultValue: 'new',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'note', type: 'textarea', label: 'Заметка менеджера', admin: { position: 'sidebar' } },
  ],
}
