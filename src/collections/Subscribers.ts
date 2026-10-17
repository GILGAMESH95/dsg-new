import type { CollectionConfig } from 'payload'

/** Подписчики на новости. Создаются только серверным действием сайта. */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Подписчик', plural: 'Подписчики' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'project', 'createdAt'],
    group: 'Продажи',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'email', type: 'email', label: 'Email', required: true, unique: true, index: true },
    { name: 'locale', type: 'text', label: 'Язык сайта' },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: 'С какого ЖК подписался' },
    { name: 'marketingConsent', type: 'checkbox', label: 'Согласие на рекламно-информационные рассылки' },
    { name: 'page', type: 'text', label: 'Страница' },
  ],
}
