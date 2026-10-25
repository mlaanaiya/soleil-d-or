import type { Metadata } from 'next'
import { PageHero } from '@/components/site/PageHero'
import { loadSite } from '@/lib/server/public'
import styles from './legal.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()
  return { title: `Mentions légales & confidentialité — ${site.restaurant.name}`, alternates: { canonical: '/mentions-legales' } }
}

export default async function LegalPage() {
  const site = await loadSite()
  const { content, services } = site
  return (
    <>
      <PageHero eyebrow="Informations légales" title="Mentions" accent="légales" />
      <div className={`container ${styles.legal}`}>
        <section>
          <h2>Éditeur du site</h2>
          {content.legalNotice ? (
            <p className={styles.pre}>{content.legalNotice}</p>
          ) : (
            <p className="muted">Les mentions légales de l’établissement seront publiées ici prochainement.</p>
          )}
        </section>

        <section>
          <h2>Confidentialité</h2>
          <p>
            Ce site ne dépose aucun cookie publicitaire ni traceur de mesure d’audience. Le navigateur conserve
            localement, sur votre appareil uniquement, votre préférence d’affichage de la carte
            {services.ordering.enabled ? ' et le contenu de votre panier' : ''}.
          </p>
          {(services.ordering.enabled || services.reservations.enabled) && (
            <p>
              Les informations saisies dans les formulaires de {services.ordering.enabled ? 'commande' : ''}
              {services.ordering.enabled && services.reservations.enabled ? ' et de ' : ''}
              {services.reservations.enabled ? 'réservation' : ''} (nom, téléphone, e-mail facultatif, précisions)
              servent uniquement à traiter votre demande. Elles sont enregistrées sur le serveur du site et ne sont
              transmises à aucun tiers. Pour les consulter, les rectifier ou les supprimer, contactez le restaurant.
            </p>
          )}
          <p>
            Le plan d’accès de la page Contact n’est chargé depuis OpenStreetMap que si vous cliquez pour l’afficher.
            Les liens d’itinéraire et de réseaux sociaux ouvrent les services concernés, soumis à leurs propres règles.
          </p>
        </section>

        <section>
          <h2>Photographies</h2>
          <p>Les photographies présentées sur ce site sont la propriété de {site.restaurant.name}. Toute reproduction est interdite sans autorisation.</p>
        </section>
      </div>
    </>
  )
}
