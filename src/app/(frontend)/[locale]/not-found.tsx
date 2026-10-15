import Link from 'next/link'

import { getDictionary } from '@/i18n'
import { defaultLocale } from '@/i18n/config'

export default function NotFound() {
  const dict = getDictionary(defaultLocale)
  return (
    <section className="section not-found">
      <div className="container">
        <span className="not-found__code">404</span>
        <h1>{dict.notFound.title}</h1>
        <p>{dict.notFound.text}</p>
        <Link href={`/${defaultLocale}`} className="btn btn--accent">
          {dict.notFound.home}
        </Link>
      </div>
    </section>
  )
}
