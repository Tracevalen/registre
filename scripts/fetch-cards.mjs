// Génère src/data/cards.json à partir de l'API GraphQL d'AniList.
// Les personnages sont triés par nombre de favoris : plus un personnage est
// aimé, plus sa classe est haute (A = la plus rare, E = la plus courante).
//
//   npm run cards

import { writeFile, mkdir } from "node:fs/promises";

const PAGES = 20; // 20 × 50 = 1000 cartes
const PER_PAGE = 50;

// Répartition des classes selon le rang de popularité (doit totaliser PAGES × PER_PAGE).
const TIERS = [
  { rarity: "A", count: 30 },
  { rarity: "B", count: 80 },
  { rarity: "C", count: 180 },
  { rarity: "D", count: 280 },
  { rarity: "E", count: 430 },
];

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    characters(sort: FAVOURITES_DESC) {
      id
      name { full native }
      image { large }
      favourites
      siteUrl
      gender
      anime: media(type: ANIME, sort: POPULARITY_DESC, perPage: 1) {
        nodes { title { romaji english } coverImage { large } genres tags { name rank } }
      }
      any: media(sort: POPULARITY_DESC, perPage: 1) {
        nodes { title { romaji english } coverImage { large } genres tags { name rank } }
      }
    }
  }
}`;

// Style de l'œuvre, montré pendant la révélation : public visé (shōnen, shōjo…)
// puis un thème marquant (isekai, mecha…) ou, à défaut, le genre le plus parlant.
const DEMOGRAPHIC = {
  Shounen: "Shōnen",
  Shoujo: "Shōjo",
  Seinen: "Seinen",
  Josei: "Josei",
  Kids: "Jeunesse",
};
// Thèmes par ordre de priorité, retenus seulement s'ils sont centraux (rang AniList ≥ 60).
const THEMES = [
  ["Isekai", "Isekai"],
  ["Mahou Shoujo", "Magical girl"],
  ["Real Robot", "Mecha"],
  ["Super Robot", "Mecha"],
  ["Idol", "Idol"],
  ["Battle Royale", "Battle royale"],
  ["Cyberpunk", "Cyberpunk"],
  ["Vampire", "Vampires"],
  ["Ninja", "Ninja"],
  ["Samurai", "Samouraï"],
  ["Post-Apocalyptic", "Post-apocalyptique"],
];
// Genres du plus distinctif au plus courant.
const GENRES = [
  ["Sports", "Sport"],
  ["Mecha", "Mecha"],
  ["Mahou Shoujo", "Magical girl"],
  ["Music", "Musique"],
  ["Horror", "Horreur"],
  ["Mystery", "Mystère"],
  ["Psychological", "Psychologique"],
  ["Sci-Fi", "Science-fiction"],
  ["Action", "Action"],
  ["Adventure", "Aventure"],
  ["Fantasy", "Fantasy"],
  ["Supernatural", "Surnaturel"],
  ["Romance", "Romance"],
  ["Slice of Life", "Tranche de vie"],
  ["Thriller", "Thriller"],
  ["Drama", "Drame"],
  ["Comedy", "Comédie"],
];

function styleOf(media) {
  if (!media) return null;
  const rank = Object.fromEntries((media.tags ?? []).map((t) => [t.name, t.rank]));
  const demo = Object.keys(DEMOGRAPHIC)
    .filter((k) => rank[k] >= 50)
    .sort((a, b) => rank[b] - rank[a])
    .map((k) => DEMOGRAPHIC[k])[0];
  const genres = media.genres ?? [];
  const theme = THEMES.find(([k]) => rank[k] >= 60)?.[1] ?? GENRES.find(([k]) => genres.includes(k))?.[1];
  const parts = [...new Set([demo, theme].filter(Boolean))];
  return parts.length ? parts.join(" · ") : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
        // Une requête qui ne répond pas en 20 s est abandonnée.
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 429) {
        const wait = Math.min(Number(res.headers.get("retry-after") ?? 30), 30);
        console.log(`  rate limit, pause ${wait}s…`);
        await sleep(wait * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`AniList ${res.status}`);
      const json = await res.json();
      return json.data.Page.characters;
    } catch (err) {
      console.log(`  page ${page}, essai ${attempt + 1} raté : ${err.message}`);
      await sleep(3000);
    }
  }
  throw new Error("AniList ne répond pas : la liste précédente est conservée");
}

const characters = [];
for (let page = 1; page <= PAGES; page++) {
  console.log(`Page ${page}/${PAGES}`);
  characters.push(...(await fetchPage(page)));
  await sleep(2500);
}

const rarities = TIERS.flatMap((t) => Array(t.count).fill(t.rarity));

const cards = characters.map((c, i) => {
  const media = c.anime.nodes[0] ?? c.any.nodes[0];
  return {
    id: c.id,
    number: i + 1,
    name: c.name.full,
    nativeName: c.name.native ?? null,
    image: c.image.large,
    anime: media ? (media.title.english ?? media.title.romaji) : "Inconnu",
    favourites: c.favourites,
    url: c.siteUrl,
    rarity: rarities[i] ?? "E",
    // Indices de la révélation : sexe, style de l'œuvre, puis l'œuvre et son affiche.
    gender: c.gender ?? null,
    style: styleOf(media),
    cover: media?.coverImage?.large ?? null,
  };
});

// Au moins une fiche Mythique (A) par série : le personnage le plus aimé de chaque
// série qui compte au moins 3 fiches passe en classe A s'il ne l'est pas déjà.
const MIN_SERIES_FOR_MYTHIC = 3;
const bySeries = new Map();
for (const card of cards) {
  const list = bySeries.get(card.anime) ?? [];
  list.push(card);
  bySeries.set(card.anime, list);
}
let promoted = 0;
for (const list of bySeries.values()) {
  if (list.length < MIN_SERIES_FOR_MYTHIC) continue;
  const top = list.reduce((a, b) => (b.favourites > a.favourites ? b : a));
  if (top.rarity !== "A") {
    top.rarity = "A";
    promoted++;
  }
}
console.log(`${promoted} fiches promues Mythiques (meilleur personnage de leur série)`);

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/cards.json", import.meta.url), JSON.stringify(cards, null, 2) + "\n");
console.log(`${cards.length} cartes écrites dans src/data/cards.json`);
