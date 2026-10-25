# Guide d'administration — Soleil d'Or

Ce guide s'adresse à la personne qui gère le restaurant. Aucune connaissance technique n'est nécessaire.

**Adresse de l'administration :** `https://votre-site/admin`

Chaque modification est visible sur le site **dès que vous cliquez sur « Enregistrer »**. Rien n'est publié automatiquement à votre place : tant qu'une information n'est pas renseignée (adresse, prix, horaires…), le site affiche un message neutre (« communiqué très prochainement ») et jamais une information inventée.

---

## 1. Se connecter

1. Ouvrez `/admin` et saisissez votre identifiant et votre mot de passe.
2. Après 5 essais incorrects, la connexion est bloquée 15 minutes (protection contre le piratage).
3. La session dure 7 jours sur un appareil. « Se déconnecter » est en bas du menu.

> Première connexion : changez immédiatement le mot de passe initial dans **Mon compte**.

## 2. Le tableau de bord

Il affiche la liste **« Mise en route »** : ce qu'il reste à renseigner avant d'annoncer le site (adresse, position sur la carte, téléphone, horaires, prix, mentions légales, services). Cliquez sur une ligne pour aller directement au bon écran.

## 3. Modifier les prix (le plus fréquent)

Menu **Produits & prix**.

- Chaque produit a une ligne. Tapez le prix (ex. `8,50`) puis cliquez **« Enregistrer le prix »** (ou appuyez sur Entrée).
- **Plusieurs formules** (ex. « Seul » et « Menu ») : cliquez **« + Formule »**, donnez un libellé à chaque prix.
- Laissez vide si le prix n'est pas encore fixé : le site affiche « Prix sur place ».
- Le filtre **« Seulement les produits sans prix »** aide à tout compléter rapidement.

## 4. Rupture de stock, mise en avant, ordre

Toujours dans **Produits & prix** :

- **Disponible / Indisponible** : un clic. Un produit indisponible reste visible, marqué « Indisponible », et ne peut pas être commandé en ligne.
- **★ À la une** : le produit apparaît dans « Les incontournables » de l'accueil.
- **↑ ↓** : changent l'ordre d'affichage dans la catégorie.

## 5. Ajouter ou modifier un produit

**Produits & prix → + Nouveau produit**, ou cliquez sur le nom d'un produit.

- **Nom, catégorie, description, prix.**
- **Photo** : « Envoyer une image » (JPEG, PNG, WebP). Les photos très lourdes sont réduites automatiquement avant l'envoi ; le site crée ensuite toutes les tailles optimisées.
- **Détourage** (facultatif) : image PNG sans fond. Elle sert aux mises en scène sur fond de soleil (ouverture de l'accueil, fiche produit).
- **Badge** (facultatif) : un mot comme « Nouveau ». Laissez vide pour aucun badge.
- **Visible sur le site** : décochez pour masquer complètement un produit sans le supprimer.
- **Composition, allergènes** : affichés sur la fiche produit.

## 6. Catégories

Menu **Catégories** : renommer, changer l'accroche, la photo de couverture, l'ordre (↑ ↓), masquer. Une catégorie ne peut être supprimée que si elle est vide.

## 7. Photos & galerie

Menu **Photos & galerie** :

- Glissez-déposez plusieurs photos d'un coup.
- **Description** : décrivez la photo en quelques mots (utile pour les personnes malvoyantes et pour Google).
- **Dans la galerie** : la photo apparaît sur la page Galerie et sur l'accueil ; l'ordre se règle en haut de la page (← →).
- Une photo utilisée par un produit ne peut pas être supprimée (remplacez-la d'abord).

## 8. Horaires

Menu **Horaires** :

- Pour chaque jour : **« Ouvrir ce jour »**, puis l'heure d'ouverture et de fermeture. Deux services possibles (midi et soir).
- Fermeture après minuit acceptée (ex. `18:00` à `01:00`).
- **« Copier le lundi sur toute la semaine »** pour aller vite.
- **Jours exceptionnels** : fériés, congés, horaires spéciaux. Un jour sans créneau = fermé ce jour-là.

Les horaires alimentent l'indicateur **Ouvert / Fermé** du site, la page Contact, Google et les créneaux de commande.

## 9. Informations & services

- **Coordonnées** : adresse, téléphone, e-mail. Le bouton **« Trouver depuis l'adresse »** remplit la latitude/longitude (vérifiez puis enregistrez) : elles activent le plan d'accès et les boutons d'itinéraire.
- **Réseaux sociaux** : collez l'adresse complète de vos pages (`https://…`).
- **Services** : cochez uniquement ce qui est réellement proposé (sur place, à emporter, livraison).
- **Plateformes de livraison** : ajoutez vos liens Uber Eats, Deliveroo… Ils apparaissent sur la page « Commander ».

## 10. Commande en ligne (click & collect) — facultatif

Activez-la dans **Informations & services**. Les clients choisissent leurs produits et une heure de retrait, et **paient au retrait**.

Pendant le service, gardez la page **Commandes** ouverte (tablette ou ordinateur au comptoir) :

- Elle s'actualise toute seule toutes les 15 secondes. Cochez **« Alerte sonore »** pour être prévenu.
- Chaque commande passe par : **Accepter → Marquer prête → Retirée** (ou **Annuler**).
- Le client suit l'avancement sur sa page de suivi, qui se met à jour seule.

Seuls les produits **disponibles** et **avec un prix** sont commandables, et uniquement pendant les heures d'ouverture.

## 11. Réservation de table — facultatif

Activez-la dans **Informations & services** (nombre maximum de convives, intervalle, délai minimum, jours à l'avance). Les demandes arrivent dans **Réservations** : **Confirmer**, **Refuser** ou **Annuler**. Le client voit la réponse sur sa page de suivi. Appelez le client si besoin : son téléphone est cliquable.

## 12. Textes du site

Menu **Textes du site** : accroche de l'accueil, choix des produits de l'ouverture (ceux qui ont un détourage), textes des sections, chapitres de la page « Notre restaurant », description pour Google et **mentions légales** (obligatoires : raison sociale, forme juridique, adresse du siège, SIRET, responsable de la publication, hébergeur).

> Restez factuel : n'écrivez que des informations vérifiées (pas de date de création ou d'histoire non confirmées).

## 13. Données personnelles

Dans **Commandes → Archives** et **Réservations → Passées**, le bouton **« Supprimer les données de plus de 90 jours »** efface les anciennes commandes et réservations (bonne pratique RGPD).

## 14. Mot de passe oublié

La personne qui gère l'hébergement peut le réinitialiser depuis un ordinateur ayant le code du site, en pointant vers la base de production :

```bash
DATABASE_URL='…' npm run admin:create -- votre-identifiant
```

(le nouveau mot de passe est demandé sans être affiché).
