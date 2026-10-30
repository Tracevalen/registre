// Chaque personnage est classé de E (courant) à A (mythique) selon sa popularité.

export type Rarity = "E" | "D" | "C" | "B" | "A";

export interface RarityInfo {
  id: Rarity;
  name: string;
  /** Probabilité de tirer cette classe sur un emplacement normal du dossier. */
  weight: number;
}

/** Du plus courant au plus rare. */
export const RARITIES: RarityInfo[] = [
  { id: "E", name: "Courant", weight: 55 },
  { id: "D", name: "Notable", weight: 27 },
  { id: "C", name: "Rare", weight: 12 },
  { id: "B", name: "Exceptionnel", weight: 5 },
  { id: "A", name: "Mythique", weight: 1 },
];

export const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r])) as Record<Rarity, RarityInfo>;

export const rarityRank = (r: Rarity) => RARITIES.findIndex((x) => x.id === r);
