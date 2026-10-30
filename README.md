# Registre

Jeu de collection de cartes de personnages d'anime. On ouvre des dossiers scellés de 5 fiches et on complète le registre.

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

## Le concept

Chaque personnage a sa fiche d'archive. Sa **classe** dépend de sa popularité sur AniList (nombre de favoris) :

| Classe | Nom          | Rendu de la fiche            | Taux / fiche | Fiches |
| ------ | ------------ | ---------------------------- | ------------ | ------ |
| A      | Mythique     | fiche vert acide, reflet     | 1 %          | 12     |
| B      | Exceptionnel | fiche inversée (noire)       | 5 %          | 28     |
| C      | Rare         | photo en couleur             | 12 %         | 60     |
| D      | Notable      | noir et blanc contrasté      | 27 %         | 80     |
| E      | Courant      | papier gris, photo désaturée | 55 %         | 120    |

- La 5ᵉ fiche d'un dossier est toujours classe D ou mieux.
- À l'ouverture, les fiches sont masquées : on clique pour les « déclassifier » (scan de haut en bas). Une fiche B a un liseré blanc, une A pulse en vert avant d'être révélée.
- 15 dossiers maximum en stock, +1 toutes les 3 minutes.
- L'archive montre les 300 fiches, en grille ou en liste, avec filtres par classe et par série.
- La sauvegarde est locale au navigateur (`localStorage`), pas encore de compte.

## Identité visuelle

Archive / éditorial suisse : fond blanc cassé, noir, **une seule couleur d'accent** (vert acide `#C8FF00`, réservé à la classe A et aux interactions). Typo Archivo (largeur variable, condensée pour les noms et les chiffres) et IBM Plex Mono pour les données. Tous les jetons sont en haut de `src/styles.css`.

## Scripts

| Commande         | Rôle                                             |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | serveur de développement                         |
| `npm run build`  | vérification des types puis build de production  |
| `npm run check`  | types + lint + format (à lancer avant un commit) |
| `npm run lint`   | ESLint                                           |
| `npm run format` | Prettier                                         |
| `npm run cards`  | régénère `src/data/cards.json` depuis AniList    |

## Structure

```
scripts/fetch-cards.mjs   génération des fiches depuis l'API GraphQL d'AniList
src/data/cards.json       les 300 fiches (généré, versionné)
src/game/                 règles : classes, tirage des dossiers, sauvegarde
src/lib/                  utilitaires (formatage, code-barres)
src/components/           Header, HomePage, ArchivePage, OpeningScreen, Fiche, Dossier…
src/styles.css            toute l'identité visuelle
```

## Branches

- `main` : version stable
- `dev` : intégration
- `prototype` : prototype en cours (créée depuis `dev`), fusionnée dans `dev` par pull request
