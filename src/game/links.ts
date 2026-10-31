// Fusions : des duos et des trios qu'on obtient uniquement en fusionnant
// les cartes de leurs membres. Les cartes fusionnées sont consommées.

import { CARDS, type Card } from "./cards";
import { RARITIES, type Rarity } from "./rarities";

/** Les dossiers liés ont une classe de plus que les fiches : S, hors classe. */
export type LinkClass = Rarity | "S";

export const LINK_CLASS_NAME: Record<LinkClass, string> = {
  ...(Object.fromEntries(RARITIES.map((r) => [r.id, r.name])) as Record<Rarity, string>),
  S: "Duo",
};

const LINK_CLASS_ORDER: LinkClass[] = ["E", "D", "C", "B", "A", "S"];

export const linkClassRank = (c: LinkClass) => LINK_CLASS_ORDER.indexOf(c);

export interface Link {
  id: string;
  number: number;
  title: string;
  kind: "duo" | "trio";
  members: Card[];
  anime: string;
  rarity: LinkClass;
}

/** Un membre : identifiant de la carte, nom exact, ou plusieurs orthographes possibles. */
type Member = number | string | string[];

interface LinkDef {
  id: string;
  title: string;
  members: Member[];
}

// Liste tenue à la main : les bases ne fournissent pas les paires de personnages.
// Une liaison dont un membre manque dans cards.json est simplement ignorée.
// Membres : identifiant de la base, nom exact, ou liste de noms possibles.
const DEFS: LinkDef[] = [
  // Jeux vidéo : suites et trilogies, repérées par le nom exact du jeu
  { id: "portal", title: "Portal 1 & 2", members: ["Portal", "Portal 2"] },
  { id: "half-life", title: "Half-Life 1 & 2", members: ["Half-Life", "Half-Life 2"] },
  {
    id: "rdr",
    title: "Red Dead Redemption 1 & 2",
    members: ["Red Dead Redemption", "Red Dead Redemption 2"],
  },
  { id: "tlou", title: "The Last of Us I & II", members: ["The Last of Us", "The Last of Us Part II"] },
  { id: "gow", title: "God of War & Ragnarök", members: ["God of War", "God of War Ragnarök"] },
  {
    id: "witcher",
    title: "The Witcher 2 & 3",
    members: ["The Witcher 2: Assassins of Kings", "The Witcher 3: Wild Hunt"],
  },
  { id: "bioshock", title: "BioShock & Infinite", members: ["BioShock", "BioShock Infinite"] },
  { id: "l4d", title: "Left 4 Dead 1 & 2", members: ["Left 4 Dead", "Left 4 Dead 2"] },
  { id: "borderlands", title: "Borderlands 1 & 2", members: ["Borderlands", "Borderlands 2"] },
  {
    id: "elder-scrolls",
    title: "Oblivion & Skyrim",
    members: ["The Elder Scrolls IV: Oblivion", "The Elder Scrolls V: Skyrim"],
  },
  { id: "arkham", title: "Arkham Asylum & City", members: ["Batman: Arkham Asylum", "Batman: Arkham City"] },
  {
    id: "uncharted",
    title: "Uncharted 2 & 4",
    members: ["Uncharted 2: Among Thieves", "Uncharted 4: A Thief's End"],
  },
  {
    id: "mass-effect",
    title: "Trilogie Mass Effect",
    members: ["Mass Effect", "Mass Effect 2", "Mass Effect 3"],
  },
  {
    id: "dark-souls",
    title: "Trilogie Dark Souls",
    members: ["Dark Souls", "Dark Souls II", "Dark Souls III"],
  },
  {
    id: "gta",
    title: "San Andreas, IV & V",
    members: ["Grand Theft Auto: San Andreas", "Grand Theft Auto IV", "Grand Theft Auto V"],
  },
  {
    id: "fallout",
    title: "Fallout 3, New Vegas & 4",
    members: ["Fallout 3", "Fallout: New Vegas", "Fallout 4"],
  },
  // Professeur Layton
  { id: "layton-luke", title: "Layton & Luke", members: ["Professor Hershel Layton", "Luke Triton"] },
  {
    id: "layton-trio",
    title: "Trilogie Layton",
    members: [
      "Professor Layton and the Curious Village",
      "Professor Layton and the Diabolical Box",
      "Professor Layton and the Unwound Future",
    ],
  },
  // Personnages de jeux vidéo. Plusieurs orthographes possibles : la première trouvée dans cards.json est prise.
  // Duos
  {
    id: "joel-ellie",
    title: "Joel & Ellie",
    members: [
      ["Joel", "Joel Miller"],
      ["Ellie", "Ellie Williams"],
    ],
  },
  { id: "kratos-atreus", title: "Kratos & Atreus", members: ["Kratos", "Atreus"] },
  {
    id: "geralt-ciri",
    title: "Geralt & Ciri",
    members: [
      ["Geralt of Rivia", "Geralt"],
      ["Ciri", "Cirilla Fiona Elen Riannon"],
    ],
  },
  { id: "arthur-john", title: "Arthur & John", members: ["Arthur Morgan", "John Marston"] },
  {
    id: "drake-sully",
    title: "Nathan Drake & Sully",
    members: ["Nathan Drake", ["Victor Sullivan", "Sully"]],
  },
  { id: "ratchet-clank", title: "Ratchet & Clank", members: ["Ratchet", "Clank"] },
  { id: "jak-daxter", title: "Jak & Daxter", members: ["Jak", "Daxter"] },
  {
    id: "sonic-tails",
    title: "Sonic & Tails",
    members: [
      ["Sonic the Hedgehog", "Sonic"],
      ['Miles "Tails" Prower', "Tails", "Miles Prower"],
    ],
  },
  { id: "crash-coco", title: "Crash & Coco", members: ["Crash Bandicoot", "Coco Bandicoot"] },
  { id: "banjo-kazooie", title: "Banjo & Kazooie", members: ["Banjo", "Kazooie"] },
  { id: "chell-glados", title: "Chell & GLaDOS", members: ["Chell", "GLaDOS"] },
  {
    id: "chief-cortana",
    title: "Master Chief & Cortana",
    members: [["Master Chief", "John-117", "Master Chief Petty Officer John-117"], "Cortana"],
  },
  { id: "ryu-ken", title: "Ryu & Ken", members: ["Ryu", ["Ken Masters", "Ken"]] },
  { id: "scorpion-subzero", title: "Scorpion & Sub-Zero", members: ["Scorpion", "Sub-Zero"] },
  { id: "mishima", title: "Les Mishima", members: ["Kazuya Mishima", "Heihachi Mishima"] },
  {
    id: "leon-claire",
    title: "Leon & Claire",
    members: [["Leon S. Kennedy", "Leon Scott Kennedy", "Leon Kennedy"], "Claire Redfield"],
  },
  { id: "chris-jill", title: "Chris & Jill", members: ["Chris Redfield", "Jill Valentine"] },
  { id: "snake-otacon", title: "Snake & Otacon", members: ["Solid Snake", ["Otacon", "Hal Emmerich"]] },
  { id: "dante-vergil", title: "Dante & Vergil", members: ["Dante", "Vergil"] },
  { id: "cloud-sephiroth", title: "Cloud & Sephiroth", members: ["Cloud Strife", "Sephiroth"] },
  { id: "tidus-yuna", title: "Tidus & Yuna", members: ["Tidus", "Yuna"] },
  {
    id: "ezio-altair",
    title: "Ezio & Altaïr",
    members: [
      ["Ezio Auditore da Firenze", "Ezio Auditore"],
      ["Altaïr Ibn-La'Ahad", "Altair Ibn-La'Ahad", "Altaïr"],
    ],
  },
  {
    id: "phoenix-edgeworth",
    title: "Phoenix Wright & Miles Edgeworth",
    members: ["Phoenix Wright", "Miles Edgeworth"],
  },
  { id: "joker-morgana", title: "Joker & Morgana", members: [["Joker", "Ren Amamiya"], "Morgana"] },
  // Trios
  {
    id: "layton-famille",
    title: "Layton, Luke & Emmy",
    members: ["Professor Hershel Layton", "Luke Triton", "Emmy Altava"],
  },
  { id: "kingdom-hearts", title: "Sora, Donald & Dingo", members: ["Sora", "Donald Duck", "Goofy"] },
  {
    id: "gta-v",
    title: "Michael, Franklin & Trevor",
    members: ["Michael De Santa", "Franklin Clinton", "Trevor Philips"],
  },
  {
    id: "grove-street",
    title: "Grove Street",
    members: [
      ["Carl Johnson", "CJ"],
      ["Big Smoke", "Melvin Harris"],
      ["Ryder", "Lance Wilson"],
    ],
  },
];

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const CARD_BY_NAME = new Map<string, Card>();
// Les cartes sont rangées par popularité : en cas d'homonymes, on garde le plus populaire.
for (const c of CARDS) if (!CARD_BY_NAME.has(norm(c.name))) CARD_BY_NAME.set(norm(c.name), c);

const resolve = (m: Member) =>
  typeof m === "number"
    ? CARD_BY_ID.get(m)
    : (Array.isArray(m) ? m : [m]).map((n) => CARD_BY_NAME.get(norm(n))).find(Boolean);

export const LINKS: Link[] = DEFS.flatMap((def, i) => {
  const members = def.members.map(resolve);
  if (members.some((c) => !c)) return [];
  const cards = members as Card[];
  return [
    {
      id: def.id,
      number: i + 1,
      title: def.title,
      kind: cards.length >= 3 ? "trio" : "duo",
      members: cards,
      anime: [...new Set(cards.map((c) => c.anime))].join(" · "),
      // Toutes les liaisons ont leur propre rareté : DUO ou TRIO.
      rarity: "S" as LinkClass,
    },
  ];
});

export const LINK_BY_ID = new Map(LINKS.map((l) => [l.id, l]));

export const formatLinkNumber = (n: number) => `L-${String(n).padStart(3, "0")}`;

/** Exemplaires qu'une fusion exige pour chaque membre. */
export const required = (keepOne: boolean) => (keepOne ? 2 : 1);

export type LinkState = "classified" | "detected" | "ready";

interface LinkSaveView {
  owned: Record<number, number>;
  firstSeen: Record<number, number>;
  keepOne: boolean;
}

export function canFuse(save: LinkSaveView, link: Link) {
  const need = required(save.keepOne);
  return link.members.every((c) => (save.owned[c.id] ?? 0) >= need);
}

/**
 * classified : aucun membre jamais archivé, la recette reste secrète.
 * detected : au moins un membre déjà vu, la recette apparaît.
 * ready : toutes les pièces sont là, on peut agrafer.
 */
export function linkState(save: LinkSaveView, link: Link): LinkState {
  if (canFuse(save, link)) return "ready";
  return link.members.some((c) => save.firstSeen[c.id]) ? "detected" : "classified";
}
