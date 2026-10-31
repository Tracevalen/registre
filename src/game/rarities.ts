// Chaque carte est classée de E (Commune) à A (Iridescente) selon sa popularité.

export type Rarity = "E" | "D" | "C" | "B" | "A";

export interface RarityInfo {
  id: Rarity;
  name: string;
  /** Probabilité de tirer cette classe sur un emplacement normal du booster. */
  weight: number;
}

/** Du plus courant au plus rare. */
export const RARITIES: RarityInfo[] = [
  { id: "E", name: "Commune", weight: 55 },
  { id: "D", name: "Rare", weight: 27 },
  { id: "C", name: "Épique", weight: 12 },
  { id: "B", name: "Légendaire", weight: 5 },
  { id: "A", name: "Iridescente", weight: 1 },
];

export const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r])) as Record<Rarity, RarityInfo>;

export const rarityRank = (r: Rarity) => RARITIES.findIndex((x) => x.id === r);
