import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { PageHero, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getProjects, getProjectStats } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/projects', title: dict.nav.projects, description: dict.home.projectsLead })
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const [projects, stats] = await Promise.all([getProjects(locale), getProjectStats()])
  const active = projects.filter((p) => p.status !== 'completed')
  const completed = projects.filter((p) => p.status === 'completed')

  return (
    <>
      <PageHero
        title={dict.home.projectsTitle}
        lead={dict.home.projectsLead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container">
          <SectionHead title={dict.project.sellingTitle} />
          <div className="grid grid--2">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} locale={locale} dict={dict} priceFrom={stats[p.id]?.priceFrom} available={stats[p.id]?.available} />
            ))}
          </div>
        </div>
      </section>
      {completed.length > 0 && (
        <section className="section section--tight">
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
