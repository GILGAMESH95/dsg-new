import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Apartments } from './collections/Apartments'
import { Bookings } from './collections/Bookings'
import { ClientNotifications } from './collections/ClientNotifications'
import { Clients } from './collections/Clients'
import { Documents } from './collections/Documents'
import { Faqs } from './collections/Faqs'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { PaymentMethods } from './collections/PaymentMethods'
import { Posts } from './collections/Posts'
import { Subscribers } from './collections/Subscribers'
import { SupportRequests } from './collections/SupportRequests'
import { Projects } from './collections/Projects'
import { Promotions } from './collections/Promotions'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { defaultLocale } from './i18n/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — DS Group' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  localization: {
    locales: [
      { label: 'ქართული', code: 'ka' },
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale,
    fallback: true,
  },
  collections: [Projects, Apartments, Promotions, PaymentMethods, Leads, Bookings, Clients, ClientNotifications, SupportRequests, Subscribers, Posts, Faqs, Documents, Media, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
