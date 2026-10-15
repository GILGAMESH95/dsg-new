import type { CollectionConfig } from 'payload'

import { notifyTelegram } from '../lib/telegram'

export const leadTypes = [
  { label: 'Обратный звонок', value: 'callback' },
  { label: 'Консультация', value: 'consultation' },
  { label: 'Квартира', value: 'apartment' },
  { label: 'Рассрочка', value: 'installment' },
  { label: 'Акция', value: 'promotion' },
]

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'type', 'status', 'createdAt'],
    group: 'Продажи',
  },
  access: {
    // Заявки создаются только через серверное действие сайта (overrideAccess)
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        try {
          await notifyTelegram(doc, req.payload)
        } catch (error) {
          req.payload.logger.error({ err: error, msg: 'Не удалось отправить заявку в Telegram' })
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Имя' },
        { name: 'phone', type: 'text', label: 'Телефон', required: true },
      ],
    },
    { name: 'message', type: 'textarea', label: 'Комментарий' },
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', label: 'Тип', options: leadTypes, defaultValue: 'callback' },
        { name: 'contactMethod', type: 'text', label: 'Удобный способ связи' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects', label: 'ЖК' },
        { name: 'apartment', type: 'relationship', relationTo: 'apartments', label: 'Квартира' },
      ],
    },
    { name: 'details', type: 'textarea', label: 'Детали (расчёт рассрочки и т.п.)' },
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
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'В работе', value: 'in_progress' },
        { label: 'Сделка', value: 'won' },
        { label: 'Отказ', value: 'lost' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'note', type: 'textarea', label: 'Заметка менеджера', admin: { position: 'sidebar' } },
  ],
}
