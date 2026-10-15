import type { Field } from 'payload'

const translit: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .split('')
    .map((char) => translit[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugField = (source = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'URL (slug)',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Заполняется автоматически из названия. Латиница, цифры и дефисы.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        const sourceValue = data?.[source]
        if (typeof sourceValue === 'string') return slugify(sourceValue)
        return value
      },
    ],
  },
})
