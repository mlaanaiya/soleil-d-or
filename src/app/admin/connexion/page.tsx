import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/server/auth'
import { countUsers } from '@/lib/server/security'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Connexion — Administration', robots: { index: false, follow: false } }

export default async function LoginPage(props: PageProps<'/admin/connexion'>) {
  if (await currentUser()) redirect('/admin')
  const { suite } = await props.searchParams
  const noAccount = countUsers() === 0
  return (
    <main className="adm-login">
      <div className="adm-login-card">
        <p className="adm-login-brand">
          Soleil <span>d’Or</span>
        </p>
        <h1>Administration</h1>
        {noAccount ? (
          <p className="adm-alert">
            Aucun compte n’existe encore. Créez-le sur le serveur avec{' '}
            <code>npm run admin:create -- votre-identifiant</code> ou définissez <code>ADMIN_USERNAME</code> et{' '}
            <code>ADMIN_PASSWORD</code> puis redémarrez.
          </p>
        ) : (
          <LoginForm next={typeof suite === 'string' ? suite : '/admin'} />
        )}
      </div>
    </main>
  )
}
