import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

export const apartmentStatuses = [
  { label: 'Свободна', value: 'available' },
  { label: 'Бронь', value: 'reserved' },
  { label: 'Продана', value: 'sold' },
]

export const apartmentViews = [
  { label: 'Море', value: 'sea' },
  { label: 'Горы', value: 'mountains' },
  { label: 'Город', value: 'city' },
]

export const Apartments: CollectionConfig = {
  slug: 'apartments',
  labels: { singular: 'Квартира', plural: 'Квартиры' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'rooms', 'floor', 'area', 'price', 'status'],
    listSearchableFields: ['number'],
    group: 'Продажи',
  },
  access: { read: () => true },
  defaultSort: 'number',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
    beforeChange: [
      ({ data }) => {
        if (data.number) data.title = `№ ${data.number}`
        if (data.area && data.price) data.pricePerSqm = Math.round(data.price / data.area)
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          label: 'Жилой комплекс',
          required: true,
          index: true,
        },
        { name: 'number', type: 'text', label: 'Номер квартиры', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rooms',
          type: 'number',
          label: 'Комнат (0 — студия)',
          required: true,
          min: 0,
          index: true,
        },
        { name: 'floor', type: 'number', label: 'Этаж', required: true, index: true },
        { name: 'area', type: 'number', label: 'Площадь, м²', required: true, index: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', label: 'Цена, $', required: true, index: true },
        {
          name: 'oldPrice',
          type: 'number',
          label: 'Старая цена, $ (для акции)',
        },
        {
          name: 'pricePerSqm',
          type: 'number',
          label: 'Цена за м², $',
          admin: { readOnly: true, description: 'Считается автоматически' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'view',
          type: 'select',
          label: 'Вид из окон',
          options: apartmentViews,
          hasMany: true,
        },
        { name: 'hasBalcony', type: 'checkbox', label: 'Балкон', defaultValue: true },
        { name: 'renovated', type: 'checkbox', label: 'С ремонтом', defaultValue: false },
      ],
    },
    { name: 'plan', type: 'upload', relationTo: 'media', label: 'Планировка' },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      options: apartmentStatuses,
      defaultValue: 'available',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'promo',
      type: 'checkbox',
      label: 'Участвует в акции',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
