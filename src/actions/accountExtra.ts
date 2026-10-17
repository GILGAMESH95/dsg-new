'use server'

import { revalidatePath } from 'next/cache'

import { clearSessionCookie, getClient, hashPassword, setSessionCookie, verifyPassword } from '@/lib/clientAuth'
import { getPayloadClient } from '@/lib/payload'

export type SimpleState = {
  status: 'idle' | 'success' | 'error'
  message?: 'invalid' | 'weak' | 'message' | 'topic' | 'error' | 'same'
}

const str = (formData: FormData, key: string, max = 300) => {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

const supportTopicValues = ['booking', 'documents', 'payment', 'other'] as const

export async function changePassword(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const client = await getClient()
  if (!client) return { status: 'error', message: 'invalid' }
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  if (next.length < 8 || next.length > 200) return { status: 'error', message: 'weak' }
  if (next === current) return { status: 'error', message: 'same' }

  try {
    const payload = await getPayloadClient()
    const full = await payload.findByID({ collection: 'clients', id: client.id, depth: 0, overrideAccess: true })
    if (!full.passwordHash || !full.passwordSalt || !(await verifyPassword(current, full.passwordHash, full.passwordSalt))) {
      return { status: 'error', message: 'invalid' }
    }
    const { hash, salt } = await hashPassword(next)
    const updated = await payload.update({
      collection: 'clients',
      id: client.id,
      overrideAccess: true,
      data: { passwordHash: hash, passwordSalt: salt, sessionVersion: (full.sessionVersion ?? 0) + 1 },
    })
    // старые сессии (другие устройства) недействительны; текущую обновляем
    await setSessionCookie(updated)
    return { status: 'success' }
  } catch (error) {
    console.error('changePassword failed', error)
    return { status: 'error', message: 'error' }
  }
}

/** Удаление аккаунта: нужен пароль. Персональные данные клиента удаляются, брони остаются без привязки к аккаунту. */
export async function deleteAccount(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const client = await getClient()
  if (!client) return { status: 'error', message: 'invalid' }
  const password = String(formData.get('password') ?? '')

  try {
    const payload = await getPayloadClient()
    const full = await payload.findByID({ collection: 'clients', id: client.id, depth: 0, overrideAccess: true })
    if (!full.passwordHash || !full.passwordSalt || !(await verifyPassword(password, full.passwordHash, full.passwordSalt))) {
      return { status: 'error', message: 'invalid' }
    }

    const bookings = await payload.find({
      collection: 'bookings',
      where: { client: { equals: client.id } },
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    for (const b of bookings.docs) {
      await payload.update({ collection: 'bookings', id: b.id, data: { client: null }, overrideAccess: true })
    }
    await payload.delete({ collection: 'client-notifications', where: { client: { equals: client.id } }, overrideAccess: true })
    await payload.delete({ collection: 'support-requests', where: { client: { equals: client.id } }, overrideAccess: true })
    await payload.delete({ collection: 'clients', id: client.id, overrideAccess: true })
    await clearSessionCookie()
    revalidatePath('/', 'layout')
    return { status: 'success' }
  } catch (error) {
    console.error('deleteAccount failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function submitSupport(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const client = await getClient()
  if (!client) return { status: 'error', message: 'invalid' }
  const topic = str(formData, 'topic') as (typeof supportTopicValues)[number]
  const message = str(formData, 'message', 3000)
  if (!supportTopicValues.includes(topic)) return { status: 'error', message: 'topic' }
  if (message.length < 5) return { status: 'error', message: 'message' }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'support-requests',
      overrideAccess: true,
      data: {
        client: client.id,
        topic,
        message,
        contactMethod: str(formData, 'contactMethod', 40) || undefined,
        reference: str(formData, 'reference', 80) || undefined,
      },
    })
    return { status: 'success' }
  } catch (error) {
    console.error('submitSupport failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function markNotificationsRead(): Promise<void> {
  const client = await getClient()
  if (!client) return
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'client-notifications',
    where: { and: [{ client: { equals: client.id } }, { read: { equals: false } }] },
    data: { read: true },
    overrideAccess: true,
  })
  revalidatePath('/', 'layout')
}
