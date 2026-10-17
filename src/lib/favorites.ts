/** Избранное хранится в localStorage: { a: [id квартир], p: [id комплексов] } */
export type FavKind = 'a' | 'p'
export type Favorites = Record<FavKind, number[]>

const KEY = 'dsg:favorites'
export const FAV_EVENT = 'dsg:favorites-change'

export function readFavorites(): Favorites {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Favorites>
    const clean = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : [])
    return { a: clean(raw.a), p: clean(raw.p) }
  } catch {
    return { a: [], p: [] }
  }
}

export function toggleFavorite(kind: FavKind, id: number): boolean {
  const favs = readFavorites()
  const has = favs[kind].includes(id)
  favs[kind] = has ? favs[kind].filter((x) => x !== id) : [...favs[kind], id]
  try {
    localStorage.setItem(KEY, JSON.stringify(favs))
  } catch {
    // хранилище недоступно (приватный режим) — состояние просто не сохранится
  }
  window.dispatchEvent(new Event(FAV_EVENT))
  return !has
}

/** Полная замена списка (используется синхронизацией с аккаунтом) */
export function writeFavorites(favs: Favorites) {
  try {
    localStorage.setItem(KEY, JSON.stringify(favs))
  } catch {
    // хранилище недоступно
  }
  window.dispatchEvent(new Event(FAV_EVENT))
}

export const countFavorites =(f: Favorites) => f.a.length + f.p.length
