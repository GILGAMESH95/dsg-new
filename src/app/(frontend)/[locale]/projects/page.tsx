import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CtaSection } from '@/components/CtaSection'
import { ProjectGrid } from '@/components/ProjectGrid'
import { PageHero } from '@/components/Section'
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

  return (
    <>
      <PageHero
        title={dict.home.projectsTitle}
        lead={dict.home.projectsLead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container">
          <ProjectGrid projects={projects} locale={locale} dict={dict} stats={stats} />
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
