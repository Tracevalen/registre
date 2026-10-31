# Registre

Jeu gratuit de collection de cartes de jeux vidéo. Deux sortes de cartes : les **jeux** eux-mêmes (les licences) et leurs **personnages**, Professeur Layton compris. On ouvre des boosters de 5 cartes, on complète sa collection, ses albums par saga et ses duos et trios.

Aucun avantage payant : tout le monde a les mêmes boosters, le même stock (15 au maximum) et les mêmes taux.

## Raretés

Calculées selon la popularité du jeu sur IGDB (nombre de votes) :

| Rareté      | Lettre |
| ----------- | ------ |
| Iridescente | A      |
| Légendaire  | B      |
| Épique      | C      |
| Rare        | D      |
| Commune     | E      |

Au-dessus : les cartes Duo et Trio, obtenues uniquement par fusion.

## Données

Les cartes viennent d'IGDB (la base de jeux vidéo de Twitch). Le déploiement les télécharge à chaque push, avec deux secrets à créer dans GitHub (Settings → Secrets and variables → Actions) :

- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

Les clés se créent gratuitement sur https://dev.twitch.tv/console (Register Your Application). Sans ces secrets, le déploiement s'arrête et l'ancienne version du site reste en ligne.

Les licences maison de Nintendo et de Pokémon sont exclues. Professeur Layton (Level-5) est toujours inclus.

## Commandes

| Commande        | Effet                                                      |
| --------------- | ---------------------------------------------------------- |
| `npm run dev`   | lance le site en local                                     |
| `npm run build` | construit le site dans `dist/`                             |
| `npm run cards` | régénère `src/data/cards.json` depuis IGDB (clés requises) |
