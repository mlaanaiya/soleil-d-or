# Rapport photos — Soleil d'Or

Audit des 21 images fournies (deux archives ZIP). Elles constituent la seule matière visuelle du site : aucune photo générique ni générée n'a été ajoutée.

## Synthèse

| Point      | Constat                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Format     | 21 PNG, toutes en **1536 × 1024 px** (paysage 3:2), sans transparence                                                                                                    |
| Cohérence  | Excellente : même fond anthracite, même lumière chaude latérale, même angle (¾ plongée). C'est ce qui a permis la direction « charbon + soleil ».                        |
| Exposition | Aucune zone brûlée (< 0,3 % de pixels saturés) ; noirs légèrement bouchés sur le crousty riz (10 % de pixels très sombres, sans gêne : le fond est volontairement noir). |
| Netteté    | Correcte pour le web jusqu'à ~1500 px de large. En plein écran sur grand écran Retina, légère douceur visible.                                                           |
| Détourages | 11 détourages automatiques de bonne qualité (sauce, laitue et sésame préservés). 6 photos d'assiettes écartées : le bord blanc de l'assiette était partiellement rogné.  |
| Manques    | Aucune photo de **boissons**, aucune photo du **restaurant** (façade, salle, comptoir, équipe), aucun **logo** officiel.                                                 |

## Détail par image

Netteté mesurée par variance du laplacien (plus c'est haut, plus c'est net ; au-dessus de ~400, très bon pour le web).

| Fichier d'origine                                       | Produit sur le site   | Catégorie       | Netteté | Détourage | Remarque                                                                                      |
| ------------------------------------------------------- | --------------------- | --------------- | ------: | :-------: | --------------------------------------------------------------------------------------------- |
| Double cheeseburger gourmand sur fond sombre-4          | Double cheeseburger   | Burgers         |     476 |     ✓     | Image phare : ouverture de l'accueil, image de partage                                        |
| Sandwich naan kebab gourmand-1                          | Naan kebab            | Sandwichs       |     666 |     ✓     | Très belle, nette                                                                             |
| Kebab français au pain turc grillé-2                    | Kebab pain turc       | Sandwichs       |     451 |     ✓     |                                                                                               |
| Panini grillé au poulet et fromage                      | Panini poulet fromage | Sandwichs       |     452 |     ✓     |                                                                                               |
| Tacos français grillé au poulet et frites-3             | Tacos poulet          | Tacos           |     321 |     ✓     | **La moins nette du lot** : textures lissées, acceptable en vignette                          |
| Crousty riz au poulet croustillant-1                    | Crousty riz poulet    | Crousty riz     |     392 |     ✓     | Noirs très denses                                                                             |
| Bowl gourmand de frites, kebab et poulet croustillant-3 | Bowl gourmand         | Bowls           |     422 |     ✓     |                                                                                               |
| Salade de thon fraîche aux légumes-2                    | Salade de thon        | Bowls           |     511 |     ✓     | Classée dans « Bowls » (pas de catégorie Salades demandée) — à valider                        |
| Frites dorées en barquette noire-2                      | Frites                | Accompagnements |     354 |     ✓     | Un peu douce                                                                                  |
| Naans grillés sur fond anthracite-6                     | Naans grillés         | Accompagnements |     386 |     ✓     | Utilisée aussi en gros plan (« Le grillé ») et dans le sceau tournant de l'accueil            |
| Barquette noire de kebab rôti-4                         | Barquette kebab       | Accompagnements |     894 |     ✓     | Très nette. Classée en « Accompagnements » — à valider                                        |
| Assiette grillée, frites et salade fraîche-1            | Assiette grillée      | Assiettes       |     911 |     —     | La plus nette du lot                                                                          |
| Cordon bleu, frites et salade-2                         | Cordon bleu           | Assiettes       |     722 |     —     |                                                                                               |
| Tenders croustillants, frites et salade-1               | Tenders               | Assiettes       |     428 |     —     |                                                                                               |
| Nuggets croustillants, frites et salade fraîche-1       | Nuggets               | Assiettes       |     559 |     —     | Les pièces ressemblent à des escalopes panées : vérifier que l'intitulé correspond au produit |
| Ailes de poulet, frites et salade-4                     | Ailes de poulet       | Assiettes       |     721 |     —     |                                                                                               |
| Poulet grillé, frites et salade-3                       | Poulet grillé         | Assiettes       |     559 |     —     |                                                                                               |
| Steaks grillés, frites et salade-5                      | Steaks grillés        | Assiettes       |     562 |     —     |                                                                                               |
| Koftas grillés, frites et salade-2                      | Koftas                | Assiettes       |     666 |     —     |                                                                                               |
| Merguez grillées, frites et salade-5                    | Merguez               | Assiettes       |     458 |     —     |                                                                                               |
| Falafels dorés, frites et salade fraîche-3              | Falafels              | Assiettes       |     457 |     —     |                                                                                               |

## Points d'attention

1. **Résolution limitée (1536 px)** — suffisante aujourd'hui, mais les sections plein écran gagneraient en finesse avec des originaux d'au moins **2400 px** de large. L'administration accepte les photos lourdes (réduites automatiquement à 2400 px avant l'envoi) et génère toutes les tailles : il suffit de remplacer la photo dans la fiche produit.
2. **Compositions répétitives** — les dix photos d'assiettes partagent exactement le même cadrage (assiette blanche, frites à droite, salade en haut). Le site compense par la mise en page (vignettes, gros plans, recadrages), mais une série de **gros plans** et de **photos d'ambiance** enrichirait nettement la galerie et la page « Notre restaurant ».
3. **Textures très lissées** — certaines images (tacos, frites, laitue) présentent un rendu très retouché. Assurez-vous que chaque visuel représente fidèlement le produit réellement servi (portion, garniture) : c'est une exigence d'information du consommateur.
4. **Intitulés et descriptions** — les noms des produits et les courtes descriptions sur le site sont repris **mot pour mot des titres de fichiers** fournis (ex. « Frites dorées en barquette noire » → « Frites dorées en barquette. »). Aucun ingrédient n'a été ajouté. À relire dans l'administration.
5. **Prix** — aucun prix n'a été inventé : tous les produits affichent « Prix sur place » tant qu'un prix n'est pas saisi.

## À fournir pour aller plus loin

- Photos des **boissons** (la catégorie existe déjà, affichée avec un message neutre).
- Photos du **lieu** : façade (utile aussi pour Google), salle, comptoir, cuisine en action.
- Le **logo officiel** en SVG : le site utilise pour l'instant un logotype typographique (« SOLEIL D'OR » + soleil levant) conçu pour s'accorder à la charte noir/crème/jaune. Il se remplace en un seul composant (`src/components/site/Logo.tsx`).
- Des originaux en **haute définition** (≥ 2400 px).
