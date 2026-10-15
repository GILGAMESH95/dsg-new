import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { LeadForm, type LeadHidden } from './LeadForm'

export function CtaSection({
  locale,
  dict,
  title,
  lead,
  hidden,
}: {
  locale: Locale
  dict: Dictionary
  title?: string
  lead?: string
  hidden?: LeadHidden
}) {
  return (
    <section className="section cta">
      <div className="container cta__inner">
        <div className="cta__text">
          <h2 className="cta__title">{title ?? dict.home.ctaTitle}</h2>
          <p className="cta__lead">{lead ?? dict.home.ctaLead}</p>
        </div>
        <div className="cta__form">
          <LeadForm locale={locale} dict={dict.form} hidden={hidden} variant="dark" />
        </div>
      </div>
    </section>
  )
}
