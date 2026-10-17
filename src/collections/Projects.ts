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
            {
              name: 'tags',
              type: 'array',
              label: 'Теги на карточке (скидка, рассрочка…)',
              labels: { singular: 'Тег', plural: 'Теги' },
              maxRows: 4,
              fields: [{ name: 'text', type: 'text', label: 'Текст', localized: true }],
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
              fields: [
                { name: 'text', type: 'text', label: 'Текст', localized: true },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото (необязательно)' },
              ],
            },
          ],
        },
        {
          label: 'Страница проекта',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'presentation',
                  type: 'upload',
                  relationTo: 'documents',
                  label: 'Презентация проекта (PDF)',
                },
                {
                  name: 'videoUrl',
                  type: 'text',
                  label: 'Ссылка на видео (YouTube и т. п.)',
                },
              ],
            },
            {
              name: 'masterplan',
              type: 'upload',
              relationTo: 'media',
              label: 'Генплан (картинка)',
            },
            {
              name: 'highlights',
              type: 'array',
              label: 'Кратко о главном (тезисы)',
              labels: { singular: 'Тезис', plural: 'Тезисы' },
              fields: [{ name: 'text', type: 'text', label: 'Текст', localized: true }],
            },
            {
              name: 'livingIs',
              type: 'array',
              label: 'Жить здесь — это…',
              labels: { singular: 'Пункт', plural: 'Пункты' },
              fields: [
                { name: 'text', type: 'text', label: 'Продолжение фразы', localized: true },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото (необязательно)' },
              ],
            },
            {
              name: 'buildings',
              type: 'array',
              label: 'Корпуса',
              labels: { singular: 'Корпус', plural: 'Корпуса' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Название', required: true, localized: true },
                    { name: 'completion', type: 'text', label: 'Срок сдачи', localized: true },
                    { name: 'totalApartments', type: 'number', label: 'Всего квартир' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'markerX',
                      type: 'number',
                      label: 'Метка на генплане: слева, %',
                      min: 0,
                      max: 100,
                      admin: { description: '0 — левый край картинки, 100 — правый' },
                    },
                    {
                      name: 'markerY',
                      type: 'number',
                      label: 'Метка на генплане: сверху, %',
                      min: 0,
                      max: 100,
                      admin: { description: '0 — верх картинки, 100 — низ' },
                    },
                  ],
                },
                {
                  name: 'types',
                  type: 'array',
                  label: 'Типы квартир',
                  labels: { singular: 'Тип', plural: 'Типы' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'rooms', type: 'number', label: 'Комнат (0 — студия)', required: true, min: 0 },
                        { name: 'count', type: 'number', label: 'Количество' },
                        { name: 'priceFrom', type: 'number', label: 'Цена от, $' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'layouts',
              type: 'array',
              label: 'Планировки',
              labels: { singular: 'Планировка', plural: 'Планировки' },
              fields: [
                { name: 'plan', type: 'upload', relationTo: 'media', label: 'Схема', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'rooms', type: 'number', label: 'Комнат (0 — студия)', required: true, min: 0 },
                    { name: 'area', type: 'number', label: 'Площадь, м²', required: true },
                    { name: 'building', type: 'text', label: 'Корпус', localized: true },
                    { name: 'priceFrom', type: 'number', label: 'Цена от, $' },
                    { name: 'priceFromGelPerSqm', type: 'number', label: 'Цена от, ₾ за м²' },
                  ],
                },
              ],
            },
            {
              name: 'infrastructure',
              type: 'array',
              label: 'Инфраструктура рядом',
              labels: { singular: 'Объект', plural: 'Объекты' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото (необязательно)' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'category',
                      type: 'select',
                      label: 'Категория',
                      defaultValue: 'other',
                      options: [
                        { label: 'Здоровье', value: 'health' },
                        { label: 'Спорт', value: 'sport' },
                        { label: 'Магазины', value: 'shops' },
                        { label: 'Образование', value: 'education' },
                        { label: 'Кафе и рестораны', value: 'cafe' },
                        { label: 'Парки', value: 'parks' },
                        { label: 'Театры, музеи', value: 'culture' },
                        { label: 'Другое', value: 'other' },
                      ],
                    },
                    { name: 'lat', type: 'number', label: 'Широта (для карты)' },
                    { name: 'lng', type: 'number', label: 'Долгота (для карты)' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Название', required: true, localized: true },
                    { name: 'minutes', type: 'number', label: 'Минут', required: true },
                    {
                      name: 'mode',
                      type: 'select',
                      label: 'Как добраться',
                      defaultValue: 'walk',
                      options: [
                        { label: 'Пешком', value: 'walk' },
                        { label: 'На машине', value: 'car' },
                      ],
                    },
                  ],
                },
              ],
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
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                {
                  name: 'category',
                  type: 'text',
                  label: 'Раздел галереи (вкладка)',
                  localized: true,
                  admin: { description: 'Например: Виды из окон, Парк, Лобби. Одинаковые названия объединяются во вкладку.' },
                },
              ],
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
