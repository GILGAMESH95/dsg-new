import type { Payload } from 'payload'

import type { Booking, Lead, SupportRequest } from '../payload-types'
import { leadTypes } from '../collections/Leads'

const escape = (value: string) => value.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)

export async function notifySupportTelegram(request: SupportRequest, payload: Payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const clientId = typeof request.client === 'object' ? request.client.id : request.client
  const client = await payload.findByID({ collection: 'clients', id: clientId, depth: 0, overrideAccess: true }).catch(() => null)
  const lines = [`<b>💬 Обращение из личного кабинета</b>`, `Тема: ${escape(request.topic)}`]
  if (client) {
    lines.push(`Клиент: ${escape(client.name ?? client.email)}`, `Email: ${escape(client.email)}`)
    if (client.phone) lines.push(`Телефон: ${escape(client.phone)}`)
  }
  if (request.contactMethod) lines.push(`Связаться через: ${escape(request.contactMethod)}`)
  if (request.reference) lines.push(`Номер брони/договора: ${escape(request.reference)}`)
  lines.push(`Сообщение: ${escape(request.message)}`)

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
  })
}

export async function notifyBookingTelegram(booking: Booking, payload: Payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const lines = [`<b>🔑 Новая онлайн-бронь</b>`, `Имя: ${escape(booking.name)}`, `Телефон: ${escape(booking.phone)}`]
  if (booking.email) lines.push(`Email: ${escape(booking.email)}`)
  if (booking.contactMethod) lines.push(`Связаться через: ${escape(booking.contactMethod)}`)

  const aptId = typeof booking.apartment === 'object' ? booking.apartment.id : booking.apartment
  const apt = await payload.findByID({ collection: 'apartments', id: aptId, depth: 1 }).catch(() => null)
  if (apt) {
    const project = typeof apt.project === 'object' ? apt.project : null
    lines.push(`Квартира: № ${escape(apt.number)}, ${apt.rooms === 0 ? 'студия' : `${apt.rooms}-комн.`}, ${apt.area} м², $${apt.price}`)
    if (project) lines.push(`ЖК: ${escape(project.title)}`)
  }
  if (booking.holdUntil) lines.push(`Бронь до: ${new Date(booking.holdUntil).toISOString().slice(0, 16).replace('T', ' ')} UTC`)
  if (booking.message) lines.push(`Комментарий: ${escape(booking.message)}`)
  if (booking.page) lines.push(`Страница: ${escape(booking.page)}`)

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
  })
}

export async function notifyTelegram(lead: Lead, payload: Payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const lines = [`<b>🔥 Новая заявка с сайта</b>`]
  const type = leadTypes.find((t) => t.value === lead.type)?.label
  if (type) lines.push(`Тип: ${type}`)
  if (lead.name) lines.push(`Имя: ${escape(lead.name)}`)
  lines.push(`Телефон: ${escape(lead.phone)}`)
  if (lead.contactMethod) lines.push(`Связаться через: ${escape(lead.contactMethod)}`)

  if (lead.project) {
    const id = typeof lead.project === 'object' ? lead.project.id : lead.project
    const project = await payload.findByID({ collection: 'projects', id, depth: 0 }).catch(() => null)
    if (project) lines.push(`ЖК: ${escape(project.title)}`)
  }
  if (lead.apartment) {
    const id = typeof lead.apartment === 'object' ? lead.apartment.id : lead.apartment
    const apt = await payload.findByID({ collection: 'apartments', id, depth: 0 }).catch(() => null)
    if (apt) lines.push(`Квартира: ${escape(apt.title ?? apt.number)}, ${apt.area} м², $${apt.price}`)
  }
  if (lead.details) lines.push(`Детали: ${escape(lead.details)}`)
  if (lead.message) lines.push(`Комментарий: ${escape(lead.message)}`)
  if (lead.page) lines.push(`Страница: ${escape(lead.page)}`)
  if (lead.utm) lines.push(`UTM: ${escape(lead.utm)}`)

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
  })
}
