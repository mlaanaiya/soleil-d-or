'use server'

import { redirect } from 'next/navigation'
import { runAdmin, str, type ActionState } from '@/lib/server/admin-action'
import { assertAdmin, endSession, sessionToken } from '@/lib/server/auth'
import { changePassword, destroyOtherSessions } from '@/lib/server/security'
import { CatalogError } from '@/lib/server/catalog'

export async function updatePassword(_: ActionState, form: FormData): Promise<ActionState> {
  return runAdmin(async () => {
    const user = await assertAdmin()
    const next = str(form, 'next')
    if (next !== str(form, 'confirm')) throw new CatalogError('Les deux nouveaux mots de passe ne correspondent pas.')
    const problem = changePassword(user.id, String(form.get('current') ?? ''), next)
    if (problem) throw new CatalogError(problem)
    destroyOtherSessions(user.id, await sessionToken())
  }, 'Mot de passe modifié. Les autres appareils ont été déconnectés.')
}

export async function logout() {
  await endSession()
  redirect('/admin/connexion')
}
