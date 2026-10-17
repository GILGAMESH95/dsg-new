'use server'

import { headers } from 'next/headers'

import { isLocale } from '@/i18n/config'
import { getClient } from '@/lib/clientAuth'
import { getPayloadClient } from '@/lib/payload'

export type BookingState = {
  status: 'idle' | 'success' | 'error'
  message?: 'name' | 'phone' | 'email' | 'consent' | 'unavailable' | 'taken'
  holdUntil?: string
}

const str = (formData: FormData, key: string, max = 500) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function bookApartment(_prev: BookingState, formData: FormData): Promise<BookingState> {
  if (str(formData, 'website')) return { status: 'success' } // ловушка для ботов

  const name = str(formData, 'name', 120)
  const phone = str(formData, 'phone', 40)
  const email = str(formData, 'email', 200).toLowerCase()
  if (name.length < 2) return { status: 'error', message: 'name' }
  if (phone.replace(/\D/g, '').length < 7) return { status: 'error', message: 'phone' }
  if (email && !EMAIL_RE.test(email)) return { status: 'error', message: 'email' }
  if (formData.get('consent') !== 'on') return { status: 'error', message: 'consent' }

  const apartmentId = Number(str(formData, 'apartment'))
  if (!Number.isInteger(apartmentId) || apartmentId <= 0) return { status: 'error', message: 'unavailable' }

  const locale = str(formData, 'locale', 5)
  const referer = (await headers()).get('referer') ?? ''

  try {
    const payload = await getPayloadClient()
    const apartment = await payload.findByID({ collection: 'apartments', id: apartmentId, depth: 0 }).catch(() => null)
    if (!apartment || apartment.status !== 'available') return { status: 'error', message: 'unavailable' }

    const now = new Date()
    const active = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { apartment: { equals: apartmentId } },
          { status: { in: ['confirmed', 'paid'] } },
          { or: [{ holdUntil: { greater_than: now.toISOString() } }, { status: { equals: 'paid' } }] },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (active.totalDocs > 0) return { status: 'error', message: 'taken' }

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const hours = Math.max(1, Number(settings.bookingHoldHours) || 48)
    const holdUntil = new Date(now.getTime() + hours * 3600 * 1000).toISOString()

    await payload.create({
      collection: 'bookings',
      overrideAccess: true,
      data: {
        apartment: apartmentId,
        client: (await getClient())?.id,
        project: typeof apartment.project === 'object' ? apartment.project.id : apartment.project,
        name,
        phone,
        email: email || undefined,
        contactMethod: str(formData, 'contactMethod', 40) || undefined,
        message: str(formData, 'message', 2000) || undefined,
        priceAtBooking: apartment.price,
        holdUntil,
        status: 'new',
        page: str(formData, 'page', 300) || referer.slice(0, 300) || undefined,
        locale: isLocale(locale) ? locale : undefined,
        utm: str(formData, 'utm', 300) || undefined,
      },
    })
    return { status: 'success', holdUntil }
  } catch (error) {
    console.error('bookApartment failed', error)
    return { status: 'error' }
  }
}
