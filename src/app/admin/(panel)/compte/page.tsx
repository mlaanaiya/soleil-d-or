import type { Metadata } from 'next'
import { PasswordForm } from '@/components/admin/PasswordForm'
import { requireUser } from '@/lib/server/auth'

export const metadata: Metadata = { title: 'Mon compte' }

export default async function AccountAdmin() {
  const user = await requireUser()
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Mon compte</h1>
          <p className="adm-sub">Connecté en tant que « {user.username} ».</p>
        </div>
      </header>
      <PasswordForm />
    </>
  )
}
