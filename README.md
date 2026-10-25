# Soleil d'Or — site officiel

Site vitrine et carte interactive du restaurant de restauration rapide **Soleil d'Or**, avec administration intégrée (produits, prix, photos, horaires, informations, textes) et, si le restaurant les active, commande à emporter et réservation de table.

- **Direction artistique** : [docs/DIRECTION-ARTISTIQUE.md](docs/DIRECTION-ARTISTIQUE.md)
- **Guide du restaurateur** : [docs/GUIDE-ADMINISTRATION.md](docs/GUIDE-ADMINISTRATION.md)
- **Rapport photos** : [docs/RAPPORT-PHOTOS.md](docs/RAPPORT-PHOTOS.md)

## Principes

- **Aucune donnée inventée.** Adresse, téléphone, horaires, prix, réseaux sociaux et mentions légales sont vides au départ ; le site affiche un message neutre tant qu'ils ne sont pas saisis dans l'administration. Les services en ligne (commande, réservation) sont **désactivés par défaut** et n'apparaissent nulle part tant qu'ils ne sont pas activés.
- **Les vraies photos du restaurant** sont la seule matière visuelle (`assets/photos`, `assets/cutouts`). Au premier démarrage, elles sont importées et optimisées automatiquement.
- **Tout est modifiable sans toucher au code** : `/admin`.

## Pile technique

| Besoin      | Choix                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| Application | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict                     |
| Données     | SQLite (`better-sqlite3`, mode WAL), schéma versionné, validation `zod`             |
| Images      | `sharp` : variantes AVIF + WebP (480 → 2400 px), placeholder flou, image de partage |
| Animations  | GSAP + ScrollTrigger, Lenis (défilement lissé sur ordinateur uniquement), CSS natif |
| Polices     | Archivo variable (largeur + graisse) et Instrument Serif, auto-hébergées            |
| Tests       | Vitest (unitaires) et Playwright (bout en bout sur le build de production)          |

Pourquoi SQLite : un restaurant, un serveur, peu d'écritures. Un seul fichier à sauvegarder, aucune base externe à administrer, des lectures en microsecondes.

## Démarrer en local

Prérequis : Node.js 22+.

```bash
npm install
cp .env.example .env.local        # puis renseignez ADMIN_PASSWORD (10 caractères minimum)
npm run dev                       # http://localhost:3000
```

Au premier lancement, la base `data/` est créée et les photos importées (≈ 40 s), puis le compte administrateur est créé à partir de `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Sans ces variables : `npm run admin:create -- identifiant`.

### Scripts

| Commande               | Rôle                                                      |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Serveur de développement                                  |
| `npm run build`        | Build de production                                       |
| `npm start`            | Serveur de production                                     |
| `npm run lint`         | ESLint                                                    |
| `npm run typecheck`    | Types des routes + TypeScript                             |
| `npm test`             | Tests unitaires (Vitest)                                  |
| `npm run test:e2e`     | Tests de bout en bout (Playwright, après `npm run build`) |
| `npm run format`       | Prettier                                                  |
| `npm run db:seed`      | Initialise la base si elle est vide                       |
| `npm run admin:create` | Crée un compte ou réinitialise un mot de passe            |

### Variables d'environnement

| Variable         | Rôle                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `SITE_URL`       | Adresse publique (SEO, sitemap, images de partage). Ex. `https://www.exemple.fr` |
| `DATA_DIR`       | Dossier persistant (base + photos). Défaut : `./data`                            |
| `ADMIN_USERNAME` | Compte créé au premier démarrage s'il n'en existe aucun                          |
| `ADMIN_PASSWORD` | Son mot de passe (à changer ensuite depuis l'administration)                     |

## Mise en production

Le site a besoin d'un serveur Node.js **avec un disque persistant** (VPS, serveur dédié, PaaS avec volume). Les plateformes sans disque persistant ne conviennent pas à SQLite.

### Avec Docker

```bash
ADMIN_PASSWORD='une-phrase-de-passe' docker compose up -d --build
```

`docker-compose.yml` publie le port 3000 sur `127.0.0.1` uniquement : placez devant un reverse proxy HTTPS (Caddy, Nginx, Traefik) qui transmet `X-Forwarded-For` et `X-Forwarded-Host`. Exemple Caddy :

```
www.exemple.fr {
  reverse_proxy 127.0.0.1:3000
}
```

### Sans Docker

```bash
npm ci && npm run build
SITE_URL=https://www.exemple.fr DATA_DIR=/var/lib/soleil-d-or npm start
```

(à lancer via systemd ou pm2, derrière un reverse proxy HTTPS).

### Sauvegardes

Tout l'état du site est dans `DATA_DIR` : `soleil-d-or.sqlite` (+ fichiers `-wal`/`-shm`) et `media/`. Sauvegarde à chaud recommandée :

```bash
sqlite3 "$DATA_DIR/soleil-d-or.sqlite" ".backup '/sauvegardes/soleil-$(date +%F).sqlite'"
rsync -a "$DATA_DIR/media/" /sauvegardes/media/
```

## Architecture

```
src/
  app/
    (site)/            pages publiques : accueil, carte, carte/[slug], restaurant, galerie,
                       contact, commander, reserver, suivis, mentions-legales, 404
    admin/             connexion + espace d'administration (groupe (panel))
    api/admin/media    envoi de photos
    media/[id]/[file]  diffusion des images optimisées (cache immuable)
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.svg, apple-icon.tsx
  components/
    motion/            Lenis/GSAP, transition « lever de soleil », course du soleil, révélations
    home/ menu/ product/ gallery/ restaurant/ contact/ order/ site/ ui/
    admin/             formulaires et tableaux de l'administration
  lib/
    schemas.ts         schémas zod (réglages, produits, formulaires) — source de vérité
    hours.ts           ouvert/fermé, créneaux de retrait et de réservation (fuseau Europe/Paris)
    server/            base, catalogue, médias, réglages, commandes, sécurité, SEO
  proxy.ts             CSP avec nonce + garde de l'administration
assets/                photos et détourages d'origine, polices des images de partage (OFL)
tests/                 unit/ (Vitest) et e2e/ (Playwright)
```

Le schéma de base est migré automatiquement au démarrage (`PRAGMA user_version`) : ajoutez une migration à la fin de la liste dans `src/lib/server/db.ts`, ne modifiez jamais une migration publiée.

## Sécurité

- Mots de passe hachés avec **scrypt**, sessions opaques (jeton aléatoire, seul son SHA-256 est stocké), cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, 7 jours.
- Limitation des tentatives de connexion (par IP et identifiant), des commandes et des réservations ; champ piège anti-robots.
- Chaque page et action d'administration revérifie la session côté serveur ; contrôle d'origine sur les server actions (Next.js) et sur l'envoi de photos.
- CSP stricte avec nonce par requête, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy` ; `/admin` en `noindex`.
- Images : le format est déterminé par décodage (jamais par l'extension), métadonnées EXIF/GPS supprimées, taille et dimensions bornées.
- Prix et créneaux toujours recalculés côté serveur ; suivi de commande accessible uniquement avec la référence **et** un jeton secret.

## Qualité vérifiée

- 44 tests unitaires (horaires, prix, schémas, commandes, réservations, sécurité, catalogue).
- 20 tests de bout en bout sur le build de production, ordinateur et mobile : navigation et transitions, carte (recherche, liste rapide), galerie au clavier, 404, mouvements réduits, en-têtes de sécurité, routes protégées, connexion, modification des prix et disponibilités, création de produit avec photo, horaires et coordonnées, commande et réservation complètes côté client et côté restaurateur, absence de débordement horizontal.
- Lighthouse (build de production) : **99–100** sur ordinateur dans les quatre catégories ; sur mobile, accessibilité, bonnes pratiques et SEO à **100**, performance 88–93 sur les pages intérieures et ~82 sur l'accueil (ouverture animée, premier affichage réel ≈ 0,25 s).
