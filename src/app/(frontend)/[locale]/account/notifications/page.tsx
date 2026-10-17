import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { CabinetShell } from '@/components/CabinetShell'
import { MarkReadOnMount } from '@/components/CabinetForms'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getClient } from '@/lib/clientAuth'
import { formatDate } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function NotificationsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const client = await getClient()
  if (!client) redirect(`/${locale}/account`)
  const dict = getDictionary(locale)

  const payload = await getPayloadClient()
  const list = await payload.find({
    collection: 'client-notifications',
    where: { client: { equals: client.id } },
    depth: 2,
    limit: 50,
    sort: '-createdAt',
    overrideAccess: true,
  })
  const unread = list.docs.filter((n) => !n.read).length

  return (
    <CabinetShell locale={locale} dict={dict} name={client.name || client.email} active="notifications" unread={unread}>
      <div className="cabinet__narrow panel">
        <h2 className="panel__title">{dict.cabinet.notify.title}</h2>
        {list.docs.length === 0 ? (
          <p className="account-empty">{dict.cabinet.notify.empty}</p>
        ) : (
          <ul className="account-list">
            {list.docs.map((n) => {
              const booking = typeof n.booking === 'object' && n.booking ? n.booking : null
              const apt = booking && typeof booking.apartment === 'object' ? booking.apartment : null
              const status = dict.account.bookingStatus[n.status ?? ''] ?? n.status ?? ''
              return (
                <li key={n.id} className={n.read ? '' : 'is-unread'}>
                  <div>
                    <strong>
                      {apt ? dict.cabinet.notify.booking(apt.number, status) : dict.cabinet.notify.bookingUnknown(status)}
                    </strong>
                    <span>{formatDate(n.createdAt, locale)}</span>
                  </div>
                  {apt && (
                    <Link href={`/${locale}/apartments/${apt.id}`} className="link-arrow">
                      {dict.account.openApartment}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <MarkReadOnMount enabled={unread > 0} />
    </CabinetShell>
  )
}
