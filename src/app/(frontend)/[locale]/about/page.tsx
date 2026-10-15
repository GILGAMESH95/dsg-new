import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { Img } from '@/components/Img'
import { RichText } from '@/components/RichText'
import { PageHero, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getSettings } from '@/lib/payload'
import { getProjects } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/about', title: dict.about.title, description: dict.footer.about })
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const [settings, projects] = await Promise.all([getSettings(locale), getProjects(locale)])
  const completed = projects.filter((p) => p.status === 'completed')

  return (
    <>
      <PageHero
        title={settings.aboutTitle || dict.about.title}
        lead={dict.about.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container about">
          <div>
            <RichText data={settings.aboutText} />
            {settings.stats && settings.stats.length > 0 && (
              <dl className="about__stats">
                {settings.stats.map((s) => (
                  <div key={s.id}>
                    <dt>{s.value}</dt>
                    <dd>{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <Img media={settings.aboutImage} alt="DS Group" className="about__img" sizes="(max-width: 960px) 100vw, 45vw" />
        </div>
      </section>
      <section className="section section--warm">
        <div className="container">
          <SectionHead title={dict.about.valuesTitle} />
          <div className="why">
            {dict.home.why.map((item, i) => (
              <div key={item.title} className="why__item">
                <span className="why__num">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {completed.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead title={dict.project.completedTitle} />
            <div className="grid grid--3">
              {completed.map((p) => (
                <ProjectCard key={p.id} project={p} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
