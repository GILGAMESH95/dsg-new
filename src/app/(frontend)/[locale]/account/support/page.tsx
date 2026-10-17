import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { CabinetShell } from '@/components/CabinetShell'
import { SupportForm } from '@/components/CabinetForms'
import { WhatsappIcon } from '@/components/icons'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getClient, getUnreadCount } from '@/lib/clientAuth'
import { whatsappHref } from '@/lib/format'
import { getSettings } from '@/lib/payload'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function SupportPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const client = await getClient()
  if (!client) redirect(`/${locale}/account`)
  const dict = getDictionary(locale)
  const [unread, settings] = await Promise.all([getUnreadCount(client.id), getSettings(locale)])
  const s = dict.cabinet.support

  return (
    <CabinetShell locale={locale} dict={dict} name={client.name || client.email} active="support" unread={unread}>
      <div className="cabinet__narrow panel">
        <h2 className="panel__title">{s.title}</h2>
        <p className="account-empty support-lead">{s.lead}</p>
        {settings.whatsapp && (
          <div className="support-chat">
            <WhatsappIcon width={28} height={28} />
            <span>{s.chatLead}</span>
            <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener" className="btn btn--ghost btn--sm">
              {s.chat}
            </a>
          </div>
        )}
        <p className="support-or">
          <span>{s.or}</span>
        </p>
        <SupportForm
          dict={{ errors: dict.cabinet.errors, settings: dict.cabinet.settings, support: dict.cabinet.support }}
          formDict={dict.form}
        />
      </div>
    </CabinetShell>
  )
}
