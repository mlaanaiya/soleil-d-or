# Direction artistique — « L'Heure dorée »

## Concept

Le soleil est le protagoniste. Les photographies du restaurant sont toutes prises sur fond anthracite : le site les traite comme des sujets posés dans la pénombre, que la lumière vient révéler. Chaque page est une journée sous le soleil — il se lève à l'ouverture, culmine au milieu du défilement et se couche dans le pied de page.

Le site prolonge les supports physiques (affiches, menus TV, carte imprimée) : même trio **noir charbon / crème / jaune solaire**, même goût pour la typographie d'affiche.

## Palette

| Rôle           | Couleur                       | Usage                                       |
| -------------- | ----------------------------- | ------------------------------------------- |
| Noir charbon   | `#0C0B09`                     | Fond principal, chaud (jamais un noir pur)  |
| Charbon 2/3/4  | `#141210` `#1D1A16` `#2A2620` | Surfaces, cartes, champs                    |
| Crème lumineux | `#F5EDDC`                     | Texte, grands titres                        |
| Crème atténué  | `#B8AE9C`                     | Texte secondaire (contraste AA sur charbon) |
| Jaune solaire  | `#FFC21A`                     | Soleil, actions principales, prix           |
| Soleil chaud   | `#FFB000`                     | Dégradés du disque solaire                  |
| Or             | `#C9A14A`                     | Accents discrets                            |
| Braise         | `#E8572A`                     | Crépuscule, état « fermé »                  |

Les couleurs naturelles des aliments font le reste : aucune autre couleur d'interface.

## Typographie

- **Archivo (variable, axes largeur + graisse)** — en version ultra-condensée (`font-stretch: 62%`, graisse 800, capitales) pour les titres monumentaux d'affiche ; en largeur normale pour le texte courant.
- **Instrument Serif italique** — la voix éditoriale : « d'Or », accroches, légendes. Elle apporte la chaleur et le contraste avec le condensé.

Échelle fluide (`clamp`) de `--t-mega` (le mot SOLEIL, jusqu'à 26 rem) à `--t-micro` (surtitres espacés).

## Les trois interactions signature

1. **La Lumière** — le pointeur est un soleil. Sur l'ouverture, un faisceau suit la souris et rallume le produit, masqué à sa silhouette exacte (le détourage sert de masque). Sur les grandes photos, l'image repose dans l'ombre et le pointeur la ramène en pleine lumière. Sur mobile, un toucher déplace le soleil.
2. **Lever de soleil** — chaque changement de page : un soleil se lève sur une ligne d'horizon, emplit l'écran du jaune de la marque, puis la lumière se retire vers le haut pour dévoiler la nouvelle page.
3. **La Course du soleil** — la progression du défilement est dessinée comme la course du soleil dans le ciel (petit arc en marge, avec une heure symbolique de 06:00 à 21:30). La lumière ambiante de la page suit cette course : aube, zénith, crépuscule jusqu'au coucher de soleil derrière le logotype géant du pied de page.

Gestes secondaires, chacun réservé à une section : texte qui « prend le soleil » mot à mot (manifeste), défilement horizontal épinglé (sélection), disque photo suiveur (index des catégories), photo qui s'ouvre d'un disque solaire au plein cadre (crousty riz & bowls), parallaxe différenciée (galerie), gros plans qui zooment (restaurant), éclipse (fiche produit, 404).

## Principes de mouvement

- Courbes `expo`/`ease-out` longues, jamais de rebond.
- Uniquement `transform`, `opacity`, `clip-path` et masques ; aucune animation de mise en page.
- Ouverture en CSS pur : elle démarre au premier rendu, sans attendre le JavaScript.
- `prefers-reduced-motion` : défilement natif, pas de transition de page, révélations instantanées, rotation automatique coupée.
- Mobile : défilement natif (pas de lissage), dérives ambiantes composées par le GPU et suspendues hors écran.

## Composants clés

`Hero`, `Manifesto`, `FeaturedRail`, `ProductTile`, `CategoryIndex`, `Spotlight`, `GalleryTeaser`, `VisitBlock`, `FinalCta`, `MenuBoard` (carte), `ProductStage` (éclipse), `GalleryWall` (visionneuse), `SunlitPicture`, `PageHero`, `Header` / `MobileMenu` / `MobileDock`, `Footer` / `Sunset`.

## Mobile

Pensé pour le pouce : dock d'actions flottant (Carte, Appeler, Y aller, Commander), menu plein écran dont le soleil se lève sous les actions, carte en vignettes compactes avec prix immédiatement lisibles, bascule « Liste rapide », panier en panneau inférieur, cibles tactiles ≥ 44 px.
