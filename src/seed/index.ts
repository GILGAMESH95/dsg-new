/**
 * Демо-наполнение сайта заглушками.
 * Запуск: pnpm seed
 * ВНИМАНИЕ: удаляет все ЖК, квартиры, акции, статьи и медиа (заявки и пользователи не трогаются).
 */
import crypto from 'crypto'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../payload.config'

type Loc = 'ru' | 'ka' | 'en'
type Localized = Partial<Record<Loc, string>>

// ---------- Генерация картинок-заглушек ----------

async function svgToFile(svg: string, name: string) {
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
  return { data, mimetype: 'image/jpeg', name: `${name}.jpg`, size: data.length }
}

function sceneSvg(label: string, seed: number, w = 1600, h = 1000) {
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  const hueShift = Math.round(rand(1) * 30)
  const towers = Array.from({ length: 9 }, (_, i) => {
    const tw = 90 + rand(i + 2) * 110
    const th = 260 + rand(i + 20) * 520
    const x = (i / 9) * w + rand(i + 40) * 40
    const windows = Array.from({ length: Math.floor(th / 34) }, (_, r) =>
      Array.from({ length: Math.floor(tw / 28) }, (_, c) =>
        rand(i * 100 + r * 10 + c) > 0.55
          ? `<rect x="${x + 10 + c * 28}" y="${h - th + 16 + r * 34}" width="14" height="18" fill="#ffb27a" opacity="${0.35 + rand(r + c) * 0.5}"/>`
          : '',
      ).join(''),
    ).join('')
    return `<rect x="${x}" y="${h - th}" width="${tw}" height="${th}" fill="#1b1b1f" stroke="#2c2c33"/>${windows}`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${215 + hueShift},35%,12%)"/>
      <stop offset="0.6" stop-color="hsl(${20 + hueShift},55%,32%)"/>
      <stop offset="1" stop-color="hsl(${22 + hueShift},85%,52%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <circle cx="${w * 0.72}" cy="${h * 0.62}" r="${h * 0.12}" fill="#ffcf9e" opacity="0.55"/>
  ${towers}
  <rect y="${h - 40}" width="100%" height="40" fill="#0f0f12"/>
  <text x="48" y="${h - 70}" font-family="Arial, sans-serif" font-size="${Math.round(h / 22)}" font-weight="700" fill="#ffffff" opacity="0.9">${label}</text>
  <text x="48" y="${h - 70 - Math.round(h / 16)}" font-family="Arial, sans-serif" font-size="${Math.round(h / 40)}" letter-spacing="6" fill="#f26a1b">DS GROUP · ФОТО-ЗАГЛУШКА</text>
</svg>`
}

function planSvg(rooms: number) {
  const W = 900
  const H = 700
  const wall = '#1d1d1d'
  const room = (x: number, y: number, w: number, h: number, label: string, area: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${wall}" stroke-width="8"/>
     <text x="${x + w / 2}" y="${y + h / 2 - 6}" text-anchor="middle" font-family="Arial" font-size="22" fill="#555">${label}</text>
     <text x="${x + w / 2}" y="${y + h / 2 + 22}" text-anchor="middle" font-family="Arial" font-size="18" fill="#f26a1b">${area}</text>`
  const layouts: Record<number, string> = {
    0: room(80, 80, 500, 540, 'Studio', '24.5 m²') + room(580, 80, 240, 260, 'WC', '4.2 m²') + room(580, 340, 240, 280, 'Hall', '5.1 m²'),
    1:
      room(80, 80, 420, 320, 'Living / Kitchen', '22.4 m²') +
      room(500, 80, 320, 320, 'Bedroom', '13.8 m²') +
      room(80, 400, 260, 220, 'WC', '4.6 m²') +
      room(340, 400, 480, 220, 'Hall', '6.2 m²'),
    2:
      room(80, 80, 380, 340, 'Living / Kitchen', '24.1 m²') +
      room(460, 80, 360, 240, 'Bedroom', '14.2 m²') +
      room(460, 320, 360, 300, 'Bedroom', '12.6 m²') +
      room(80, 420, 200, 200, 'WC', '4.4 m²') +
      room(280, 420, 180, 200, 'Hall', '5.8 m²'),
    3:
      room(80, 80, 360, 300, 'Living', '26.3 m²') +
      room(440, 80, 380, 200, 'Bedroom', '15.1 m²') +
      room(440, 280, 380, 180, 'Bedroom', '12.4 m²') +
      room(80, 380, 240, 240, 'Bedroom', '11.8 m²') +
      room(320, 380, 120, 240, 'WC', '4.1 m²') +
      room(440, 460, 380, 160, 'Kitchen', '10.2 m²'),
  }
  const body = layouts[Math.min(rooms, 3)]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="100%" height="100%" fill="#fafaf8"/>
    ${body}
    <rect x="80" y="40" width="740" height="16" fill="#9fc6e8" opacity="0.7"/>
    <text x="${W - 40}" y="${H - 20}" text-anchor="end" font-family="Arial" font-size="16" fill="#aaa">DS GROUP · PLAN</text>
  </svg>`
}

// ---------- Rich text ----------

const text = (t: string) => ({ type: 'text', text: t, version: 1, format: 0, detail: 0, mode: 'normal', style: '' })
const paragraph = (t: string) => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  children: [text(t)],
})
const heading = (t: string) => ({
  type: 'heading',
  tag: 'h2',
  version: 1,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  children: [text(t)],
})
const richText = (...blocks: { h?: string; p?: string }[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: blocks.map((b) => (b.h ? heading(b.h) : paragraph(b.p!))),
  },
})

// ---------- Helpers ----------

async function clear(payload: Payload) {
  for (const collection of ['apartments', 'promotions', 'posts', 'projects', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

async function media(payload: Payload, svg: string, name: string, alt: string) {
  return payload.create({ collection: 'media', data: { alt }, file: await svgToFile(svg, name) })
}

async function localize<T extends 'projects' | 'promotions' | 'posts'>(
  payload: Payload,
  collection: T,
  id: number,
  fields: Record<string, Localized>,
) {
  for (const locale of ['ka', 'en'] as const) {
    const data: Record<string, string> = {}
    for (const [k, v] of Object.entries(fields)) if (v[locale]) data[k] = v[locale]!
    if (Object.keys(data).length) await payload.update({ collection, id, locale, data: data as never })
  }
}

// ---------- Main ----------

async function seed() {
  const payload = await getPayload({ config })
  payload.logger.info('Очищаю демо-данные…')
  await clear(payload)

  // Админ
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs === 0) {
    const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url')
    await payload.create({ collection: 'users', data: { email: 'admin@dsg.ge', password, name: 'Admin' } })
    payload.logger.info(`Создан администратор: admin@dsg.ge / ${password}`)
  }

  payload.logger.info('Генерирую картинки-заглушки…')
  const hero = await media(payload, sceneSvg('Batumi', 1, 1920, 1080), 'hero', 'Батуми, вид на город')
  const about = await media(payload, sceneSvg('DS Group', 7, 1000, 1250), 'about', 'Офис DS Group')
  const plans: Record<number, number> = {}
  for (const r of [0, 1, 2, 3]) {
    plans[r] = (await media(payload, planSvg(r), `plan-${r}`, `Планировка ${r === 0 ? 'студии' : `${r}-комн.`}`)).id
  }

  // ---------- ЖК ----------
  const projectsData = [
    {
      title: 'DS Tower',
      slug: 'ds-tower',
      status: 'selling' as const,
      order: 1,
      tagline: { ru: 'Премиальная башня на первой линии моря', ka: 'პრემიუმ კოშკი ზღვის პირველ ზოლზე', en: 'Premium beachfront tower' },
      excerpt: {
        ru: '30-этажный жилой комплекс в 150 метрах от моря: панорамные окна, бассейн на крыше и собственная управляющая компания.',
        ka: '30-სართულიანი საცხოვრებელი კომპლექსი ზღვიდან 150 მეტრში: პანორამული ფანჯრები, აუზი სახურავზე.',
        en: 'A 30-storey residence 150 m from the sea: panoramic windows, rooftop pool and in-house management.',
      },
      district: { ru: 'Новый бульвар', ka: 'ახალი ბულვარი', en: 'New Boulevard' },
      address: { ru: 'Батуми, ул. Шериф Химшиашвили', ka: 'ბათუმი, შერიფ ხიმშიაშვილის ქ.', en: 'Batumi, Sherif Khimshiashvili St.' },
      completion: { ru: 'IV квартал 2027', ka: '2027 წლის IV კვარტალი', en: 'Q4 2027' },
      floors: 30,
      distanceToSea: 150,
      lat: 41.6339,
      lng: 41.6061,
      seedNo: 2,
      floorRange: [3, 17],
      basePrice: 1450,
      features: [
        'Панорамное остекление в пол',
        'Бассейн и лаунж-зона на крыше',
        'Подземный паркинг',
        'Лобби с ресепшен 24/7',
        'Сдача с white frame отделкой',
      ],
      progress: [
        { date: '2026-08-01', title: 'Монолит 18-го этажа', percent: 55 },
        { date: '2026-05-01', title: 'Монолит 12-го этажа', percent: 40 },
        { date: '2026-02-01', title: 'Завершён подземный паркинг', percent: 22 },
      ],
    },
    {
      title: 'DS Residence',
      slug: 'ds-residence',
      status: 'construction' as const,
      order: 2,
      tagline: { ru: 'Камерный клубный дом в Старом Батуми', ka: 'კლუბური სახლი ძველ ბათუმში', en: 'Boutique club house in Old Batumi' },
      excerpt: {
        ru: '14 этажей, закрытый двор без машин и 5 минут пешком до Площади Европы. Идеально для жизни и посуточной аренды.',
        ka: '14 სართული, დახურული ეზო და 5 წუთი ფეხით ევროპის მოედნამდე.',
        en: '14 floors, a car-free private courtyard and a 5-minute walk to Europe Square.',
      },
      district: { ru: 'Старый Батуми', ka: 'ძველი ბათუმი', en: 'Old Batumi' },
      address: { ru: 'Батуми, ул. Мемеда Абашидзе', ka: 'ბათუმი, მემედ აბაშიძის ქ.', en: 'Batumi, Memed Abashidze St.' },
      completion: { ru: 'II квартал 2027', ka: '2027 წლის II კვარტალი', en: 'Q2 2027' },
      floors: 14,
      distanceToSea: 400,
      lat: 41.6497,
      lng: 41.6367,
      seedNo: 3,
      floorRange: [2, 13],
      basePrice: 1250,
      features: ['Закрытый двор без машин', 'Детская площадка', 'Коммерческие помещения на 1 этаже', 'Видеонаблюдение'],
      progress: [
        { date: '2026-09-01', title: 'Кладка стен 10-го этажа', percent: 70 },
        { date: '2026-06-01', title: 'Каркас здания завершён', percent: 60 },
      ],
    },
    {
      title: 'DS Park',
      slug: 'ds-park',
      status: 'completed' as const,
      order: 3,
      tagline: { ru: 'Сдан в 2024 году', ka: 'ჩაბარდა 2024 წელს', en: 'Completed in 2024' },
      excerpt: {
        ru: 'Жилой комплекс у Батумского ботанического сада. Все квартиры проданы, жильцы заселены.',
        ka: 'საცხოვრებელი კომპლექსი ბათუმის ბოტანიკურ ბაღთან. ყველა ბინა გაყიდულია.',
        en: 'A residence near Batumi Botanical Garden. Fully sold and occupied.',
      },
      district: { ru: 'Махинджаури', ka: 'მახინჯაური', en: 'Makhinjauri' },
      address: { ru: 'Махинджаури', ka: 'მახინჯაური', en: 'Makhinjauri' },
      completion: { ru: '2024', ka: '2024', en: '2024' },
      floors: 12,
      distanceToSea: 250,
      lat: 41.6731,
      lng: 41.6936,
      seedNo: 5,
      floorRange: [0, -1],
      basePrice: 0,
      features: ['Вид на море и горы', 'Рядом Ботанический сад'],
      progress: [],
    },
  ]

  const projectIds: Record<string, number> = {}
  for (const p of projectsData) {
    payload.logger.info(`ЖК ${p.title}…`)
    const cover = await media(payload, sceneSvg(p.title, p.seedNo), `${p.slug}-cover`, p.title)
    const gallery = []
    for (let i = 0; i < 5; i++) {
      gallery.push({ image: (await media(payload, sceneSvg(`${p.title} · ${i + 1}`, p.seedNo * 10 + i, 1200, 900), `${p.slug}-g${i}`, `${p.title} ${i + 1}`)).id })
    }
    const progress = []
    for (const [i, pr] of p.progress.entries()) {
      const photo = await media(payload, sceneSvg(pr.title, p.seedNo * 100 + i, 800, 600), `${p.slug}-pr${i}`, pr.title)
      progress.push({ date: pr.date, title: pr.title, percent: pr.percent, photos: [photo.id] })
    }
    const doc = await payload.create({
      collection: 'projects',
      locale: 'ru',
      data: {
        title: p.title,
        slug: p.slug,
        status: p.status,
        order: p.order,
        featured: true,
        tagline: p.tagline.ru,
        excerpt: p.excerpt.ru,
        district: p.district.ru,
        address: p.address.ru,
        completion: p.completion.ru,
        floors: p.floors,
        distanceToSea: p.distanceToSea,
        lat: p.lat,
        lng: p.lng,
        cover: cover.id,
        gallery,
        progress,
        features: p.features.map((t) => ({ text: t })),
        minDownPayment: 20,
        maxInstallmentMonths: p.status === 'construction' ? 24 : 36,
        installmentNote:
          'Первый взнос от 20%, остаток — равными ежемесячными платежами без процентов и без участия банка. Возможна индивидуальная схема оплаты.',
        description: richText(
          { p: `${p.title} — проект DS Group. Это демонстрационный текст: здесь будет подробное описание комплекса, архитектуры, инженерных решений и инфраструктуры района.` },
          { h: 'Архитектура и материалы' },
          { p: 'Монолитно-каркасная технология, фасад из вентилируемых панелей, энергоэффективные стеклопакеты, бесшумные лифты.' },
          { h: 'Инфраструктура' },
          { p: 'В шаговой доступности — набережная, супермаркеты, школы, рестораны и общественный транспорт.' },
        ),
      },
    })
    await localize(payload, 'projects', doc.id, {
      title: { ka: p.title, en: p.title },
      tagline: p.tagline,
      excerpt: p.excerpt,
      district: p.district,
      address: p.address,
      completion: p.completion,
    })
    projectIds[p.slug] = doc.id

    // ---------- Квартиры ----------
    const [fromFloor, toFloor] = p.floorRange
    const types = [
      { rooms: 0, area: 28.4 },
      { rooms: 1, area: 44.6 },
      { rooms: 2, area: 67.2 },
      { rooms: 3, area: 92.8 },
    ]
    let n = 0
    for (let floor = fromFloor; floor <= toFloor; floor++) {
      for (const [i, t] of types.entries()) {
        n++
        const r = Math.abs(Math.sin(floor * 31 + i * 7 + p.seedNo))
        const status = r < 0.18 ? 'sold' : r < 0.28 ? 'reserved' : 'available'
        const area = Math.round((t.area + (r - 0.5) * 4) * 10) / 10
        const price = Math.round((area * (p.basePrice + floor * 12)) / 100) * 100
        const promo = r > 0.9
        await payload.create({
          collection: 'apartments',
          data: {
            project: doc.id,
            number: `${floor}${String(i + 1).padStart(2, '0')}`,
            rooms: t.rooms,
            floor,
            area,
            price: promo ? Math.round((price * 0.92) / 100) * 100 : price,
            oldPrice: promo ? price : undefined,
            status,
            promo,
            view: i % 2 === 0 ? ['sea', 'city'] : ['mountains', 'city'],
            hasBalcony: true,
            renovated: false,
            plan: plans[t.rooms],
          },
        })
      }
    }
    if (n) payload.logger.info(`  квартир: ${n}`)
  }

  // ---------- Акции ----------
  const promos = [
    {
      title: { ru: 'Рассрочка 0% на 36 месяцев', ka: 'განვადება 0% 36 თვით', en: '0% installments for 36 months' },
      badge: { ru: '0%', ka: '0%', en: '0%' },
      description: {
        ru: 'Первый взнос от 20%, остаток — равными платежами без процентов и без банка.',
        ka: 'პირველადი შენატანი 20%-დან, დარჩენილი — თანაბარი გადახდებით.',
        en: 'From 20% down, the rest in equal interest-free payments.',
      },
      project: projectIds['ds-tower'],
    },
    {
      title: { ru: 'Скидка 8% при 100% оплате', ka: '8% ფასდაკლება 100% გადახდისას', en: '8% off with full payment' },
      badge: { ru: '−8%', ka: '−8%', en: '−8%' },
      description: {
        ru: 'При единовременной оплате квартиры — скидка 8% от стоимости.',
        ka: 'ბინის ერთჯერადი გადახდისას — 8% ფასდაკლება.',
        en: 'Pay in full and get 8% off the price.',
      },
      project: projectIds['ds-residence'],
    },
    {
      title: { ru: 'Ремонт в подарок', ka: 'რემონტი საჩუქრად', en: 'Free renovation' },
      badge: { ru: 'Gift', ka: 'Gift', en: 'Gift' },
      description: {
        ru: 'При покупке 2- и 3-комнатных квартир до конца года — ремонт под ключ в подарок.',
        ka: '2- და 3-ოთახიანი ბინების ყიდვისას — რემონტი საჩუქრად.',
        en: 'Buy a 2- or 3-bedroom apartment before year-end and get a turnkey renovation.',
      },
      project: projectIds['ds-tower'],
    },
  ]
  for (const [i, pr] of promos.entries()) {
    const image = await media(payload, sceneSvg(pr.title.ru, 40 + i, 1200, 700), `promo-${i}`, pr.title.ru)
    const doc = await payload.create({
      collection: 'promotions',
      locale: 'ru',
      data: {
        title: pr.title.ru,
        badge: pr.badge.ru,
        description: pr.description.ru,
        project: pr.project,
        image: image.id,
        order: i,
        active: true,
        validUntil: '2026-12-31T00:00:00.000Z',
      },
    })
    await localize(payload, 'promotions', doc.id, { title: pr.title, description: pr.description, badge: pr.badge })
  }

  // ---------- Блог ----------
  const posts = [
    { title: 'DS Tower: завершён монолит 18-го этажа', category: 'construction', date: '2026-08-05' },
    { title: 'Как купить квартиру в Батуми иностранцу: пошаговая инструкция', category: 'investment', date: '2026-07-20' },
    { title: 'Доходность посуточной аренды в Батуми в 2026 году', category: 'investment', date: '2026-07-02' },
    { title: 'DS Group открыла новый офис продаж', category: 'news', date: '2026-06-15' },
    { title: '10 причин переехать жить в Батуми', category: 'batumi', date: '2026-05-28' },
    { title: 'Старт продаж в DS Residence', category: 'news', date: '2026-04-10' },
  ] as const
  for (const [i, post] of posts.entries()) {
    const cover = await media(payload, sceneSvg(post.title, 60 + i, 1200, 800), `post-${i}`, post.title)
    await payload.create({
      collection: 'posts',
      locale: 'ru',
      data: {
        title: post.title,
        category: post.category,
        publishedAt: new Date(post.date).toISOString(),
        _status: 'published',
        cover: cover.id,
        excerpt: 'Демонстрационный анонс статьи. Здесь будет краткое описание материала, которое увидят посетители в списке новостей.',
        content: richText(
          { p: 'Это демонстрационный текст статьи. Замените его в админ-панели на реальный материал.' },
          { h: 'Подзаголовок раздела' },
          { p: 'Пишите полезный контент для покупателей и инвесторов: так сайт будет лучше находиться в Google по запросам о недвижимости в Батуми.' },
          { p: 'Каждая статья поддерживает три языка: грузинский, русский и английский.' },
        ),
      },
    })
  }

  // ---------- Настройки ----------
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ru',
    data: {
      phone: '+995 555 00 00 00',
      email: 'info@dsg.ge',
      whatsapp: '995555000000',
      telegram: 'dsgroup_batumi',
      address: 'Батуми, ул. Шериф Химшиашвили, 1 (заглушка)',
      workingHours: 'Ежедневно 10:00–20:00',
      officeLat: 41.6339,
      officeLng: 41.6061,
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      heroImage: hero.id,
      aboutImage: about.id,
      aboutTitle: 'О компании DS Group',
      aboutText: richText(
        { p: 'DS Group — батумский застройщик жилых комплексов. Мы сами проектируем, строим и продаём квартиры — без посредников.' },
        { p: 'Это демонстрационный текст. Расскажите здесь историю компании, команду, подход к качеству и планы.' },
      ),
      stats: [
        { value: '10+', label: 'лет на рынке' },
        { value: '5', label: 'жилых комплексов' },
        { value: '1 200+', label: 'довольных владельцев' },
        { value: '36', label: 'мес. рассрочки' },
      ],
    },
  })
  const settings = await payload.findGlobal({ slug: 'site-settings', locale: 'ru' })
  const statsLabels: Record<'ka' | 'en', string[]> = {
    ka: ['წელი ბაზარზე', 'საცხოვრებელი კომპლექსი', 'კმაყოფილი მფლობელი', 'თვე განვადება'],
    en: ['years on the market', 'residential complexes', 'happy owners', 'months of installments'],
  }
  for (const locale of ['ka', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      data: {
        address: locale === 'ka' ? 'ბათუმი, შერიფ ხიმშიაშვილის ქ. 1' : 'Batumi, 1 Sherif Khimshiashvili St.',
        workingHours: locale === 'ka' ? 'ყოველდღე 10:00–20:00' : 'Daily 10:00–20:00',
        stats: settings.stats?.map((s, i) => ({ id: s.id, value: s.value, label: statsLabels[locale][i] })),
      },
    })
  }

  payload.logger.info('Готово ✔')
  process.exit(0)
}

await seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
