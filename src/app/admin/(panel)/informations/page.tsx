import type { Metadata } from 'next'
import { RestaurantForm, ServicesForm } from '@/components/admin/RestaurantForms'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Informations & services' }

export default async function InfoAdmin() {
  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1 className="adm-title">Informations & services</h1>
          <p className="adm-sub">Tant qu’un champ est vide, le site affiche un message neutre à sa place.</p>
        </div>
      </header>
      <RestaurantForm initial={getSetting('restaurant')} />
      <div style={{ height: 18 }} />
      <ServicesForm initial={getSetting('services')} />
    </>
  )
}
