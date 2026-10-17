'use client'

import { useActionState, useEffect, useState } from 'react'

import { subscribe, type SubscribeState } from '@/actions/subscribe'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { CheckIcon } from './icons'

export function SubscribeForm({
  locale,
  dict,
  project,
}: {
  locale: Locale
  dict: Dictionary['subscribe']
  project?: number
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: 'idle' })
  const [page, setPage] = useState('')
  useEffect(() => setPage(window.location.pathname), [])

  if (state.status === 'success') {
    return (
      <div className="subscribe subscribe--done" role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={24} height={24} />
        </span>
        <p>{dict.success}</p>
      </div>
    )
  }

  const error =
    state.status === 'error' ? (state.message === 'email' ? dict.invalid : state.message === 'consent' ? dict.consentRequired : dict.error) : null

  return (
    <form action={action} className="subscribe">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="page" value={page} />
      {project && <input type="hidden" name="project" value={project} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden />
      <div className="subscribe__row">
        <input name="email" type="email" required autoComplete="email" placeholder={dict.placeholder} aria-label={dict.placeholder} maxLength={200} />
        <button type="submit" className="btn btn--accent" disabled={pending}>
          {pending ? dict.sending : dict.submit}
        </button>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>{dict.consent}</span>
      </label>
      <label className="checkbox">
        <input type="checkbox" name="marketing" />
        <span>{dict.marketing}</span>
      </label>
      {error && (
        <p className="lead-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
