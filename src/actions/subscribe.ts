'use server'

import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

export type SubscribeState = { status: 'idle' | 'success' | 'error'; message?: 'email' | 'consent' }

const str = (formData: FormData, key: string, max = 300) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  if (str(formData, 'website')) return { status: 'success' } // ловушка для ботов

  const email = str(formData, 'email', 200).toLowerCase()
  if (!EMAIL_RE.test(email)) return { status: 'error', message: 'email' }
  if (formData.get('consent') !== 'on') return { status: 'error', message: 'consent' }

  const locale = str(formData, 'locale', 5)
  const projectId = Number(str(formData, 'project'))

  try {
    const payload = await getPayloadClient()
    const exists = await payload.count({ collection: 'subscribers', where: { email: { equals: email } }, overrideAccess: true })
    if (exists.totalDocs === 0) {
      await payload.create({
        collection: 'subscribers',
        overrideAccess: true,
        data: {
          email,
          locale: isLocale(locale) ? locale : undefined,
          project: Number.isInteger(projectId) && projectId > 0 ? projectId : undefined,
          marketingConsent: formData.get('marketing') === 'on',
          page: str(formData, 'page') || undefined,
        },
      })
    }
    return { status: 'success' }
  } catch (error) {
    console.error('subscribe failed', error)
    return { status: 'error' }
  }
}
