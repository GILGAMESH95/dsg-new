import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ResetForm } from '@/components/AccountForms'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const { token } = await searchParams

  return (
    <>
      <PageHero
        title={dict.account.resetTitle}
        crumbs={[
          { href: `/${locale}`, label: dict.common.breadcrumbsHome },
          { href: `/${locale}/account`, label: dict.account.title },
        ]}
      />
      <section className="section section--tight">
        <div className="container container--narrow">
          <div className="panel auth-panel">
            {token ? (
              <ResetForm locale={locale} token={token} dict={dict.account} />
            ) : (
              <>
                <p className="lead-form__error">{dict.account.errors.token}</p>
                <Link href={`/${locale}/account`} className="btn btn--accent">
                  {dict.account.backToLogin}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
