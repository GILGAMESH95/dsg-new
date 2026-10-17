import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { formatDate, formatNumber, formatPrice } from '@/lib/format'
import type { Apartment, Post, Project, Promotion } from '@/payload-types'

import { CompareButton } from './CompareButton'
import { FavoriteButton } from './FavoriteButton'
import { ArrowIcon, WalkIcon } from './icons'
import { Img } from './Img'

export function ProjectCard({
  project,
  locale,
  dict,
  priceFrom,
}: {
  project: Project
  locale: Locale
  dict: Dictionary
  priceFrom?: number | null
  available?: number
}) {
  const from = dict.common.from.charAt(0).toUpperCase() + dict.common.from.slice(1)
  const tags = (project.tags ?? []).filter((t) => t.text)
  return (
    <div className="fav-wrap">
      {/* Карточка как у fsk.ru: фото на всю карточку, название сверху, теги и цена снизу */}
      <Link href={`/${locale}/projects/${project.slug}`} className="project-card pcard">
        <Img media={project.cover} alt={project.title} size="card" className="project-card__img" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="pcard__shade" />
        <h3 className="pcard__title">{project.title}</h3>
        <div className="pcard__bottom">
          {tags.length > 0 && (
            <div className="pcard__chips">
              {tags.map((t, i) => (
                <span key={t.id ?? i} className="pcard__chip">
                  {t.text}
                </span>
              ))}
            </div>
          )}
          <div className="pcard__chips">
            <span className="pcard__chip pcard__chip--muted">{dict.statuses.project[project.status]}</span>
            {project.tagline && <span className="pcard__chip pcard__chip--muted">{project.tagline}</span>}
          </div>
          <div className="pcard__meta">
            <span className="pcard__loc">
              {project.district && (
                <span className="pcard__district">
                  <i aria-hidden /> {project.district}
                </span>
              )}
              {project.distanceToSea ? (
                <span className="pcard__walk" title={dict.common.toSea}>
                  <WalkIcon width={15} height={15} /> {project.distanceToSea} {dict.common.meters}
                </span>
              ) : null}
            </span>
            {priceFrom ? (
              <strong className="pcard__price">
                {from} {formatPrice(priceFrom, locale)}
              </strong>
            ) : project.completion ? (
              <strong className="pcard__price">
                {dict.common.completion} {project.completion}
              </strong>
            ) : null}
          </div>
        </div>
      </Link>
      <FavoriteButton kind="p" id={project.id} labels={dict.favorites} />
    </div>
  )
}

export function ApartmentCard({
  apartment,
  locale,
  dict,
  groupLabel,
}: {
  apartment: Apartment
  locale: Locale
  dict: Dictionary
  /** Для вкладки «Виды планировок»: подпись «N квартир» на плитке */
  groupCount?: number
  groupLabel?: string
}) {
  const project = typeof apartment.project === 'object' ? apartment.project : null
  const { meta, tags, discount } = apartmentFacts(apartment, dict)
  return (
    <div className="fav-wrap">
      {/* Белая карточка как у fsk.ru: сверху текст и теги, ниже планировка и цена */}
      <Link href={`/${locale}/apartments/${apartment.id}`} className="apt-card apt-card--white">
        <h3 className="apt-card__title">
          {dict.common.roomsShort(apartment.rooms)}, {formatNumber(apartment.area, locale)} {dict.common.sqm}
        </h3>
        {project && <span className="apt-card__project">{project.title}</span>}
        <span className="apt-card__meta">{[...meta, groupLabel ?? dict.statuses.apartment[apartment.status]].join(', ')}</span>
        {tags.length > 0 && (
          <div className="apt-card__tags">
            {tags.slice(0, 3).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
        <div className="apt-card__plan">
          <Img media={apartment.plan} alt={dict.apartment.plan} size="thumb" sizes="(max-width: 768px) 100vw, 25vw" />
        </div>
        <div className="apt-card__price">
          <strong>{formatPrice(apartment.price, locale)}</strong>
          {apartment.pricePerSqm ? (
            <span>
              {formatPrice(apartment.pricePerSqm, locale)} {dict.common.perSqm}
            </span>
          ) : null}
        </div>
        {apartment.oldPrice ? (
          <div className="apt-card__old">
            <s>{formatPrice(apartment.oldPrice, locale)}</s>
            {discount > 0 && <em>−{discount}%</em>}
          </div>
        ) : null}
      </Link>
      <FavoriteButton kind="a" id={apartment.id} labels={dict.favorites} />
      <CompareButton id={apartment.id} labels={dict.compare} />
    </div>
  )
}

/** Строка списка квартир (режим «Список» в каталоге) */
export function ApartmentRow({ apartment, locale, dict }: { apartment: Apartment; locale: Locale; dict: Dictionary }) {
  const project = typeof apartment.project === 'object' ? apartment.project : null
  const { meta, tags, discount } = apartmentFacts(apartment, dict)
  return (
    <div className="fav-wrap apt-row-wrap">
      <Link href={`/${locale}/apartments/${apartment.id}`} className="apt-row">
        <div className="apt-row__plan">
          <Img media={apartment.plan} alt={dict.apartment.plan} size="thumb" sizes="140px" />
        </div>
        <div className="apt-row__main">
          <h3>
            {dict.common.roomsShort(apartment.rooms)} · {formatNumber(apartment.area, locale)} {dict.common.sqm}
          </h3>
          {project && <span className="apt-card__project">{project.title}</span>}
          <div className="apt-card__meta">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          {tags.length > 0 && (
            <div className="apt-card__tags">
              {tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="apt-row__price">
          <span className={`status status--${apartment.status}`}>{dict.statuses.apartment[apartment.status]}</span>
          <strong>{formatPrice(apartment.price, locale)}</strong>
          {apartment.oldPrice ? (
            <s>
              {formatPrice(apartment.oldPrice, locale)} {discount > 0 && <em>−{discount}%</em>}
            </s>
          ) : null}
          {apartment.pricePerSqm ? (
            <span>
              {formatPrice(apartment.pricePerSqm, locale)} {dict.common.perSqm}
            </span>
          ) : null}
        </div>
      </Link>
      <FavoriteButton kind="a" id={apartment.id} labels={dict.favorites} />
      <CompareButton id={apartment.id} labels={dict.compare} />
    </div>
  )
}

/** Подписи, теги и скидка квартиры для карточки/строки */
export function apartmentFacts(apartment: Apartment, dict: Dictionary) {
  const project = typeof apartment.project === 'object' ? apartment.project : null
  const meta = [
    apartment.building,
    project?.floors ? `${dict.common.floor} ${dict.apartment.floorOf(apartment.floor, project.floors)}` : `${dict.common.floor} ${apartment.floor}`,
    apartment.finish ? dict.catalog.finishOptions[apartment.finish] : null,
    `№ ${apartment.number}`,
  ].filter(Boolean) as string[]
  const tags = [
    ...(apartment.features ?? []).map((f) => dict.catalog.featureOptions[f]),
    ...(apartment.view ?? []).map((v) => dict.views[v]),
  ].filter(Boolean) as string[]
  const discount =
    apartment.oldPrice && apartment.oldPrice > apartment.price
      ? Math.round((1 - apartment.price / apartment.oldPrice) * 100)
      : 0
  return { meta, tags, discount }
}

export function PostCard({ post, locale, dict }: { post: Post; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/about/news/${post.slug}`} className="post-card">
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

/** Строка в списке новостей: заголовок, дата, «Читать новость» */
export function PostRow({ post, locale, dict }: { post: Post; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/about/news/${post.slug}`} className="news-row">
      <div className="news-row__text">
        <h3>{post.title}</h3>
        <div className="post-card__meta">
          {post.category && <span>{dict.postCategories[post.category]}</span>}
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt, locale)}</time>
        </div>
      </div>
      <span className="link-arrow">
        {dict.blog.readNews} <ArrowIcon width={18} height={18} />
      </span>
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
        <h3 className="promo-card__title">
          <Link href={`/${locale}/promo/${promo.slug ?? promo.id}`} className="promo-card__link">
            {promo.title}
          </Link>
        </h3>
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
