import 'server-only'

import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { cache } from 'react'

import type { Client } from '@/payload-types'

import { getPayloadClient } from './payload'

export const SESSION_COOKIE = 'dsg_client'
const SESSION_DAYS = 30

const secret = () => {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET is not set')
  return s
}

// ---------- Пароли (scrypt) ----------

const scryptAsync = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  )

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt)).toString('hex')
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const a = Buffer.from(hash, 'hex')
  const b = await scryptAsync(password, salt)
  return a.length === b.length && timingSafeEqual(a, b)
}

// ---------- Токены сброса пароля ----------

export const newResetToken = () => {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: createHash('sha256').update(token).digest('hex') }
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

// ---------- Подписанная cookie сессии ----------

type Session = { id: number; sv: number; exp: number }

const sign = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url')

export function createSessionValue(client: { id: number; sessionVersion?: number | null }) {
  const session: Session = {
    id: client.id,
    sv: client.sessionVersion ?? 0,
    exp: Date.now() + SESSION_DAYS * 24 * 3600 * 1000,
  }
  const body = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${body}.${sign(body)}`
}

function readSessionValue(value: string | undefined): Session | null {
  if (!value) return null
  const [body, sig] = value.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session
    return session.exp > Date.now() ? session : null
  } catch {
    return null
  }
}

export async function setSessionCookie(client: { id: number; sessionVersion?: number | null }) {
  ;(await cookies()).set(SESSION_COOKIE, createSessionValue(client), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  })
}

export async function clearSessionCookie() {
  ;(await cookies()).delete(SESSION_COOKIE)
}

/** Число непрочитанных уведомлений клиента */
export async function getUnreadCount(clientId: number) {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: 'client-notifications',
    where: { and: [{ client: { equals: clientId } }, { read: { equals: false } }] },
    overrideAccess: true,
  })
  return totalDocs
}

/** Текущий клиент по cookie (или null). Данные для входа из ответа убраны. */
export const getClient = cache(async (): Promise<Omit<Client, 'passwordHash' | 'passwordSalt' | 'resetTokenHash'> | null> => {
  const session = readSessionValue((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) return null
  const payload = await getPayloadClient()
  const client = await payload
    .findByID({ collection: 'clients', id: session.id, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!client || (client.sessionVersion ?? 0) !== session.sv) return null
  // служебные поля входа наружу не отдаём
  const { passwordHash: _h, passwordSalt: _s, resetTokenHash: _r, ...safe } = client
  void _h
  void _s
  void _r
  return safe
})
