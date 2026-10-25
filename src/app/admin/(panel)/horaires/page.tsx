import type { Metadata } from 'next'
import { HoursEditor } from '@/components/admin/HoursEditor'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Horaires' }

export default async function HoursAdmin() {
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Horaires</h1>
          <p className="adm-sub">
            Ils alimentent l’état « Ouvert / Fermé » du site, la page Contact, les données Google et les créneaux de
            commande.
          </p>
        </div>
      </header>
      <HoursEditor initial={await getSetting('hours')} />
    </>
  )
}
