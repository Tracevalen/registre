// Génère src/data/cards.json à partir de Wikidata et Wikipédia : aucune clé ni compte requis.
// Deux sortes de cartes :
//   - les jeux : les 1000 jeux vidéo les plus présents sur Wikipédia (carte = jaquette du jeu) ;
//   - les personnages : environ 1000 personnages nés dans un jeu vidéo.
// La popularité est le nombre de Wikipédias (langues) qui ont un article sur la carte.
// Les licences maison de Nintendo et Pokémon sont exclues (ces éditeurs font retirer les
// projets de fans). Professeur Layton (Level-5) est toujours inclus.
//
//   npm run cards

const PER_KIND = 1000;
const UA = "RegistreCartes/1.0 (https://github.com/Tracevalen/registre)";

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
  /pok[ée]mon|mario|zelda|metroid|kirby|donkey kong|animal crossing|splatoon|pikmin|star fox|yoshi|wario|smash bros|fire emblem|xenoblade|f-zero/i;
/** Licences toujours incluses, même hors du top. */
const ALWAYS = /layton/i;

const GENRES_FR = [
  [/role-playing|rpg/i, "RPG"],
  [/battle royale/i, "Battle royale"],
  [/first-person shooter|third-person shooter|shooter/i, "Tir"],
  [/fighting/i, "Combat"],
  [/platform/i, "Plateforme"],
  [/survival horror|horror/i, "Horreur"],
  [/stealth/i, "Infiltration"],
  [/racing|kart/i, "Course"],
  [/sports|football|basketball/i, "Sport"],
  [/real-time strategy|strategy|tactical/i, "Stratégie"],
  [/puzzle/i, "Réflexion"],
  [/visual novel/i, "Visual novel"],
  [/rhythm|music/i, "Rythme"],
  [/simulation|simulator/i, "Simulation"],
  [/sandbox|open world/i, "Monde ouvert"],
  [/hack and slash|beat 'em up/i, "Beat'em all"],
  [/action-adventure/i, "Action-aventure"],
  [/adventure/i, "Aventure"],
  [/action/i, "Action"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const qid = (uri) => uri.split("/").pop();
const titleOf = (articleUri) => decodeURIComponent(articleUri.split("/wiki/")[1]).replace(/_/g, " ");
const val = (b, k) => b[k]?.value ?? null;
const list = (b, k) => (val(b, k) ? val(b, k).split("|").filter(Boolean) : []);

async function get(url, tries = 4) {
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(70_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} : ${(await res.text()).slice(0, 200)}`);
      return await res.json();
    } catch (e) {
      if (attempt === tries - 1) throw e;
      await sleep(3000 * (attempt + 1));
    }
  }
}

const sparql = async (query) =>
  (await get(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)).results
    .bindings;

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await fn(items.slice(i, i + size))));
    await sleep(300);
  }
  return out;
}

/** Image principale de chaque article Wikipédia (jaquette, portrait), y compris les images non libres. */
async function pageImages(titles) {
  const images = new Map();
  await inBatches(titles, 50, async (batch) => {
    const url =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&prop=pageimages|pageprops" +
      `&piprop=thumbnail&pithumbsize=400&pilicense=any&ppprop=page_image&titles=${encodeURIComponent(batch.join("|"))}`;
    const j = await get(url);
    const back = new Map((j.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of j.query.pages ?? []) {
      const file = p.pageprops?.page_image;
      const src =
        p.thumbnail?.source.split("?")[0] ??
        (file && `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`);
      if (src) images.set(back.get(p.title) ?? p.title, src);
    }
    return [];
  });
  return images;
}

const commons = (uri) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(decodeURIComponent(uri.split("/").pop()))}?width=400`;

function styleOf(genres) {
  const found = [];
  for (const g of genres)
    for (const [re, fr] of GENRES_FR)
      if (re.test(g) && !found.includes(fr)) {
        found.push(fr);
        break;
      }
  return found.slice(0, 2).join(" · ") || null;
}

const cleanSaga = (s) =>
  s
    ?.replace(/ ?\((video game )?(series|franchise)\)$/i, "")
    .replace(/ (fictional )?universe$/i, "")
    .replace(/ (3D|HD)$/, "");

function assignRarity(cards) {
  const rarities = TIERS.flatMap((t) => Array(t.count).fill(t.rarity));
  cards.forEach((card, i) => (card.rarity = rarities[i] ?? "E"));
  // Au moins une carte Iridescente (A) par saga : la plus populaire de chaque saga de 3 cartes ou plus.
  const bySaga = new Map();
  for (const card of cards) bySaga.set(card.anime, [...(bySaga.get(card.anime) ?? []), card]);
  for (const group of bySaga.values()) if (group.length >= 3) group[0].rarity = "A";
}

// ---------- Jeux ----------

async function buildGames(log = console.log) {
  const top = await sparql(`SELECT ?g ?links ?article WHERE {
    ?g wdt:P31 wd:Q7889; wikibase:sitelinks ?links. FILTER(?links >= 10)
    ?article schema:about ?g; schema:isPartOf <https://en.wikipedia.org/>. }`);
  const layton = await sparql(`SELECT ?g ?links ?article WHERE {
    ?g wdt:P31 wd:Q7889; wdt:P179|wdt:P8345 ?s; wikibase:sitelinks ?links.
    ?s rdfs:label ?sl. FILTER(lang(?sl) = "en" && CONTAINS(?sl, "Layton"))
    ?article schema:about ?g; schema:isPartOf <https://en.wikipedia.org/>. }`);
  const seen = new Set();
  const base = [...top, ...layton]
    .filter((b) => !seen.has(b.g.value) && seen.add(b.g.value))
    .map((b) => ({
      id: qid(b.g.value),
      links: Number(b.links.value),
      title: titleOf(b.article.value),
      url: b.article.value,
    }))
    .sort((a, b) => b.links - a.links);
  // Marge pour les exclusions et les jeux sans image.
  const pool = [...base.slice(0, 1600), ...base.slice(1600).filter((g) => ALWAYS.test(g.title))];
  log(`jeux candidats : ${pool.length}`);

  const details = await inBatches(pool, 200, (batch) =>
    sparql(`SELECT ?g (SAMPLE(?label) AS ?name) (MIN(YEAR(?date)) AS ?year)
      (GROUP_CONCAT(DISTINCT ?devL; separator="|") AS ?devs) (SAMPLE(?serL) AS ?series)
      (SAMPLE(?frL) AS ?franchise) (GROUP_CONCAT(DISTINCT ?genL; separator="|") AS ?genres) (SAMPLE(?img) AS ?image) WHERE {
      VALUES ?g { ${batch.map((g) => `wd:${g.id}`).join(" ")} }
      OPTIONAL { ?g rdfs:label ?label FILTER(lang(?label) = "en") }
      OPTIONAL { ?g wdt:P577 ?date }
      OPTIONAL { ?g wdt:P178/rdfs:label ?devL FILTER(lang(?devL) = "en") }
      OPTIONAL { ?g wdt:P179/rdfs:label ?serL FILTER(lang(?serL) = "en") }
      OPTIONAL { ?g wdt:P8345/rdfs:label ?frL FILTER(lang(?frL) = "en") }
      OPTIONAL { ?g wdt:P136/rdfs:label ?genL FILTER(lang(?genL) = "en") }
      OPTIONAL { ?g wdt:P18|wdt:P154 ?img }
    } GROUP BY ?g`),
  );
  const byId = new Map(details.map((d) => [qid(d.g.value), d]));
  const images = await pageImages(pool.map((g) => g.title));

  const games = [];
  for (const g of pool) {
    const d = byId.get(g.id) ?? {};
    const name = (val(d, "name") ?? g.title).replace(/ \((\d{4} )?video game\)$/, "");
    const saga = cleanSaga(val(d, "series") ?? val(d, "franchise")) ?? name;
    const devs = list(d, "devs");
    const always = ALWAYS.test(`${name} ${saga}`);
    if (
      !always &&
      (EXCLUDED_FRANCHISES.test(`${name} ${saga}`) || devs.some((x) => EXCLUDED_DEVELOPERS.test(x)))
    )
      continue;
    const image = images.get(g.title) ?? (val(d, "image") ? commons(val(d, "image")) : null);
    if (!image) continue;
    games.push({
      kind: "game",
      qid: g.id,
      name,
      nativeName: null,
      image,
      anime: saga,
      favourites: g.links,
      url: g.url,
      rarity: "E",
      year: val(d, "year") ? Number(val(d, "year")) : null,
      studio: devs[0] ?? null,
      style: styleOf(list(d, "genres")),
      cover: image,
    });
  }
  const kept = [
    ...games.slice(0, PER_KIND),
    ...games.slice(PER_KIND).filter((g) => ALWAYS.test(`${g.name} ${g.anime}`)),
  ];
  assignRarity(kept);
  log(`jeux gardés : ${kept.length}`);
  return kept;
}

// ---------- Personnages ----------

async function buildCharacters(games, log = console.log) {
  // Personnages de jeu vidéo. On garde ceux nés dans un jeu (première apparition), ou présents
  // surtout dans des jeux : ça écarte Mickey, Dark Vador ou Naruto, qui ont aussi des jeux.
  const rows = await sparql(`SELECT ?c ?article ?links
    (COUNT(DISTINCT ?fg) AS ?nfg) (COUNT(DISTINCT ?fo) AS ?nfo) (COUNT(DISTINCT ?wg) AS ?nwg) (COUNT(DISTINCT ?wo) AS ?nwo) WHERE {
    ?c wdt:P31/wdt:P279* wd:Q1569167; wikibase:sitelinks ?links.
    ?article schema:about ?c; schema:isPartOf <https://en.wikipedia.org/>.
    OPTIONAL { ?c wdt:P4584 ?fg. FILTER EXISTS { ?fg wdt:P31/wdt:P279* wd:Q7889 } }
    OPTIONAL { ?c wdt:P4584 ?fo. FILTER NOT EXISTS { ?fo wdt:P31/wdt:P279* wd:Q7889 } }
    OPTIONAL { ?c wdt:P1441|wdt:P8345|wdt:P179 ?wg. FILTER EXISTS { ?wg wdt:P31/wdt:P279* ?gt. VALUES ?gt { wd:Q7889 wd:Q7058673 } } }
    OPTIONAL { ?c wdt:P1441|wdt:P8345|wdt:P179 ?wo. FILTER NOT EXISTS { ?wo wdt:P31/wdt:P279* ?gt2. VALUES ?gt2 { wd:Q7889 wd:Q7058673 } } }
  } GROUP BY ?c ?article ?links`);
  const n = (b, k) => Number(b[k].value);
  const pool = rows
    .filter((b) => n(b, "nfg") > 0 || n(b, "nwg") > n(b, "nwo") || ALWAYS.test(b.article.value))
    .map((b) => ({
      id: qid(b.c.value),
      links: Number(b.links.value),
      title: titleOf(b.article.value),
      url: b.article.value,
      bornInGame: n(b, "nfg") > 0,
    }))
    .sort((a, b) => b.links - a.links);
  log(`personnages candidats : ${pool.length}`);

  const details = await inBatches(pool, 200, (batch) =>
    sparql(`SELECT ?c (SAMPLE(?label) AS ?name) (SAMPLE(?sexL) AS ?sex) (SAMPLE(?uniL) AS ?universe)
      (SAMPLE(?frL) AS ?franchise) (SAMPLE(?firstL) AS ?first) (SAMPLE(?first) AS ?firstId)
      (GROUP_CONCAT(DISTINCT ?workL; separator="|") AS ?works) (GROUP_CONCAT(DISTINCT ?typeL; separator="|") AS ?types)
      (SAMPLE(?img) AS ?image) WHERE {
      VALUES ?c { ${batch.map((c) => `wd:${c.id}`).join(" ")} }
      OPTIONAL { ?c rdfs:label ?label FILTER(lang(?label) = "en") }
      OPTIONAL { ?c wdt:P21/rdfs:label ?sexL FILTER(lang(?sexL) = "en") }
      OPTIONAL { ?c wdt:P1080/rdfs:label ?uniL FILTER(lang(?uniL) = "en") }
      OPTIONAL { ?c wdt:P8345|wdt:P179 ?fr. ?fr rdfs:label ?frL FILTER(lang(?frL) = "en") }
      OPTIONAL { ?c wdt:P4584 ?first. ?first rdfs:label ?firstL FILTER(lang(?firstL) = "en") }
      OPTIONAL { ?c wdt:P1441/rdfs:label ?workL FILTER(lang(?workL) = "en") }
      OPTIONAL { ?c wdt:P31/rdfs:label ?typeL FILTER(lang(?typeL) = "en") }
      OPTIONAL { ?c wdt:P18 ?img }
    } GROUP BY ?c`),
  );
  const byId = new Map(details.map((d) => [qid(d.c.value), d]));
  const images = await pageImages(pool.map((c) => c.title));
  const gameByQid = new Map(games.map((g) => [g.qid, g]));
  const gameByName = new Map(games.map((g) => [g.name.toLowerCase(), g]));

  const chars = [];
  for (const c of pool) {
    const d = byId.get(c.id) ?? {};
    const name = val(d, "name") ?? c.title.replace(/ \(.*\)$/, "");
    const works = list(d, "works");
    const firstGame =
      (val(d, "firstId") && gameByQid.get(qid(val(d, "firstId")))) ||
      [val(d, "first"), ...works].map((w) => w && gameByName.get(w.toLowerCase())).find(Boolean);
    const saga =
      cleanSaga(val(d, "universe") ?? val(d, "franchise")) ??
      firstGame?.anime ??
      val(d, "first") ??
      works[0] ??
      name;
    const context = `${name} ${saga} ${val(d, "first") ?? ""} ${works.join(" ")}`;
    // Nintendo : on regarde la saga et la première apparition, pas les invitations (Smash Bros.).
    const nintendo =
      EXCLUDED_FRANCHISES.test(`${name} ${saga} ${val(d, "first") ?? ""}`) ||
      (works.length > 0 && works.every((w) => EXCLUDED_FRANCHISES.test(w)));
    if (!ALWAYS.test(context) && nintendo) continue;
    // Héros de comics, mascottes ou légendes du web qui ont seulement eu des jeux.
    if (
      !c.bornInGame &&
      !ALWAYS.test(context) &&
      (/comics|creepypasta|folklore|mascot/i.test(val(d, "types") ?? "") ||
        /earth-616|marvel|\bdc\b/i.test(saga))
    )
      continue;
    // Sans portrait, la carte prend la jaquette de son jeu.
    const image =
      images.get(c.title) ?? (val(d, "image") ? commons(val(d, "image")) : null) ?? firstGame?.image;
    if (!image) continue;
    chars.push({
      kind: "character",
      qid: c.id,
      name,
      nativeName: null,
      image,
      anime: saga,
      favourites: c.links,
      url: c.url,
      rarity: "E",
      gender: val(d, "sex"),
      style: firstGame?.style ?? null,
      cover: firstGame?.image ?? null,
    });
  }
  const kept = [
    ...chars.slice(0, PER_KIND),
    ...chars.slice(PER_KIND).filter((c) => ALWAYS.test(`${c.name} ${c.anime}`)),
  ];
  assignRarity(kept);
  log(`personnages gardés : ${kept.length}`);
  return kept;
}

/** Numérotation commune : les jeux d'abord, puis les personnages. Identifiants stables tirés de Wikidata. */
function finalize(games, chars) {
  return [...games, ...chars].map(({ qid: q, ...card }, i) => ({
    ...card,
    id: Number(q.slice(1)),
    number: i + 1,
  }));
}

// Écriture du fichier.
const { mkdir, writeFile } = await import("node:fs/promises");
const games = await buildGames();
if (games.length < 100)
  throw new Error(`Seulement ${games.length} jeux trouvés : la liste actuelle est conservée.`);
const chars = await buildCharacters(games);
const cards = finalize(games, chars);
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/cards.json", import.meta.url), JSON.stringify(cards, null, 2) + "\n");
const layton = cards.filter((c) => /layton/i.test(`${c.name} ${c.anime}`)).length;
console.log(
  `${games.length} jeux et ${chars.length} personnages écrits (dont ${layton} cartes Professeur Layton).`,
);
