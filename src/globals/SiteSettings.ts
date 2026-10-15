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
