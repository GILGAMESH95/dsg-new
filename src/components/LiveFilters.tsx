'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Делает GET-форму «живой», как фильтры на fsk.ru: результаты обновляются сразу при выборе,
 * без кнопки «Показать» и без перезагрузки страницы. Без JS форма работает как обычная.
 * Кладётся внутрь формы; ссылка с data-reset очищает все поля.
 */
export function LiveFilters() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const form = document.getElementById('catalog-form') as HTMLFormElement | null
    if (!form) return
    form.dataset.live = '1'
    let timer: ReturnType<typeof setTimeout> | undefined

    const apply = () => {
      const qs = new URLSearchParams()
      new FormData(form).forEach((v, k) => {
        if (typeof v === 'string' && v !== '') qs.append(k, v)
      })
      router.replace(qs.size ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
    const onSubmit = (e: Event) => {
      e.preventDefault()
      clearTimeout(timer)
      apply()
    }
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement
      if (t.name === 'sort') return // у сортировки свой requestSubmit
      if (t.type === 'number') {
        clearTimeout(timer)
        timer = setTimeout(apply, 600)
      } else {
        apply()
      }
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('[data-reset]')
      if (!a) return
      e.preventDefault()
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((el) => {
        if (el.type === 'hidden' || el.name === 'sort') return
        if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = false
        else el.value = ''
      })
      form.dispatchEvent(new Event('live-reset'))
      setTimeout(apply, 50) // даём ползункам убрать свои скрытые поля
    }

    form.addEventListener('submit', onSubmit)
    form.addEventListener('change', onChange)
    form.addEventListener('click', onClick)
    return () => {
      clearTimeout(timer)
      form.removeEventListener('submit', onSubmit)
      form.removeEventListener('change', onChange)
      form.removeEventListener('click', onClick)
      delete form.dataset.live
    }
  }, [router, pathname])

  return null
}
