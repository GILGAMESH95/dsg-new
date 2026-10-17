import type { Access, CollectionConfig } from 'payload'

/** Клиентов видят и правят только сотрудники из коллекции users; сайт работает с ними серверным кодом. */
const adminOnly: Access = ({ req }) => req.user?.collection === 'users'

/**
 * Аккаунты клиентов сайта. Это НЕ auth-коллекция Payload: Payload-токены клиентам не выдаются,
 * поэтому клиент не может обратиться к REST API админки. Вход реализован в lib/clientAuth.ts.
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Клиент', plural: 'Клиенты' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'phone', 'createdAt'],
    group: 'Продажи',
  },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', label: 'Email', required: true, unique: true, index: true },
        { name: 'name', type: 'text', label: 'Имя' },
        { name: 'phone', type: 'text', label: 'Телефон' },
      ],
    },
    { name: 'locale', type: 'text', label: 'Язык сайта' },
    {
      name: 'favoriteApartments',
      type: 'relationship',
      relationTo: 'apartments',
      hasMany: true,
      label: 'Избранные квартиры',
    },
    {
      name: 'favoriteProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: 'Избранные ЖК',
    },
    {
      name: 'savedSearches',
      type: 'array',
      label: 'Сохранённые поиски',
      fields: [
        { name: 'name', type: 'text', label: 'Название', required: true },
        { name: 'query', type: 'text', label: 'Параметры (query)' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Служебное (вход)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'passwordHash', type: 'text', admin: { readOnly: true }, access: { read: () => false } },
        { name: 'passwordSalt', type: 'text', admin: { readOnly: true }, access: { read: () => false } },
        { name: 'sessionVersion', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'failedAttempts', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'lockedUntil', type: 'date', admin: { readOnly: true } },
        { name: 'resetTokenHash', type: 'text', admin: { readOnly: true }, access: { read: () => false } },
        { name: 'resetExpires', type: 'date', admin: { readOnly: true } },
      ],
    },
  ],
}
