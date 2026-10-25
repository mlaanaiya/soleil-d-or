'use client'

import { startTransition, useActionState, type FormEvent } from 'react'
import { initialState, type ActionState } from '@/lib/action-state'

/**
 * Submits a form to a server action without React's automatic form reset, so that a validation
 * error never wipes what the restaurateur has just typed.
 */
export function useAdminForm(action: (state: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, initialState)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(() => dispatch(form))
  }
  return [state, onSubmit, pending] as const
}
