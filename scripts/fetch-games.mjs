// Génère src/data/cards.json à partir d'IGDB (la base de jeux vidéo de Twitch).
// Deux sortes de cartes :
//   - les jeux : les 1000 jeux les plus populaires (carte = jaquette du jeu) ;
//   - les personnages : 1000 personnages des jeux les plus populaires.
// Les licences maison de Nintendo et Pokémon sont exclues (ces éditeurs font retirer les
// projets de fans). Un jeu seulement édité par Nintendo reste, comme Professeur Layton.
//
//   IGDB_CLIENT_ID=… IGDB_CLIENT_SECRET=… npm run cards

import { mkdir, writeFile } from "node:fs/promises";

const { IGDB_CLIENT_ID: CLIENT_ID, IGDB_CLIENT_SECRET: CLIENT_SECRET } = process.env;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Clés IGDB absentes (IGDB_CLIENT_ID et IGDB_CLIENT_SECRET) : la liste actuelle est conservée.",
  );
  process.exit(1);
}

const PER_KIND = 1000;
const PAGE = 500;

// Répartition des raretés selon le rang de popularité, pour chaque sorte de carte.
const TIERS = [
  { rarity: "A", count: 30 },
  { rarity: "B", count: 80 },
  { rarity: "C", count: 180 },
  { rarity: "D", count: 280 },
  { rarity: "E", count: 430 },
];

/** Studios maison de Nintendo et Pokémon : exclus quand ils DÉVELOPPENT le jeu. */
const EXCLUDED_DEVELOPERS =
  /^nintendo|game freak|the pok[ée]mon company|creatures inc|hal laboratory|intelligent systems|retro studios|monolith soft/i;
const EXCLUDED_FRANCHISES =
  /pok[ée]mon|mario|zelda|metroid|kirby|donkey kong|animal crossing|splatoon|pikmin|star fox/i;

/** Licences toujours incluses, même si elles ne sont pas dans le top. */
const ALWAYS = ["Layton"];

/** Les identifiants des personnages sont décalés pour ne jamais croiser ceux des jeux. */
const CHARACTER_ID_OFFSET = 10_000_000;

const GENRES_FR = {
  "Role-playing (RPG)": "RPG",
  Shooter: "Tir",
  Fighting: "Combat",
  Platform: "Plateforme",
  Adventure: "Aventure",
  "Hack and slash/Beat 'em up": "Beat'em all",
  Strategy: "Stratégie",
  "Real Time Strategy (RTS)": "Stratégie",
  "Turn-based strategy (TBS)": "Stratégie",
  Tactical: "Tactique",
  Racing: "Course",
  Sport: "Sport",
  Puzzle: "Réflexion",
  "Visual Novel": "Visual novel",
  Simulator: "Simulation",
  MOBA: "MOBA",
  Music: "Rythme",
  Indie: "Indé",
};
const THEMES_FR = {
  Horror: "Horreur",
  Survival: "Survie",
  Fantasy: "Fantasy",
  "Science fiction": "Science-fiction",
  Stealth: "Infiltration",
  "Open world": "Monde ouvert",
  Warfare: "Guerre",
  Historical: "Historique",
  Mystery: "Mystère",
  Comedy: "Comédie",
  Action: "Action",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const img = (id, size) => `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`;

async function token() {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await fetch(url, { method: "POST", signal: AbortSignal.timeout(20_000) });
  if (!res.ok)
    throw new Error(
      `Twitch a refusé les clés (${res.status}) : vérifie IGDB_CLIENT_ID et IGDB_CLIENT_SECRET.`,
    );
  return (await res.json()).access_token;
}

const auth = await token();

async function igdb(endpoint, body) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": CLIENT_ID, Authorization: `Bearer ${auth}`, Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 429) {
      await sleep(1500);
      continue;
    }
    if (!res.ok) throw new Error(`IGDB ${res.status} : ${await res.text()}`);
    await sleep(300); // 4 requêtes par seconde maximum
    return res.json();
  }
  throw new Error("IGDB ne répond pas : la liste actuelle est conservée.");
}

async function paged(endpoint, fields, where, sort, pages) {
  const out = [];
  for (let page = 0; page < pages; page++) {
    const batch = await igdb(
      endpoint,
      `fields ${fields}; where ${where}; ${sort} limit ${PAGE}; offset ${page * PAGE};`,
    );
    out.push(...batch);
    console.log(`${endpoint} : ${out.length}`);
    if (batch.length < PAGE) break;
  }
  return out;
}

// ---------- Outils communs ----------

const GAME_FIELDS = [
  "name",
  "url",
  "cover.image_id",
  "total_rating_count",
  "first_release_date",
  "genres.name",
  "themes.name",
  "franchises.name",
  "collections.name",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
];

function styleOf(game) {
  const genre = (game?.genres ?? []).map((g) => GENRES_FR[g.name]).find(Boolean);
  const theme = (game?.themes ?? []).map((t) => THEMES_FR[t.name]).find(Boolean);
  const parts = [...new Set([genre, theme].filter(Boolean))];
  return parts.length ? parts.join(" · ") : null;
}

const companies = (g) => (g?.involved_companies ?? []).filter((ic) => ic.company?.name);
const studioOf = (g) =>
  (companies(g).find((ic) => ic.developer) ?? companies(g).find((ic) => ic.publisher) ?? companies(g)[0])
    ?.company.name ?? null;
const sagaOf = (g) => g.franchises?.[0]?.name ?? g.collections?.[0]?.name ?? g.name;
const isAlways = (g) => ALWAYS.some((w) => `${g.name} ${sagaOf(g)}`.toLowerCase().includes(w.toLowerCase()));

function excluded(g) {
  if (!g || isAlways(g)) return false;
  if (EXCLUDED_FRANCHISES.test(sagaOf(g))) return true;
  return companies(g).some((ic) => ic.developer && EXCLUDED_DEVELOPERS.test(ic.company.name));
}

function assignRarity(list) {
  const rarities = TIERS.flatMap((t) => Array(t.count).fill(t.rarity));
  list.forEach((card, i) => (card.rarity = rarities[i] ?? "E"));
  // Au moins une carte Iridescente (A) par saga : la plus populaire de chaque saga de 3 cartes ou plus.
  const bySaga = new Map();
  for (const card of list) bySaga.set(card.anime, [...(bySaga.get(card.anime) ?? []), card]);
  for (const cards of bySaga.values()) if (cards.length >= 3) cards[0].rarity = "A";
}

// ---------- Jeux ----------

const MAIN_GAME = "cover != null & total_rating_count != null & parent_game = null & version_parent = null";
const rawGames = await paged("games", GAME_FIELDS.join(","), MAIN_GAME, "sort total_rating_count desc;", 4);
for (const word of ALWAYS) {
  rawGames.push(
    ...(await igdb(
      "games",
      `fields ${GAME_FIELDS.join(",")}; where ${MAIN_GAME} & name ~ *"${word}"*; limit 50;`,
    )),
  );
}

const seenGames = new Set();
const games = rawGames
  .filter((g) => {
    if (excluded(g)) return false;
    const key = g.name.toLowerCase();
    if (seenGames.has(key)) return false;
    seenGames.add(key);
    return true;
  })
  .sort((a, b) => b.total_rating_count - a.total_rating_count);
// Le top 1000, plus les licences toujours incluses qui n'y seraient pas.
const gameList = [...games.slice(0, PER_KIND), ...games.slice(PER_KIND).filter(isAlways)].map((g) => ({
  kind: "game",
  id: g.id,
  name: g.name,
  nativeName: null,
  image: img(g.cover.image_id, "cover_big"),
  anime: sagaOf(g),
  favourites: g.total_rating_count,
  url: g.url,
  rarity: "E",
  year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
  studio: studioOf(g),
  style: styleOf(g),
  cover: img(g.cover.image_id, "cover_big"),
}));
assignRarity(gameList);

// ---------- Personnages ----------

const CHAR_FIELDS = [
  "name",
  "url",
  "gender",
  "character_gender.name",
  "mug_shot.image_id",
  ...GAME_FIELDS.map((f) => `games.${f}`),
];
const GENDER = { 0: "Male", 1: "Female", 2: "Other" };
const CHAR_WHERE = "mug_shot != null & games != null";

const rawChars = await paged("characters", CHAR_FIELDS.join(","), CHAR_WHERE, "sort id asc;", 40);
for (const word of ALWAYS) {
  rawChars.push(
    ...(await igdb(
      "characters",
      `fields ${CHAR_FIELDS.join(",")}; where ${CHAR_WHERE} & games.name ~ *"${word}"*; limit 100;`,
    )),
  );
}

const mainGame = (c) =>
  [...(c.games ?? [])].sort((a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0))[0];
const seenChars = new Set();
const chars = rawChars
  .map((c) => ({ c, game: mainGame(c) }))
  .filter(({ c, game }) => {
    if (!game?.total_rating_count || excluded(game)) return false;
    const key = `${c.name.toLowerCase()}|${sagaOf(game).toLowerCase()}`;
    if (seenChars.has(key)) return false;
    seenChars.add(key);
    return true;
  })
  .sort((a, b) => b.game.total_rating_count - a.game.total_rating_count);
const charList = [
  ...chars.slice(0, PER_KIND),
  ...chars.slice(PER_KIND).filter(({ game }) => isAlways(game)),
].map(({ c, game }) => ({
  kind: "character",
  id: CHARACTER_ID_OFFSET + c.id,
  name: c.name,
  nativeName: null,
  image: img(c.mug_shot.image_id, "cover_big"),
  anime: sagaOf(game),
  favourites: game.total_rating_count,
  url: c.url,
  rarity: "E",
  gender: c.character_gender?.name ?? GENDER[c.gender] ?? null,
  style: styleOf(game),
  cover: game.cover?.image_id ? img(game.cover.image_id, "cover_big") : null,
}));
assignRarity(charList);

// ---------- Écriture ----------

if (gameList.length < 100)
  throw new Error(`Seulement ${gameList.length} jeux trouvés : la liste actuelle est conservée.`);

// Numérotation commune : les jeux d'abord, puis les personnages.
const cards = [...gameList, ...charList].map((card, i) => ({ ...card, number: i + 1 }));
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/cards.json", import.meta.url), JSON.stringify(cards, null, 2) + "\n");
const layton = cards.filter((c) => /layton/i.test(`${c.name} ${c.anime}`)).length;
console.log(
  `${gameList.length} jeux et ${charList.length} personnages écrits (dont ${layton} cartes Professeur Layton).`,
);
