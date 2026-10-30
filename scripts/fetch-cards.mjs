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
        edges { characterRole node { title { romaji english } coverImage { large } } }
      }
      any: media(sort: POPULARITY_DESC, perPage: 1) {
        edges { characterRole node { title { romaji english } coverImage { large } } }
      }
    }
  }
}`;

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
  const edge = c.anime.edges[0] ?? c.any.edges[0];
  const media = edge?.node;
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
    // Indices du walkout : sexe, rôle dans l'œuvre et affiche de l'œuvre.
    gender: c.gender ?? null,
    role: edge?.characterRole ?? null,
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
