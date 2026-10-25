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
| Données     | PostgreSQL : Supabase en production, PGlite (embarqué) en local, validation `zod`   |
| Images      | `sharp` : variantes AVIF + WebP (480 → 2400 px) stockées en base, image de partage  |
| Animations  | GSAP + ScrollTrigger, Lenis (défilement lissé sur ordinateur uniquement), CSS natif |
| Polices     | Archivo variable (largeur + graisse) et Instrument Serif, auto-hébergées            |
| Hébergement | Vercel (région Paris `cdg1`) + Supabase (base `eu-west-3`, Paris)                   |
| Tests       | Vitest (unitaires) et Playwright (bout en bout sur le build de production)          |

Le même SQL PostgreSQL tourne partout : avec `DATABASE_URL`, le site se connecte à Supabase (pilote `postgres`, pooler en mode transaction) ; sans, il utilise PGlite, un PostgreSQL embarqué stocké dans `DATA_DIR` — aucune base à installer pour développer. Les photos optimisées sont stockées en base et servies avec un cache d'un an : le CDN de Vercel les sert ensuite sans toucher la base.

## Démarrer en local

Prérequis : Node.js 22+.

```bash
npm install
cp .env.example .env.local        # puis renseignez ADMIN_PASSWORD (10 caractères minimum)
npm run dev                       # http://localhost:3000
```

Au premier lancement, la base embarquée `data/pglite` est créée et les photos importées (≈ 40 s), puis le compte administrateur est créé à partir de `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Sans ces variables : `npm run admin:create -- identifiant`.

### Scripts

| Commande               | Rôle                                                      |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Serveur de développement                                  |
| `npm run build`        | Build de production                                       |
| `npm run vercel-build` | Prépare la base (migrations, photos, admin) puis build    |
| `npm start`            | Serveur de production                                     |
| `npm run lint`         | ESLint                                                    |
| `npm run typecheck`    | Types des routes + TypeScript                             |
| `npm test`             | Tests unitaires (Vitest)                                  |
| `npm run test:e2e`     | Tests de bout en bout (Playwright, après `npm run build`) |
| `npm run format`       | Prettier                                                  |
| `npm run db:seed`      | Migre la base et l'initialise si elle est vide            |
| `npm run admin:create` | Crée un compte ou réinitialise un mot de passe            |

### Variables d'environnement

| Variable         | Rôle                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `SITE_URL`       | Adresse publique (SEO, sitemap, images de partage). Ex. `https://www.exemple.fr` |
| `DATABASE_URL`   | PostgreSQL (Supabase). Vide : base embarquée PGlite dans `DATA_DIR`              |
| `DATA_DIR`       | Dossier de la base embarquée. Défaut : `./data`                                  |
| `ADMIN_USERNAME` | Compte créé au premier démarrage s'il n'en existe aucun                          |
| `ADMIN_PASSWORD` | Son mot de passe (à changer ensuite depuis l'administration)                     |

## Mise en production

### Vercel + Supabase (configuration actuelle)

- **Base** : projet Supabase `soleil-d-or` (région `eu-west-3`, Paris). L'application se connecte avec un rôle dédié `soleil_app`, propriétaire d'un schéma privé `app` que l'API publique de Supabase n'expose pas ; la sécurité au niveau des lignes (RLS) est activée sur toutes les tables.
- **Site** : projet Vercel relié au dépôt GitHub, fonctions en région `cdg1` (`vercel.json`). Chaque déploiement lance `npm run vercel-build` : migrations, import des photos si la base est vide, création du compte administrateur s'il n'en existe aucun, puis `next build`.
- **Variables Vercel** : `DATABASE_URL` (pooler Supabase, port 6543 : `postgres://soleil_app.<ref>:<mot de passe>@aws-…-eu-west-3.pooler.supabase.com:6543/postgres`), `SITE_URL` (adresse publique, à mettre à jour avec le nom de domaine définitif).
- **Envoi de photos** : Vercel limite une requête à 4,5 Mo ; l'administration réduit donc les photos plus lourdes dans le navigateur (2400 px maximum) avant de les envoyer, une par une.

Pour un nom de domaine : Vercel → projet → Settings → Domains, puis mettez `SITE_URL` à jour et redéployez.

### Sur un serveur (Docker)

```bash
ADMIN_PASSWORD='une-phrase-de-passe' docker compose up -d --build
```

Sans `DATABASE_URL`, la base embarquée est conservée dans le volume `/data`. Avec `DATABASE_URL`, n'importe quel PostgreSQL 15+ convient. `docker-compose.yml` publie le port 3000 sur `127.0.0.1` uniquement : placez devant un reverse proxy HTTPS (Caddy, Nginx, Traefik) qui transmet `X-Forwarded-For` et `X-Forwarded-Host`.

### Sauvegardes

Supabase sauvegarde la base quotidiennement (offre gratuite : 7 jours de rétention, restauration depuis le tableau de bord). Pour une copie complète (photos comprises, elles sont dans la base) :

```bash
pg_dump "postgres://soleil_app.<ref>:<mot de passe>@aws-…-eu-west-3.pooler.supabase.com:5432/postgres" \
  --schema=app --format=custom --file="soleil-$(date +%F).dump"
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

Le schéma est migré automatiquement (table `schema_migrations`, sous verrou consultatif pour les démarrages simultanés) : ajoutez une migration à la fin de la liste dans `src/lib/server/db.ts`, ne modifiez jamais une migration publiée.

## Sécurité

- Mots de passe hachés avec **scrypt**, sessions opaques (jeton aléatoire, seul son SHA-256 est stocké), cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, 7 jours.
- Limitation des tentatives de connexion (par IP et identifiant), des commandes et des réservations ; champ piège anti-robots.
- Chaque page et action d'administration revérifie la session côté serveur ; contrôle d'origine sur les server actions (Next.js) et sur l'envoi de photos.
- CSP stricte avec nonce par requête, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy` ; `/admin` en `noindex`.
- Images : le format est déterminé par décodage (jamais par l'extension), métadonnées EXIF/GPS supprimées, taille et dimensions bornées.
- Prix et créneaux toujours recalculés côté serveur ; suivi de commande accessible uniquement avec la référence **et** un jeton secret.

## Qualité vérifiée

- 44 tests unitaires (sur PostgreSQL embarqué) (horaires, prix, schémas, commandes, réservations, sécurité, catalogue).
- 20 tests de bout en bout sur le build de production, ordinateur et mobile : navigation et transitions, carte (recherche, liste rapide), galerie au clavier, 404, mouvements réduits, en-têtes de sécurité, routes protégées, connexion, modification des prix et disponibilités, création de produit avec photo, horaires et coordonnées, commande et réservation complètes côté client et côté restaurateur, absence de débordement horizontal.
- Lighthouse (build de production) : **99–100** sur ordinateur dans les quatre catégories ; sur mobile, accessibilité, bonnes pratiques et SEO à **100**, performance 88–93 sur les pages intérieures et ~82 sur l'accueil (ouverture animée, premier affichage réel ≈ 0,25 s).
