'use client'

import { UiSelect } from './ui/Select'

/** Сортировка каталога: красивый список, после выбора сразу отправляет форму */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  label,
}: {
  name: string
  defaultValue: string
  options: { value: string; label: string }[]
  label: string
}) {
  return <UiSelect name={name} defaultValue={defaultValue} options={options} ariaLabel={label} submitOnChange className="ui-select--sort" />
}
