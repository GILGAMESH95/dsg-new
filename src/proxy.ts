import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, isLocale, locales, type Locale } from './i18n/config'

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get('locale')?.value
  if (isLocale(cookie)) return cookie
  const header = request.headers.get('accept-language') ?? ''
  for (const part of header.split(',')) {
    const code = part.split(';')[0]?.trim().slice(0, 2).toLowerCase()
    if (isLocale(code)) return code
  }
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const first = pathname.split('/')[1]
  if (isLocale(first)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${detectLocale(request)}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Пропускаем админку, API, статику и служебные файлы
  matcher: ['/((?!admin|api|_next|favicon|robots.txt|sitemap.xml|.*\\..*).*)'],
}
