'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { useEffect, useRef, useState } from 'react'

export type SelectOption = { value: string; label: string }

/** Radix не принимает пустое значение у пункта, поэтому «все / любой» хранится под служебным ключом */
const EMPTY = '__empty'

/**
 * Выпадающий список в стиле сайта (подход shadcn/ui: Radix Select + свои стили).
 * Если задан name, значение уходит в форму скрытым полем и шлёт событие change — на него реагируют живые фильтры.
 */
export function UiSelect({
  options,
  name,
  defaultValue = '',
  value: controlled,
  onValueChange,
  submitOnChange = false,
  className = '',
  ariaLabel,
}: {
  options: SelectOption[]
  name?: string
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  /** После выбора отправить родительскую форму (для сортировки) */
  submitOnChange?: boolean
  className?: string
  ariaLabel?: string
}) {
  const [inner, setInner] = useState(defaultValue)
  const value = controlled ?? inner
  const hidden = useRef<HTMLInputElement>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const input = hidden.current
    if (!input) return
    input.dispatchEvent(new Event('change', { bubbles: true }))
    if (submitOnChange) input.form?.requestSubmit()
  }, [value, submitOnChange])

  const pick = (v: string) => {
    const next = v === EMPTY ? '' : v
    setInner(next)
    onValueChange?.(next)
  }

  const toKey = (v: string) => (v === '' ? EMPTY : v)

  return (
    <>
      <RadixSelect.Root value={toKey(value)} onValueChange={pick}>
        <RadixSelect.Trigger className={`ui-select ${className}`} aria-label={ariaLabel}>
          <RadixSelect.Value />
          <RadixSelect.Icon className="ui-select__icon">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="m1 1.5 5 5 5-5" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="ui-select__content" position="popper" sideOffset={6} align="start">
            <RadixSelect.Viewport className="ui-select__viewport">
              {options.map((o) => (
                <RadixSelect.Item key={o.value} value={toKey(o.value)} className="ui-select__item">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ui-select__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {name && <input ref={hidden} type="hidden" name={name} value={value} />}
    </>
  )
}
