import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'

export const projectStatuses = [
  { label: 'В продаже', value: 'selling' },
  { label: 'Строится', value: 'construction' },
  { label: 'Сдан', value: 'completed' },
]

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Жилой комплекс', plural: 'Жилые комплексы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'completion', 'order'],
    group: 'Продажи',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { name: 'title', type: 'text', label: 'Название', required: true, localized: true },
            {
              name: 'tagline',
              type: 'text',
              label: 'Короткий слоган',
              localized: true,
            },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Краткое описание (для карточки)',
              localized: true,
            },
            { name: 'description', type: 'richText', label: 'Описание', localized: true },
            {
              type: 'row',
              fields: [
                { name: 'district', type: 'text', label: 'Район', localized: true },
                { name: 'address', type: 'text', label: 'Адрес', localized: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'completion', type: 'text', label: 'Срок сдачи', localized: true },
                { name: 'floors', type: 'number', label: 'Этажей' },
                { name: 'distanceToSea', type: 'number', label: 'До моря, м' },
              ],
            },
            {
              name: 'features',
              type: 'array',
              label: 'Преимущества',
              labels: { singular: 'Преимущество', plural: 'Преимущества' },
              fields: [{ name: 'text', type: 'text', label: 'Текст', localized: true }],
            },
          ],
        },
        {
          label: 'Фото',
          fields: [
            { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обложка', required: true },
            {
              name: 'gallery',
              type: 'array',
              label: 'Галерея',
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Ход строительства',
          fields: [
            {
              name: 'progress',
              type: 'array',
              label: 'Отчёты',
              labels: { singular: 'Отчёт', plural: 'Отчёты' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'date', type: 'date', label: 'Дата', required: true },
                    { name: 'title', type: 'text', label: 'Заголовок', localized: true },
                    { name: 'percent', type: 'number', label: 'Готовность, %', min: 0, max: 100 },
                  ],
                },
                {
                  name: 'photos',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  label: 'Фото',
                },
              ],
            },
          ],
        },
        {
          label: 'Рассрочка',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'minDownPayment',
                  type: 'number',
                  label: 'Мин. первый взнос, %',
                  defaultValue: 20,
                },
                {
                  name: 'maxInstallmentMonths',
                  type: 'number',
                  label: 'Макс. срок рассрочки, мес.',
                  defaultValue: 36,
                },
              ],
            },
            {
              name: 'installmentNote',
              type: 'textarea',
              label: 'Условия рассрочки',
              localized: true,
            },
          ],
        },
        {
          label: 'Карта',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'lat', type: 'number', label: 'Широта' },
                { name: 'lng', type: 'number', label: 'Долгота' },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField] },
      ],
    },
    slugField(),
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      options: projectStatuses,
      defaultValue: 'selling',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Показывать на главной',
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
