import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { LogoutButton, ProfileForm } from '@/components/AccountForms'
import { CabinetShell } from '@/components/CabinetShell'
import { ChangePasswordForm, DeleteAccountForm } from '@/components/CabinetForms'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getClient, getUnreadCount } from '@/lib/clientAuth'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const client = await getClient()
  if (!client) redirect(`/${locale}/account`)
  const dict = getDictionary(locale)
  const unread = await getUnreadCount(client.id)
  const clientDict = { errors: dict.cabinet.errors, settings: dict.cabinet.settings, support: dict.cabinet.support }

  return (
    <CabinetShell locale={locale} dict={dict} name={client.name || client.email} active="settings" unread={unread}>
      <div className="cabinet__narrow panel">
        <h2 className="panel__title">{dict.cabinet.settings.profile}</h2>
        <p className="account-email">
          {client.email} · {dict.cabinet.settings.emailLocked}
        </p>
        <ProfileForm dict={dict.account} name={client.name ?? ''} phone={client.phone ?? ''} />

        <hr className="cabinet__rule" />
        <h2 className="panel__title">{dict.cabinet.settings.passwordTitle}</h2>
        <ChangePasswordForm dict={clientDict} account={dict.account} />

        <hr className="cabinet__rule" />
        <div className="cabinet__danger">
          <LogoutButton label={dict.cabinet.menu.logout} locale={locale} />
          <DeleteAccountForm locale={locale} dict={clientDict} account={dict.account} />
        </div>
      </div>
    </CabinetShell>
  )
}
