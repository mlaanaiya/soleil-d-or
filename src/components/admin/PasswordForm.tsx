'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/admin/_actions/account'
import { initialState, type ActionState } from '@/lib/action-state'
import { Toast } from './Toast'

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, initialState)
  return (
    <form action={action} className="adm-card adm-form" key={state.ok ? state.at : 'form'}>
      <h2>Changer le mot de passe</h2>
      <p className="adm-card-sub">10 caractères minimum. Une phrase de passe facile à retenir est idéale.</p>
      <label className="adm-field">
        <span>Mot de passe actuel</span>
        <input name="current" type="password" autoComplete="current-password" required />
      </label>
      <div className="adm-grid-2">
        <label className="adm-field">
          <span>Nouveau mot de passe</span>
          <input name="next" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label className="adm-field">
          <span>Confirmation</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={10} required />
        </label>
      </div>
      <div>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </div>
      <Toast state={state} />
    </form>
  )
}
