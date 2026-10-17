'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'

import {
  loginClient,
  logoutClient,
  registerClient,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  type AccountState,
} from '@/actions/account'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { CheckIcon } from './icons'

type D = Dictionary['account']
const initial: AccountState = { status: 'idle' }

function ErrorLine({ state, dict }: { state: AccountState; dict: D }) {
  if (state.status !== 'error') return null
  return (
    <p className="lead-form__error" role="alert">
      {dict.errors[state.message ?? 'error'] ?? dict.errors.error}
    </p>
  )
}

/** После успешного входа/регистрации идём в кабинет */
function useGoToAccount(state: AccountState, locale: Locale) {
  const router = useRouter()
  useEffect(() => {
    if (state.status === 'success') {
      router.push(`/${locale}/account`)
      router.refresh()
    }
  }, [state.status, router, locale])
}

export function LoginForm({ locale, dict, onForgot }: { locale: Locale; dict: D; onForgot: () => void }) {
  const [state, action, pending] = useActionState(loginClient, initial)
  useGoToAccount(state, locale)
  return (
    <form action={action} className="lead-form">
      <label className="field">
        <span className="field__label">{dict.email}</span>
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>
      <label className="field">
        <span className="field__label">{dict.password}</span>
        <input name="password" type="password" required autoComplete="current-password" maxLength={200} />
      </label>
      <ErrorLine state={state} dict={dict} />
      <button type="submit" className="btn btn--accent btn--block" disabled={pending || state.status === 'success'}>
        {pending ? dict.sending : dict.submitLogin}
      </button>
      <button type="button" className="auth-link" onClick={onForgot}>
        {dict.forgot}
      </button>
    </form>
  )
}

export function RegisterForm({ locale, dict }: { locale: Locale; dict: D }) {
  const [state, action, pending] = useActionState(registerClient, initial)
  useGoToAccount(state, locale)
  return (
    <form action={action} className="lead-form">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden />
      <div className="lead-form__row">
        <label className="field">
          <span className="field__label">{dict.name} *</span>
          <input name="name" type="text" required autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          <span className="field__label">{dict.phone}</span>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">{dict.email} *</span>
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>
      <label className="field">
        <span className="field__label">
          {dict.password} * <small>({dict.passwordHint})</small>
        </span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" maxLength={200} />
      </label>
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>{dict.consent}</span>
      </label>
      <ErrorLine state={state} dict={dict} />
      <button type="submit" className="btn btn--accent btn--block" disabled={pending || state.status === 'success'}>
        {pending ? dict.sending : dict.submitRegister}
      </button>
    </form>
  )
}

export function ForgotForm({ locale, dict, onBack }: { locale: Locale; dict: D; onBack: () => void }) {
  const [state, action, pending] = useActionState(requestPasswordReset, initial)
  if (state.status === 'success') {
    return (
      <div className="lead-form__success" role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={26} height={26} />
        </span>
        <p>{dict.forgotDone}</p>
        <button type="button" className="auth-link" onClick={onBack}>
          {dict.backToLogin}
        </button>
      </div>
    )
  }
  return (
    <form action={action} className="lead-form">
      <h2 className="auth-title">{dict.forgotTitle}</h2>
      <p className="auth-lead">{dict.forgotLead}</p>
      <input type="hidden" name="locale" value={locale} />
      <label className="field">
        <span className="field__label">{dict.email}</span>
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>
      <ErrorLine state={state} dict={dict} />
      <button type="submit" className="btn btn--accent btn--block" disabled={pending}>
        {pending ? dict.sending : dict.forgotSubmit}
      </button>
      <button type="button" className="auth-link" onClick={onBack}>
        {dict.backToLogin}
      </button>
    </form>
  )
}

/** Вход/регистрация/восстановление на одной странице */
export function AuthPanel({ locale, dict }: { locale: Locale; dict: D }) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  return (
    <div className="panel auth-panel">
      {tab !== 'forgot' && (
        <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'is-active' : ''} onClick={() => setTab('login')}>
            {dict.loginTab}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'is-active' : ''} onClick={() => setTab('register')}>
            {dict.registerTab}
          </button>
        </div>
      )}
      {tab === 'login' && <LoginForm locale={locale} dict={dict} onForgot={() => setTab('forgot')} />}
      {tab === 'register' && <RegisterForm locale={locale} dict={dict} />}
      {tab === 'forgot' && <ForgotForm locale={locale} dict={dict} onBack={() => setTab('login')} />}
    </div>
  )
}

export function ResetForm({ locale, token, dict }: { locale: Locale; token: string; dict: D }) {
  const [state, action, pending] = useActionState(resetPassword, initial)
  if (state.status === 'success') {
    return (
      <div className="lead-form__success" role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={26} height={26} />
        </span>
        <p>{dict.resetDone}</p>
        <Link href={`/${locale}/account`} className="btn btn--accent">
          {dict.backToLogin}
        </Link>
      </div>
    )
  }
  return (
    <form action={action} className="lead-form">
      <input type="hidden" name="token" value={token} />
      <label className="field">
        <span className="field__label">
          {dict.password} <small>({dict.passwordHint})</small>
        </span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" maxLength={200} />
      </label>
      <ErrorLine state={state} dict={dict} />
      <button type="submit" className="btn btn--accent btn--block" disabled={pending}>
        {pending ? dict.sending : dict.resetSubmit}
      </button>
    </form>
  )
}

export function ProfileForm({ dict, name, phone }: { dict: D; name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial)
  return (
    <form action={action} className="lead-form">
      <div className="lead-form__row">
        <label className="field">
          <span className="field__label">{dict.name}</span>
          <input name="name" type="text" required defaultValue={name} autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          <span className="field__label">{dict.phone}</span>
          <input name="phone" type="tel" defaultValue={phone} autoComplete="tel" inputMode="tel" maxLength={40} />
        </label>
      </div>
      <ErrorLine state={state} dict={dict} />
      <div className="profile-actions">
        <button type="submit" className="btn btn--accent" disabled={pending}>
          {pending ? dict.sending : dict.save}
        </button>
        {state.status === 'success' && <span className="profile-saved">✓ {dict.saved}</span>}
      </div>
    </form>
  )
}

export function LogoutButton({ label, locale }: { label: string; locale: Locale }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={async () => {
        await logoutClient()
        localStorage.removeItem('dsg:favorites')
        localStorage.removeItem('dsg:searches')
        router.push(`/${locale}/account`)
        router.refresh()
      }}
    >
      {label}
    </button>
  )
}
