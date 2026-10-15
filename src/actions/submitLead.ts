'use server'

import { headers } from 'next/headers'

import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

export type LeadState = { status: 'idle' | 'success' | 'error'; message?: string }

const leadTypeValues = ['callback', 'consultation', 'apartment', 'installment', 'promotion'] as const
type LeadType = (typeof leadTypeValues)[number]

const str = (formData: FormData, key: string, max = 500) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

const toId = (value: string) => {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Ловушка для ботов: настоящие пользователи это поле не видят
  if (str(formData, 'website')) return { status: 'success' }

  const phone = str(formData, 'phone', 40)
  if (phone.replace(/\D/g, '').length < 7) return { status: 'error', message: 'phone' }

  const type = str(formData, 'type') as LeadType
  const locale = str(formData, 'locale', 5)
  const referer = (await headers()).get('referer') ?? ''

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: {
        name: str(formData, 'name', 120) || undefined,
        phone,
        message: str(formData, 'message', 2000) || undefined,
        type: leadTypeValues.includes(type) ? type : 'callback',
        contactMethod: str(formData, 'contactMethod', 40) || undefined,
        project: toId(str(formData, 'project')),
        apartment: toId(str(formData, 'apartment')),
        details: str(formData, 'details', 1000) || undefined,
        page: str(formData, 'page', 300) || referer.slice(0, 300) || undefined,
        locale: isLocale(locale) ? locale : undefined,
        utm: str(formData, 'utm', 300) || undefined,
      },
    })
    return { status: 'success' }
  } catch (error) {
    console.error('submitLead failed', error)
    return { status: 'error' }
  }
}
