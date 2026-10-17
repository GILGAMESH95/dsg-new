import { FaqAccordion } from '@/components/ui/FaqAccordion'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { CabinetShell } from '@/components/CabinetShell'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getClient, getUnreadCount } from '@/lib/clientAuth'
import { getPayloadClient } from '@/lib/payload'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CabinetFaqPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const client = await getClient()
  if (!client) redirect(`/${locale}/account`)
  const dict = getDictionary(locale)

  const payload = await getPayloadClient()
  const [unread, faqs] = await Promise.all([
    getUnreadCount(client.id),
    payload.find({ collection: 'faqs', locale, depth: 0, limit: 200, sort: 'order' }),
  ])
  const groups = Object.keys(dict.faq.categories)
    .map((key) => ({ key, items: faqs.docs.filter((d) => d.category === key) }))
    .filter((g) => g.items.length > 0)

  return (
    <CabinetShell locale={locale} dict={dict} name={client.name || client.email} active="faq" unread={unread}>
      <div className="cabinet__narrow">
        <h2 className="panel__title">{dict.cabinet.faqTitle}</h2>
        {groups.length === 0 ? (
          <p className="empty">{dict.faq.empty}</p>
        ) : (
          groups.map((g) => (
            <div key={g.key} className="faq-group">
              <h2>{dict.faq.categories[g.key]}</h2>
              <FaqAccordion items={g.items.map((i) => ({ id: i.id, question: i.question, answer: i.answer }))} />
            </div>
          ))
        )}
      </div>
    </CabinetShell>
  )
}
