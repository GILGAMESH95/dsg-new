import { revalidateGlobal } from '../lib/revalidate'
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: { group: 'Система' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Меню',
          description:
            'Меню в шапке сайта. Если оставить список пустым, показывается стандартное меню. Ссылки пишите без языка: /projects, /apartments, /about/news. Внешние ссылки — полностью, с https://.',
          fields: [
            {
              name: 'menuItems',
              type: 'array',
              label: 'Пункты меню',
              labels: { singular: 'Пункт', plural: 'Пункты' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', label: 'Название', localized: true, required: true },
                    {
                      name: 'href',
                      type: 'text',
                      label: 'Ссылка',
                      required: true,
                      admin: { description: 'Куда ведёт пункт. Для выпадающих — страница по ссылке в мобильном меню.' },
                    },
                    {
                      name: 'kind',
                      type: 'select',
                      label: 'Вид',
                      defaultValue: 'link',
                      required: true,
                      options: [
                        { label: 'Обычная ссылка', value: 'link' },
                        { label: 'Выпадающий список (колонки ссылок)', value: 'columns' },
                        { label: 'Выпадающее с фото-плитками', value: 'tiles' },
                      ],
                    },
                  ],
                },
                {
                  name: 'columns',
                  type: 'array',
                  label: 'Колонки выпадающего списка',
                  labels: { singular: 'Колонка', plural: 'Колонки' },
                  admin: { condition: (_, sibling) => sibling?.kind === 'columns', initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', label: 'Заголовок колонки', localized: true, required: true },
                        { name: 'href', type: 'text', label: 'Ссылка заголовка', required: true },
                      ],
                    },
                    {
                      name: 'autoMethods',
                      type: 'checkbox',
                      label: 'Добавить способы покупки из раздела «Способы покупки»',
                      defaultValue: false,
                    },
                    {
                      name: 'links',
                      type: 'array',
                      label: 'Ссылки под заголовком',
                      labels: { singular: 'Ссылка', plural: 'Ссылки' },
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            { name: 'label', type: 'text', label: 'Название', localized: true, required: true },
                            { name: 'href', type: 'text', label: 'Ссылка', required: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'tiles',
                  type: 'array',
                  label: 'Фото-плитки',
                  labels: { singular: 'Плитка', plural: 'Плитки' },
                  maxRows: 4,
                  admin: { condition: (_, sibling) => sibling?.kind === 'tiles', initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', label: 'Название', localized: true, required: true },
                        { name: 'href', type: 'text', label: 'Ссылка', required: true },
                      ],
                    },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Фото (если пусто — обложка проекта)',
                    },
                  ],
                },
                {
                  name: 'sideLinks',
                  type: 'array',
                  label: 'Ссылки справа от плиток',
                  labels: { singular: 'Ссылка', plural: 'Ссылки' },
                  admin: { condition: (_, sibling) => sibling?.kind === 'tiles', initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', label: 'Название', localized: true, required: true },
                        { name: 'href', type: 'text', label: 'Ссылка', required: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Контакты',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', label: 'Телефон', required: true },
                { name: 'email', type: 'email', label: 'Email' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'whatsapp',
                  type: 'text',
                  label: 'WhatsApp (номер без +)',
                  admin: { description: 'Например: 995555123456' },
                },
                {
                  name: 'telegram',
                  type: 'text',
                  label: 'Telegram (username без @)',
                },
              ],
            },
            { name: 'address', type: 'text', label: 'Адрес офиса продаж', localized: true },
            { name: 'workingHours', type: 'text', label: 'Часы работы', localized: true },
            {
              type: 'row',
              fields: [
                { name: 'officeLat', type: 'number', label: 'Офис: широта' },
                { name: 'officeLng', type: 'number', label: 'Офис: долгота' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'instagram', type: 'text', label: 'Instagram (URL)' },
                { name: 'facebook', type: 'text', label: 'Facebook (URL)' },
                { name: 'youtube', type: 'text', label: 'YouTube (URL)' },
              ],
            },
          ],
        },
        {
          label: 'Главная',
          fields: [
            { name: 'heroTitle', type: 'text', label: 'Заголовок первого экрана', localized: true },
            {
              name: 'heroSubtitle',
              type: 'textarea',
              label: 'Подзаголовок первого экрана',
              localized: true,
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Фон первого экрана' },
            {
              name: 'stats',
              type: 'array',
              label: 'Цифры о компании',
              maxRows: 4,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'text', label: 'Значение', required: true },
                    { name: 'label', type: 'text', label: 'Подпись', localized: true, required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'О компании',
          fields: [
            { name: 'aboutTitle', type: 'text', label: 'Заголовок', localized: true },
            { name: 'aboutText', type: 'richText', label: 'Текст', localized: true },
            { name: 'aboutImage', type: 'upload', relationTo: 'media', label: 'Фото' },
            {
              name: 'aboutHistory',
              type: 'array',
              label: 'История компании (по годам)',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'year', type: 'text', label: 'Год', required: true, admin: { width: '20%' } },
                    { name: 'text', type: 'textarea', label: 'Что произошло', localized: true, required: true },
                  ],
                },
              ],
            },
            {
              name: 'aboutTeam',
              type: 'array',
              label: 'Руководство',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Имя', localized: true, required: true },
                    { name: 'role', type: 'text', label: 'Должность', localized: true },
                  ],
                },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
              ],
            },
            {
              name: 'aboutAwards',
              type: 'array',
              label: 'Награды и рейтинги',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', label: 'Название', localized: true, required: true },
                    { name: 'year', type: 'text', label: 'Год', admin: { width: '20%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Бронирование',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'bookingHoldHours',
                  type: 'number',
                  label: 'На сколько часов квартира закрепляется за клиентом',
                  defaultValue: 48,
                  min: 1,
                },
                {
                  name: 'bookingDeposit',
                  type: 'number',
                  label: 'Сумма задатка, $ (только для информации на сайте)',
                  admin: { description: 'Если пусто, сумма на сайте не показывается. Онлайн-оплата не подключена: менеджер связывается с клиентом.' },
                },
              ],
            },
            {
              name: 'bookingNote',
              type: 'textarea',
              label: 'Условия брони (показываются на странице онлайн-брони)',
              localized: true,
            },
          ],
        },
        {
          label: 'Стандарт',
          fields: [
            {
              name: 'standardTitle',
              type: 'text',
              label: 'Заголовок блока (по умолчанию «Стандарт DS Group»)',
              localized: true,
            },
            {
              name: 'standard',
              type: 'array',
              label: 'Пункты стандарта (показываются на страницах проектов)',
              labels: { singular: 'Пункт', plural: 'Пункты' },
              admin: { description: 'Если пусто, на странице проекта показываются три базовых преимущества компании.' },
              fields: [
                { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
                { name: 'text', type: 'textarea', label: 'Описание', localized: true },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', type: 'text', label: 'Meta title по умолчанию', localized: true },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'Meta description по умолчанию',
              localized: true,
            },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Картинка для соцсетей' },
          ],
        },
      ],
    },
  ],
}
