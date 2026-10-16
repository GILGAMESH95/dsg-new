/**
 * Импорт реальных данных и фото с действующего сайта dsg.ge (через его публичный API api.dsg.ge).
 * Запуск: pnpm import:dsg
 * ВНИМАНИЕ: удаляет все ЖК, квартиры, акции, статьи и медиа (заявки и пользователи не трогаются).
 */
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'

const API = 'https://api.dsg.ge'
type Loc = 'ru' | 'ka' | 'en'
const LOCALES: Loc[] = ['ru', 'ka', 'en']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

// ---------- Загрузка данных ----------

async function getJson(path: string): Promise<Json> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json()
}

const projectQuery =
  'populate[cover_image]=true&populate[gallery][populate]=*&populate[features]=true&populate[specifications]=true' +
  '&populate[floor_plans][populate]=*&pagination[pageSize]=100'

async function loadByLocale(path: string, query: string) {
  const out = {} as Record<Loc, Json[]>
  for (const l of LOCALES) {
    out[l] = (await getJson(`/api/${path}?locale=${l}&${query}`)).data
  }
  return out
}

// ---------- Медиа ----------

const mimeByExt: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}
const mediaCache = new Map<string, number>()

async function importMedia(payload: Payload, url: string | undefined, alt: string) {
  if (!url) return undefined
  const cached = mediaCache.get(url)
  if (cached) return cached
  const res = await fetch(url.startsWith('http') ? url : `${API}${url}`)
  if (!res.ok) throw new Error(`Не удалось скачать ${url}: ${res.status}`)
  const data = Buffer.from(await res.arrayBuffer())
  const name = url.split('/').pop()!
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype: mimeByExt[ext] ?? 'image/jpeg', name, size: data.length },
  })
  mediaCache.set(url, doc.id)
  return doc.id
}

// ---------- Rich text ----------

const text = (t: string) => ({ type: 'text', text: t, version: 1, format: 0, detail: 0, mode: 'normal', style: '' })
const block = { direction: 'ltr' as const, format: '' as const, indent: 0 }
const paragraph = (t: string) => ({ type: 'paragraph', version: 1, ...block, textFormat: 0, children: [text(t)] })
const list = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  version: 1,
  ...block,
  children: items.map((t, i) => ({ type: 'listitem', value: i + 1, version: 1, ...block, children: [text(t)] })),
})

/** Простой текст с абзацами и «- пункт» → lexical. */
function toRichText(src: string | null | undefined) {
  const lines = (src ?? '').split('\n').map((l) => l.trim())
  const children: Json[] = []
  let items: string[] = []
  const flush = () => {
    if (items.length) children.push(list(items))
    items = []
  }
  for (const line of lines) {
    if (line.startsWith('- ')) items.push(line.slice(2).trim())
    else {
      flush()
      if (line) children.push(paragraph(line))
    }
  }
  flush()
  if (!children.length) return undefined
  return { root: { type: 'root', version: 1, ...block, children } }
}

// ---------- Очистка ----------

async function clear(payload: Payload) {
  for (const collection of ['apartments', 'promotions', 'posts', 'projects', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

// ---------- Подписи ----------

const L = {
  plans: { ru: 'Планировки', ka: 'გეგმარებები', en: 'Floor plans' },
  area: { ru: 'м²', ka: 'მ²', en: 'm²' },
  apartments: { ru: 'Квартир', ka: 'ბინების რაოდენობა', en: 'Apartments' },
}

const fixLocation = (s: string | undefined) => (s ?? '').replace(/^BaATUMI$/, 'BATUMI')

// ---------- Main ----------

async function run() {
  const payload = await getPayload({ config })

  payload.logger.info('Загружаю данные с api.dsg.ge…')
  const projects = await loadByLocale('projects', projectQuery)
  const news = await loadByLocale('news-items', 'populate=*&pagination[pageSize]=100')

  payload.logger.info('Удаляю демо-данные…')
  await clear(payload)

  const byDoc = (arr: Json[], id: string) => arr.find((p) => p.documentId === id)

  // ---------- ЖК ----------
  const sorted = [...projects.ka].sort((a, b) => (a.project_status === 'in_progress' ? -1 : 0) - (b.project_status === 'in_progress' ? -1 : 0))
  for (const [index, kaProject] of sorted.entries()) {
    const perLocale = {} as Record<Loc, Json>
    for (const l of LOCALES) perLocale[l] = byDoc(projects[l], kaProject.documentId) ?? kaProject
    const title = kaProject.title as string
    payload.logger.info(`ЖК ${title}…`)

    const completed = kaProject.project_status === 'completed'
    const spec = (p: Json, i: number) => p.specifications?.[i]?.value as string | undefined

    const cover = await importMedia(payload, kaProject.cover_image?.url, title)
    if (!cover) throw new Error(`У ЖК ${title} нет обложки`)
    const galleryUrls = [...new Set<string>((kaProject.gallery ?? []).map((g: Json) => g.image?.url).filter(Boolean))]
    const planUrls = [...new Set<string>((kaProject.floor_plans ?? []).map((p: Json) => p.image?.url).filter(Boolean))]
    const gallery = []
    for (const [i, u] of [...galleryUrls, ...planUrls].entries()) {
      const id = await importMedia(payload, u, `${title} ${i + 1}`)
      if (id) gallery.push({ image: id })
    }

    const descriptionFor = (l: Loc) => {
      const p = perLocale[l]
      const base = toRichText(p.content)
      const extra: Json[] = []
      if (p.floor_plans?.length) {
        extra.push(paragraph(`${L.plans[l]}:`))
        extra.push(
          list(
            p.floor_plans.map(
              (f: Json) => `${f.name} (${f.rooms}) — ${f.area} ${L.area[l]}, ${f.price}`,
            ),
          ),
        )
      }
      const apartments = spec(p, 3)
      if (apartments) extra.push(paragraph(`${L.apartments[l]}: ${apartments}`))
      if (!base && !extra.length) return undefined
      return { root: { type: 'root', version: 1, ...block, children: [...(base?.root.children ?? []), ...extra] } }
    }

    const dataFor = (l: Loc) => {
      const p = perLocale[l]
      return {
        title: p.title,
        tagline: p.status_label || undefined,
        excerpt: p.short_description?.trim() || undefined,
        address: fixLocation(p.location),
        description: descriptionFor(l),
      }
    }

    const floors = Number(spec(kaProject, 2))
    const doc = await payload.create({
      collection: 'projects',
      locale: 'ru',
      data: {
        ...dataFor('ru'),
        slug: String(kaProject.slug).toLowerCase(),
        status: completed ? 'completed' : 'construction',
        order: index + 1,
        featured: true,
        completion: completed ? undefined : spec(kaProject, 1),
        floors: Number.isFinite(floors) && floors > 0 ? floors : undefined,
        cover,
        gallery,
        features: (perLocale.ru.features ?? []).map((f: Json) => ({ text: f.text })),
        // условия рассрочки на dsg.ge не указаны — не придумываем их
        minDownPayment: null,
        maxInstallmentMonths: null,
      } as never,
    })

    const created = await payload.findByID({ collection: 'projects', id: doc.id, locale: 'ru', depth: 0 })
    for (const l of ['ka', 'en'] as const) {
      await payload.update({
        collection: 'projects',
        id: doc.id,
        locale: l,
        data: {
          ...dataFor(l),
          features: (created.features ?? []).map((row, i) => ({
            id: row.id,
            text: perLocale[l].features?.[i]?.text ?? '',
          })),
        } as never,
      })
    }
  }

  // ---------- Новости ----------
  for (const kaPost of news.ka) {
    payload.logger.info(`Новость ${kaPost.slug}…`)
    const per = {} as Record<Loc, Json>
    for (const l of LOCALES) per[l] = byDoc(news[l], kaPost.documentId) ?? kaPost
    const cover = await importMedia(payload, kaPost.featured_media?.url, per.en.title)
    const dataFor = (l: Loc) => ({
      title: per[l].title,
      excerpt: per[l].excerpt,
      content: toRichText(per[l].content),
    })
    const doc = await payload.create({
      collection: 'posts',
      locale: 'ru',
      data: {
        ...dataFor('ru'),
        slug: kaPost.slug,
        category: kaPost.category === 'construction' ? 'construction' : 'news',
        publishedAt: new Date(kaPost.publishedDate).toISOString(),
        _status: 'published',
        cover,
      } as never,
    })
    for (const l of ['ka', 'en'] as const) {
      await payload.update({ collection: 'posts', id: doc.id, locale: l, data: dataFor(l) as never })
    }
  }

  // ---------- Настройки сайта ----------
  const hero = await importMedia(payload, sorted[0].cover_image?.url, 'UNIQ Residence')
  const settings: Record<Loc, Json> = {
    ru: {
      address: 'Батуми, ул. К. Гамсахурдиа, 13',
      workingHours: 'Ежедневно 10:00–19:00',
      aboutTitle: 'О компании DS GROUP',
      aboutText: toRichText('DS GROUP — девелоперская компания, которая строит жилые комплексы в Батуми.'),
      stats: ['жилых комплексов', 'комплексов сдано', 'квартир в UNIQ Residence'],
    },
    ka: {
      address: 'ბათუმი, კ. გამსახურდიას ქ. 13',
      workingHours: 'ყოველდღე 10:00–19:00',
      aboutTitle: 'DS GROUP-ის შესახებ',
      aboutText: toRichText('DS GROUP — დეველოპერული კომპანია, რომელიც ბათუმში საცხოვრებელ კომპლექსებს აშენებს.'),
      stats: ['საცხოვრებელი კომპლექსი', 'კომპლექსი ჩაბარებულია', 'ბინა UNIQ Residence-ში'],
    },
    en: {
      address: 'Batumi, 13 K. Gamsakhurdia St.',
      workingHours: 'Daily 10:00–19:00',
      aboutTitle: 'About DS GROUP',
      aboutText: toRichText('DS GROUP is a development company building residential complexes in Batumi.'),
      stats: ['residential complexes', 'complexes completed', 'apartments in UNIQ Residence'],
    },
  }
  const values = [String(sorted.length), String(sorted.filter((p) => p.project_status === 'completed').length), '300']
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ru',
    data: {
      phone: '+995 511 71 11 11',
      email: 'info@dsg.ge',
      whatsapp: '995511711111',
      telegram: 'uniq_vision',
      officeLat: null,
      officeLng: null,
      instagram: 'https://www.instagram.com/__ds_group__/',
      facebook: 'https://www.facebook.com/dsg.batumi/',
      heroImage: hero,
      aboutImage: null,
      ...settings.ru,
      stats: values.map((value, i) => ({ value, label: settings.ru.stats[i] })),
    } as never,
  })
  const saved = await payload.findGlobal({ slug: 'site-settings', locale: 'ru' })
  for (const l of ['ka', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: l,
      data: {
        address: settings[l].address,
        workingHours: settings[l].workingHours,
        aboutTitle: settings[l].aboutTitle,
        aboutText: settings[l].aboutText,
        stats: saved.stats?.map((s, i) => ({ id: s.id, value: s.value, label: settings[l].stats[i] })),
      } as never,
    })
  }

  payload.logger.info('Готово ✔')
  process.exit(0)
}

await run().catch((e) => {
  console.error(e)
  process.exit(1)
})
