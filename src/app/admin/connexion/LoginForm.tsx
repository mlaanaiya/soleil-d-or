'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null, username: '' })
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="suite" value={next} />
      <label className="adm-field">
        <span>Identifiant</span>
        <input
          name="username"
          autoComplete="username"
          required
          autoFocus={!state.username}
          defaultValue={state.username}
        />
      </label>
      <label className="adm-field">
        <span>Mot de passe</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={Boolean(state.username)}
        />
      </label>
      {state.error && (
        <p className="adm-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
