'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'

import { changePassword, deleteAccount, markNotificationsRead, submitSupport, type SimpleState } from '@/actions/accountExtra'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { UiSelect } from './ui/Select'
import { CheckIcon } from './icons'

const initial: SimpleState = { status: 'idle' }

/** Только сериализуемые строки: функции из словаря в клиентские компоненты передавать нельзя */
export type CabinetClientDict = Pick<Dictionary['cabinet'], 'errors' | 'settings' | 'support'>

function Err({ state, dict }: { state: SimpleState; dict: CabinetClientDict }) {
  if (state.status !== 'error') return null
  return (
    <p className="lead-form__error" role="alert">
      {dict.errors[state.message ?? 'error'] ?? dict.errors.error}
    </p>
  )
}

export function ChangePasswordForm({ dict, account }: { dict: CabinetClientDict; account: Dictionary['account'] }) {
  const [state, action, pending] = useActionState(changePassword, initial)
  return (
    <form action={action} className="lead-form">
      <label className="field">
        <span className="field__label">{dict.settings.current}</span>
        <input name="current" type="password" required autoComplete="current-password" maxLength={200} />
      </label>
      <label className="field">
        <span className="field__label">
          {dict.settings.next} <small>({account.passwordHint})</small>
        </span>
        <input name="next" type="password" required minLength={8} autoComplete="new-password" maxLength={200} />
      </label>
      <Err state={state} dict={dict} />
      {state.status === 'success' && <p className="profile-saved">✓ {dict.settings.passwordChanged}</p>}
      <div className="profile-actions">
        <button type="submit" className="btn btn--accent" disabled={pending}>
          {pending ? account.sending : account.save}
        </button>
      </div>
    </form>
  )
}

export function DeleteAccountForm({ locale, dict, account }: { locale: Locale; dict: CabinetClientDict; account: Dictionary['account'] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(deleteAccount, initial)

  useEffect(() => {
    if (state.status === 'success') {
      try {
        localStorage.removeItem('dsg:favorites')
        localStorage.removeItem('dsg:searches')
      } catch {
        // нет доступа к хранилищу — не критично
      }
      router.push(`/${locale}/account`)
      router.refresh()
    }
  }, [state.status, router, locale])

  if (!open) {
    return (
      <button type="button" className="danger-link" onClick={() => setOpen(true)}>
        {dict.settings.deleteToggle}
      </button>
    )
  }
  return (
    <form action={action} className="lead-form danger-box">
      <h3>{dict.settings.deleteTitle}</h3>
      <p>{dict.settings.deleteWarn}</p>
      <label className="field">
        <span className="field__label">{dict.settings.deletePassword}</span>
        <input name="password" type="password" required autoComplete="current-password" maxLength={200} />
      </label>
      <Err state={state} dict={dict} />
      <div className="profile-actions">
        <button type="submit" className="btn btn--danger" disabled={pending}>
          {pending ? account.sending : dict.settings.deleteSubmit}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
          ×
        </button>
      </div>
    </form>
  )
}

export function SupportForm({ dict, formDict }: { dict: CabinetClientDict; formDict: Dictionary['form'] }) {
  const [state, action, pending] = useActionState(submitSupport, initial)
  const s = dict.support
  if (state.status === 'success') {
    return (
      <div className="lead-form__success" role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={26} height={26} />
        </span>
        <p>{s.done}</p>
      </div>
    )
  }
  return (
    <form action={action} className="lead-form">
      <div className="lead-form__row">
        <label className="field">
          <span className="field__label">{s.topic} *</span>
          <UiSelect name="topic" ariaLabel={s.topic} options={[{ value: '', label: '—' }, ...Object.entries(s.topics).map(([value, label]) => ({ value, label }))]} />
        </label>
        <label className="field">
          <span className="field__label">{s.reference}</span>
          <input name="reference" type="text" maxLength={80} />
        </label>
      </div>
      <fieldset className="lead-form__methods">
        <legend className="field__label">{formDict.contactMethod}</legend>
        {Object.entries(formDict.methods).map(([value, label], i) => (
          <label key={value} className="chip">
            <input type="radio" name="contactMethod" value={label} defaultChecked={i === 0} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span className="field__label">{s.message} *</span>
        <textarea name="message" rows={5} required maxLength={3000} />
      </label>
      <Err state={state} dict={dict} />
      <button type="submit" className="btn btn--accent btn--block" disabled={pending}>
        {pending ? s.sending : s.send}
      </button>
    </form>
  )
}

/** Открытие списка уведомлений помечает их прочитанными */
export function MarkReadOnMount({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(async () => {
      await markNotificationsRead()
      router.refresh()
    }, 1500)
    return () => clearTimeout(t)
  }, [enabled, router])
  return null
}
