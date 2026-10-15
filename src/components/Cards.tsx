import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { formatDate, formatNumber, formatPrice } from '@/lib/format'
import type { Apartment, Post, Project, Promotion } from '@/payload-types'

import { ArrowIcon, PinIcon } from './icons'
import { Img } from './Img'

export function ProjectCard({
  project,
  locale,
  dict,
  priceFrom,
  available,
}: {
  project: Project
  locale: Locale
  dict: Dictionary
  priceFrom?: number | null
  available?: number
}) {
  return (
    <Link href={`/${locale}/projects/${project.slug}`} className="project-card">
      <Img media={project.cover} alt={project.title} size="card" className="project-card__img" sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="project-card__overlay" />
      <span className={`badge badge--${project.status}`}>{dict.statuses.project[project.status]}</span>
      <div className="project-card__body">
        {project.district && (
          <span className="project-card__district">
            <PinIcon width={16} height={16} /> {project.district}
          </span>
        )}
        <h3 className="project-card__title">{project.title}</h3>
        {project.tagline && <p className="project-card__tagline">{project.tagline}</p>}
        <dl className="project-card__meta">
          {priceFrom ? (
            <div>
              <dt>{dict.project.pricesFrom}</dt>
              <dd>{formatPrice(priceFrom, locale)}</dd>
            </div>
          ) : null}
          {project.completion && (
            <div>
              <dt>{dict.common.completion}</dt>
              <dd>{project.completion}</dd>
            </div>
          )}
          {available ? (
            <div>
              <dt>{dict.project.available}</dt>
              <dd>{available}</dd>
            </div>
          ) : null}
        </dl>
        <span className="project-card__more">
          {dict.common.more} <ArrowIcon width={18} height={18} />
        </span>
      </div>
    </Link>
  )
}

export function ApartmentCard({
  apartment,
  locale,
  dict,
}: {
  apartment: Apartment
  locale: Locale
  dict: Dictionary
}) {
  const project = typeof apartment.project === 'object' ? apartment.project : null
  return (
    <Link href={`/${locale}/apartments/${apartment.id}`} className="apt-card">
      <div className="apt-card__plan">
        <Img media={apartment.plan} alt={dict.apartment.plan} size="thumb" sizes="(max-width: 768px) 100vw, 25vw" />
        <span className={`status status--${apartment.status}`}>{dict.statuses.apartment[apartment.status]}</span>
        {apartment.promo && <span className="apt-card__promo">%</span>}
      </div>
      <div className="apt-card__body">
        {project && <span className="apt-card__project">{project.title}</span>}
        <h3 className="apt-card__title">
          {dict.common.roomsShort(apartment.rooms)} · {formatNumber(apartment.area, locale)} {dict.common.sqm}
        </h3>
        <div className="apt-card__meta">
          <span>
            {dict.common.floor} {apartment.floor}
          </span>
          <span>№ {apartment.number}</span>
          {apartment.view?.includes('sea') && <span>{dict.views.sea}</span>}
        </div>
        <div className="apt-card__price">
          <strong>{formatPrice(apartment.price, locale)}</strong>
          {apartment.oldPrice ? <s>{formatPrice(apartment.oldPrice, locale)}</s> : null}
          {apartment.pricePerSqm ? (
            <span>
              {formatPrice(apartment.pricePerSqm, locale)} {dict.common.perSqm}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function PostCard({ post, locale, dict }: { post: Post; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className="post-card">
      <Img media={post.cover} alt={post.title} size="card" className="post-card__img" sizes="(max-width: 768px) 100vw, 33vw" />
      <div className="post-card__body">
        <div className="post-card__meta">
          {post.category && <span>{dict.postCategories[post.category]}</span>}
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt, locale)}</time>
        </div>
        <h3 className="post-card__title">{post.title}</h3>
        {post.excerpt && <p className="post-card__excerpt">{post.excerpt}</p>}
      </div>
    </Link>
  )
}

export function PromoCard({
  promo,
  locale,
  dict,
  children,
}: {
  promo: Promotion
  locale: Locale
  dict: Dictionary
  children?: React.ReactNode
}) {
  return (
    <article className="promo-card">
      <Img media={promo.image} alt={promo.title} size="card" className="promo-card__img" sizes="(max-width: 768px) 100vw, 33vw" />
      {promo.badge && <span className="promo-card__badge">{promo.badge}</span>}
      <div className="promo-card__body">
        <h3 className="promo-card__title">{promo.title}</h3>
        {promo.description && <p>{promo.description}</p>}
        {promo.validUntil && (
          <span className="promo-card__until">
            {dict.common.validUntil} {formatDate(promo.validUntil, locale)}
          </span>
        )}
        {children}
      </div>
    </article>
  )
}
