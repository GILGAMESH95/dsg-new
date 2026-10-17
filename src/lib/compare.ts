/** Сравнение квартир и сохранённые поиски хранятся в localStorage (аккаунтов на сайте нет) */
const COMPARE_KEY = 'dsg:compare'
const SEARCH_KEY = 'dsg:searches'
export const COMPARE_EVENT = 'dsg:compare-change'
export const SEARCH_EVENT = 'dsg:searches-change'
export const COMPARE_MAX = 4

export type SavedSearch = { id: string; name: string; query: string; createdAt: number }

const readJson = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown, event: string) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // приватный режим: изменение живёт только до перезагрузки
  }
  window.dispatchEvent(new Event(event))
}

export const readCompare = (): number[] => {
  const raw = readJson<unknown>(COMPARE_KEY, [])
  return Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n)).slice(0, COMPARE_MAX) : []
}

/** Добавляет/убирает квартиру. При переполнении вытесняется самая ранняя. Возвращает 'full', если вытеснили. */
export function toggleCompare(id: number): 'added' | 'removed' | 'replaced' {
  const ids = readCompare()
  if (ids.includes(id)) {
    write(COMPARE_KEY, ids.filter((x) => x !== id), COMPARE_EVENT)
    return 'removed'
  }
  const replaced = ids.length >= COMPARE_MAX
  const next = replaced ? [...ids.slice(1), id] : [...ids, id]
  write(COMPARE_KEY, next, COMPARE_EVENT)
  return replaced ? 'replaced' : 'added'
}

export const clearCompare = () => write(COMPARE_KEY, [], COMPARE_EVENT)

export const readSearches = (): SavedSearch[] => {
  const raw = readJson<unknown>(SEARCH_KEY, [])
  return Array.isArray(raw)
    ? raw.filter(
        (s): s is SavedSearch => !!s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.query === 'string',
      )
    : []
}

/** Приводит query к устойчивому виду (без служебных параметров, отсортировано) для сравнения дублей */
export const normalizeQuery = (query: string) => {
  const q = new URLSearchParams(query)
  q.delete('shown')
  q.delete('mode')
  q.delete('page')
  return [...q.entries()].sort(([a, x], [b, y]) => (a + x).localeCompare(b + y)).map(([k, v]) => `${k}=${v}`).join('&')
}

export function saveSearch(name: string, query: string): boolean {
  const norm = normalizeQuery(query)
  const list = readSearches()
  if (list.some((s) => normalizeQuery(s.query) === norm)) return false
  const q = new URLSearchParams(query)
  q.delete('shown')
  write(SEARCH_KEY, [{ id: String(Date.now()), name, query: q.toString(), createdAt: Date.now() }, ...list].slice(0, 20), SEARCH_EVENT)
  return true
}

/** Полная замена списка поисков (синхронизация с аккаунтом) */
export const writeSearches = (list: SavedSearch[]) => write(SEARCH_KEY, list.slice(0, 20), SEARCH_EVENT)

export const deleteSearch =(id: string) => write(SEARCH_KEY, readSearches().filter((s) => s.id !== id), SEARCH_EVENT)
