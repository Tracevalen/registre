# Registre

Jeu gratuit de collection de cartes de jeux vidéo. Deux sortes de cartes : les **jeux** eux-mêmes (les licences) et leurs **personnages**, Professeur Layton compris. On ouvre des boosters de 5 cartes, on complète sa collection, ses albums par saga et ses duos et trios.

Aucun avantage payant : tout le monde a les mêmes boosters, le même stock (15 au maximum) et les mêmes taux.

## Raretés

Calculées selon la popularité : le nombre de Wikipédias (langues) qui ont un article sur la carte.

| Rareté      | Lettre |
| ----------- | ------ |
| Iridescente | A      |
| Légendaire  | B      |
| Épique      | C      |
| Rare        | D      |
| Commune     | E      |

Au-dessus : les cartes Duo et Trio, obtenues uniquement par fusion.

## Données

Les cartes viennent de Wikidata et Wikipédia : aucune clé ni aucun compte n'est nécessaire. La liste est enregistrée dans `src/data/cards.json`. Pour la mettre à jour, lance `npm run cards` sur ton ordinateur, puis push.

Les licences maison de Nintendo et de Pokémon sont exclues. Professeur Layton (Level-5) est toujours inclus.

## Commandes

| Commande        | Effet                                           |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | lance le site en local                          |
| `npm run build` | construit le site dans `dist/`                  |
| `npm run cards` | régénère `src/data/cards.json` depuis Wikipédia |
