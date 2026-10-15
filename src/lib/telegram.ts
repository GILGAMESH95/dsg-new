import type { Payload } from 'payload'

import type { Lead } from '../payload-types'
import { leadTypes } from '../collections/Leads'

const escape = (value: string) => value.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)

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
