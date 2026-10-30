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
      anime: media(type: ANIME, sort: POPULARITY_DESC, perPage: 1) {
        nodes { title { romaji english } }
      }
      any: media(sort: POPULARITY_DESC, perPage: 1) {
        nodes { title { romaji english } }
      }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 60);
      console.log(`  rate limit, pause ${wait}s…`);
      await sleep(wait * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`AniList ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data.Page.characters;
  }
  throw new Error("AniList : trop de tentatives");
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
