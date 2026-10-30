// Dossiers liés : des duos et des trios qu'on obtient uniquement en agrafant
// les fiches de leurs membres. Les fiches agrafées sont consommées.

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

interface LinkDef {
  id: string;
  title: string;
  /** Identifiants AniList des personnages, présents dans cards.json. */
  members: number[];
}

// Liste tenue à la main : AniList ne fournit pas les paires de personnages.
const DEFS: LinkDef[] = [
  // Duos
  { id: "gon-killua", title: "Gon & Killua", members: [30, 27] },
  { id: "luffy-zoro", title: "Luffy & Zoro", members: [40, 62] },
  { id: "naruto-sasuke", title: "Naruto & Sasuke", members: [17, 13] },
  { id: "freres-uchiha", title: "Les frères Uchiha", members: [14, 13] },
  { id: "levi-erwin", title: "Levi & Erwin", members: [45627, 46496] },
  { id: "tanjirou-nezuko", title: "Tanjirou & Nezuko", members: [126071, 127518] },
  { id: "light-l", title: "Light & L", members: [80, 71] },
  { id: "freres-elric", title: "Les frères Elric", members: [11, 12] },
  { id: "gojou-getou", title: "Gojou & Getou", members: [127691, 133699] },
  { id: "itadori-toudou", title: "Itadori & Toudou", members: [127212, 137975] },
  { id: "hinata-kageyama", title: "Hinata & Kageyama", members: [64769, 64771] },
  { id: "deku-bakugou", title: "Deku & Bakugou", members: [89028, 88892] },
  { id: "reigen-mob", title: "Reigen & Mob", members: [89334, 89616] },
  { id: "guts-griffith", title: "Guts & Griffith", members: [422, 424] },
  { id: "okabe-kurisu", title: "Okabe & Kurisu", members: [35252, 34470] },
  { id: "kaguya-shirogane", title: "Kaguya & Shirogane", members: [120649, 121101] },
  { id: "ichigo-rukia", title: "Ichigo & Rukia", members: [5, 6] },
  { id: "gintoki-kagura", title: "Gintoki & Kagura", members: [672, 674] },
  { id: "lelouch-cc", title: "Lelouch & C.C.", members: [417, 1111] },
  { id: "gokuu-vegeta", title: "Gokuu & Vegeta", members: [246, 913] },
  { id: "saitama-genos", title: "Saitama & Genos", members: [73935, 73979] },
  { id: "dazai-chuuya", title: "Dazai & Chuuya", members: [89198, 89853] },
  { id: "miyamura-hori", title: "Miyamura & Hori", members: [66173, 66171] },
  { id: "thorfinn-askeladd", title: "Thorfinn & Askeladd", members: [10138, 13020] },
  { id: "mai-sakuta", title: "Mai & Sakuta", members: [127222, 127221] },
  { id: "kamina-simon", title: "Kamina & Simon", members: [2075, 2257] },
  { id: "gyro-johnny", title: "Gyro & Johnny", members: [11772, 19492] },
  // Trios
  { id: "equipe-kakashi", title: "Équipe Kakashi", members: [17, 13, 85] },
  { id: "premiere-annee", title: "Première année de Tokyo", members: [127212, 126635, 133700] },
  { id: "shiganshina", title: "Trio de Shiganshina", members: [40882, 40881, 46494] },
  { id: "equipe-tanjirou", title: "Tanjirou, Inosuke & Zenitsu", members: [126071, 129130, 129131] },
  { id: "famille-forger", title: "La famille Forger", members: [138102, 138100, 138101] },
  { id: "groupe-frieren", title: "Le groupe de Frieren", members: [176754, 183965, 184313] },
  { id: "kessoku-band", title: "Kessoku Band", members: [257562, 261674, 264529] },
  { id: "groupe-kazuma", title: "Le groupe de Kazuma", members: [89364, 89362, 89361] },
  { id: "grace-field", title: "Les enfants de Grace Field", members: [121725, 121700, 121724] },
  { id: "chainsaw-trio", title: "Denji, Power & Aki", members: [130102, 137079, 137081] },
  { id: "quintuplees", title: "Les sœurs Nakano", members: [126375, 126373, 126372] },
];

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export const LINKS: Link[] = DEFS.flatMap((def, i) => {
  const members = def.members.map((id) => CARD_BY_ID.get(id));
  if (members.some((c) => !c)) {
    console.warn(`Dossier lié « ${def.id} » ignoré : un membre est absent de cards.json.`);
    return [];
  }
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
