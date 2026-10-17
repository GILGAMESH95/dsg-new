'use server'

import { revalidatePath } from 'next/cache'

import { isLocale } from '@/i18n/config'
import {
  clearSessionCookie,
  getClient,
  hashPassword,
  hashToken,
  newResetToken,
  setSessionCookie,
  verifyPassword,
} from '@/lib/clientAuth'
import { getPayloadClient } from '@/lib/payload'

export type AccountState = {
  status: 'idle' | 'success' | 'error'
  message?: 'invalid' | 'exists' | 'weak' | 'email' | 'name' | 'locked' | 'consent' | 'token' | 'error'
}

const str = (formData: FormData, key: string, max = 300) => {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_FAILS = 5
const LOCK_MINUTES = 15

export async function registerClient(_prev: AccountState, formData: FormData): Promise<AccountState> {
  if (str(formData, 'website')) return { status: 'success' } // ловушка для ботов
  const email = str(formData, 'email', 200).toLowerCase()
  const password = String(formData.get('password') ?? '')
  const name = str(formData, 'name', 120)
  if (!EMAIL_RE.test(email)) return { status: 'error', message: 'email' }
  if (name.length < 2) return { status: 'error', message: 'name' }
  if (password.length < 8 || password.length > 200) return { status: 'error', message: 'weak' }
  if (formData.get('consent') !== 'on') return { status: 'error', message: 'consent' }

  try {
    const payload = await getPayloadClient()
    const exists = await payload.count({ collection: 'clients', where: { email: { equals: email } }, overrideAccess: true })
    if (exists.totalDocs > 0) return { status: 'error', message: 'exists' }

    const { hash, salt } = await hashPassword(password)
    const locale = str(formData, 'locale', 5)
    const client = await payload.create({
      collection: 'clients',
      overrideAccess: true,
      data: {
        email,
        name,
        phone: str(formData, 'phone', 40) || undefined,
        passwordHash: hash,
        passwordSalt: salt,
        locale: isLocale(locale) ? locale : undefined,
      },
    })
    await setSessionCookie(client)
    return { status: 'success' }
  } catch (error) {
    console.error('registerClient failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function loginClient(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const email = str(formData, 'email', 200).toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!EMAIL_RE.test(email) || !password) return { status: 'error', message: 'invalid' }

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'clients',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const client = docs[0]
    // одинаковый ответ и для несуществующего email, и для неверного пароля
    if (!client || !client.passwordHash || !client.passwordSalt) {
      await hashPassword(password) // выравниваем время ответа
      return { status: 'error', message: 'invalid' }
    }
    if (client.lockedUntil && new Date(client.lockedUntil) > new Date()) return { status: 'error', message: 'locked' }

    const ok = await verifyPassword(password, client.passwordHash, client.passwordSalt)
    if (!ok) {
      const fails = (client.failedAttempts ?? 0) + 1
      await payload.update({
        collection: 'clients',
        id: client.id,
        overrideAccess: true,
        data:
          fails >= MAX_FAILS
            ? { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() }
            : { failedAttempts: fails },
      })
      return { status: 'error', message: fails >= MAX_FAILS ? 'locked' : 'invalid' }
    }

    if (client.failedAttempts || client.lockedUntil) {
      await payload.update({ collection: 'clients', id: client.id, overrideAccess: true, data: { failedAttempts: 0, lockedUntil: null } })
    }
    await setSessionCookie(client)
    return { status: 'success' }
  } catch (error) {
    console.error('loginClient failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function logoutClient() {
  await clearSessionCookie()
  revalidatePath('/', 'layout')
}

export async function updateProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const client = await getClient()
  if (!client) return { status: 'error', message: 'invalid' }
  const name = str(formData, 'name', 120)
  if (name.length < 2) return { status: 'error', message: 'name' }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'clients',
      id: client.id,
      overrideAccess: true,
      data: { name, phone: str(formData, 'phone', 40) || null },
    })
    revalidatePath('/', 'layout')
    return { status: 'success' }
  } catch (error) {
    console.error('updateProfile failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function requestPasswordReset(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const email = str(formData, 'email', 200).toLowerCase()
  if (!EMAIL_RE.test(email)) return { status: 'error', message: 'email' }
  const locale = str(formData, 'locale', 5)

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'clients',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const client = docs[0]
    if (client) {
      const { token, hash } = newResetToken()
      await payload.update({
        collection: 'clients',
        id: client.id,
        overrideAccess: true,
        data: { resetTokenHash: hash, resetExpires: new Date(Date.now() + 3600_000).toISOString() },
      })
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const link = `${base}/${isLocale(locale) ? locale : 'ru'}/account/reset?token=${token}`
      // Если SMTP не настроен, Payload выводит письмо в консоль сервера
      await payload.sendEmail({
        to: client.email,
        subject: 'DS Group — password reset',
        html: `<p>Для смены пароля перейдите по ссылке (действует 1 час):</p><p><a href="${link}">${link}</a></p><p>Если вы не запрашивали смену пароля, просто проигнорируйте это письмо.</p>`,
      })
    }
    // одинаковый ответ независимо от того, есть ли такой аккаунт
    return { status: 'success' }
  } catch (error) {
    console.error('requestPasswordReset failed', error)
    return { status: 'error', message: 'error' }
  }
}

export async function resetPassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const token = str(formData, 'token', 200)
  const password = String(formData.get('password') ?? '')
  if (password.length < 8 || password.length > 200) return { status: 'error', message: 'weak' }
  if (!token) return { status: 'error', message: 'token' }

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'clients',
      where: { and: [{ resetTokenHash: { equals: hashToken(token) } }, { resetExpires: { greater_than: new Date().toISOString() } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const client = docs[0]
    if (!client) return { status: 'error', message: 'token' }

    const { hash, salt } = await hashPassword(password)
    await payload.update({
      collection: 'clients',
      id: client.id,
      overrideAccess: true,
      data: {
        passwordHash: hash,
        passwordSalt: salt,
        sessionVersion: (client.sessionVersion ?? 0) + 1, // все старые сессии недействительны
        resetTokenHash: null,
        resetExpires: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
    })
    return { status: 'success' }
  } catch (error) {
    console.error('resetPassword failed', error)
    return { status: 'error', message: 'error' }
  }
}

/** Слияние избранного и поисков из браузера с сохранёнными на сервере. Возвращает итоговые списки. */
export type SyncPayload = { a: number[]; p: number[]; searches: { name: string; query: string }[] }

export async function syncAccount(local: SyncPayload): Promise<SyncPayload | null> {
  const client = await getClient()
  if (!client) return null
  try {
    const payload = await getPayloadClient()
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n) && n > 0).slice(0, 200) : [])
    const serverA = (client.favoriteApartments ?? []).map((x) => (typeof x === 'object' ? x.id : x))
    const serverP = (client.favoriteProjects ?? []).map((x) => (typeof x === 'object' ? x.id : x))
    const mergedA = [...new Set([...serverA, ...ids(local.a)])]
    const mergedP = [...new Set([...serverP, ...ids(local.p)])]

    const existing = (client.savedSearches ?? []).map((s) => ({ name: s.name, query: s.query ?? '' }))
    const seen = new Set(existing.map((s) => s.query))
    const incoming = (Array.isArray(local.searches) ? local.searches : [])
      .filter((s) => s && typeof s.name === 'string' && typeof s.query === 'string' && !seen.has(s.query))
      .map((s) => ({ name: s.name.slice(0, 200), query: s.query.slice(0, 500) }))
    const mergedSearches = [...incoming, ...existing].slice(0, 20)

    // Проверяем, что такие квартиры/ЖК существуют, иначе relationship упадёт
    const [aOk, pOk] = await Promise.all([
      mergedA.length
        ? payload.find({ collection: 'apartments', where: { id: { in: mergedA } }, select: {}, limit: 0, pagination: false, depth: 0, overrideAccess: true })
        : { docs: [] },
      mergedP.length
        ? payload.find({ collection: 'projects', where: { id: { in: mergedP } }, select: {}, limit: 0, pagination: false, depth: 0, overrideAccess: true })
        : { docs: [] },
    ])
    const finalA = mergedA.filter((id) => aOk.docs.some((d) => d.id === id))
    const finalP = mergedP.filter((id) => pOk.docs.some((d) => d.id === id))

    await payload.update({
      collection: 'clients',
      id: client.id,
      overrideAccess: true,
      data: { favoriteApartments: finalA, favoriteProjects: finalP, savedSearches: mergedSearches },
    })
    return { a: finalA, p: finalP, searches: mergedSearches }
  } catch (error) {
    console.error('syncAccount failed', error)
    return null
  }
}

/** Отправка текущего состояния браузера на сервер «как есть» (после удаления/добавления) */
export async function replaceAccountData(local: SyncPayload): Promise<void> {
  const client = await getClient()
  if (!client) return
  try {
    const payload = await getPayloadClient()
    const ids = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n) && n > 0).slice(0, 200) : [])
    const [aOk, pOk] = await Promise.all([
      ids(local.a).length
        ? payload.find({ collection: 'apartments', where: { id: { in: ids(local.a) } }, select: {}, limit: 0, pagination: false, depth: 0, overrideAccess: true })
        : { docs: [] },
      ids(local.p).length
        ? payload.find({ collection: 'projects', where: { id: { in: ids(local.p) } }, select: {}, limit: 0, pagination: false, depth: 0, overrideAccess: true })
        : { docs: [] },
    ])
    await payload.update({
      collection: 'clients',
      id: client.id,
      overrideAccess: true,
      data: {
        favoriteApartments: ids(local.a).filter((id) => aOk.docs.some((d) => d.id === id)),
        favoriteProjects: ids(local.p).filter((id) => pOk.docs.some((d) => d.id === id)),
        savedSearches: (Array.isArray(local.searches) ? local.searches : [])
          .filter((s) => s && typeof s.name === 'string' && typeof s.query === 'string')
          .slice(0, 20)
          .map((s) => ({ name: s.name.slice(0, 200), query: s.query.slice(0, 500) })),
      },
    })
  } catch (error) {
    console.error('replaceAccountData failed', error)
  }
}
