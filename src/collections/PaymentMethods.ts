import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

export const PaymentMethods: CollectionConfig = {
  slug: 'payment-methods',
  labels: { singular: 'Способ покупки', plural: 'Способы покупки' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'showCalculator', 'order'],
    group: 'Продажи',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true, localized: true },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Кратко (для карточки и подзаголовка)',
      localized: true,
    },
    {
      name: 'terms',
      type: 'array',
      label: 'Ключевые условия',
      labels: { singular: 'Условие', plural: 'Условия' },
      admin: { description: 'Например: «Первый взнос» — «от 20%»' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Параметр', required: true, localized: true },
            { name: 'value', type: 'text', label: 'Значение', required: true, localized: true },
          ],
        },
      ],
    },
    { name: 'body', type: 'richText', label: 'Подробное описание', localized: true },
    {
      name: 'steps',
      type: 'array',
      label: 'Схема сделки (шаги)',
      labels: { singular: 'Шаг', plural: 'Шаги' },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
        { name: 'text', type: 'textarea', label: 'Описание', localized: true },
      ],
    },
    {
      name: 'conditions',
      type: 'textarea',
      label: 'Юридические оговорки (мелким шрифтом)',
      localized: true,
    },
    slugField(),
    {
      name: 'showCalculator',
      type: 'checkbox',
      label: 'Показать калькулятор рассрочки',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'calcMinDown', type: 'number', label: 'Взнос от, %', defaultValue: 20 },
        { name: 'calcMaxMonths', type: 'number', label: 'Срок до, мес.', defaultValue: 36 },
      ],
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
