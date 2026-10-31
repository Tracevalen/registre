// Chaque carte est classée de E (Commune) à A (Iridescente) selon sa popularité.

export type Rarity = "E" | "D" | "C" | "B" | "A";

export interface RarityInfo {
  id: Rarity;
  name: string;
  /** Initiale affichée dans l'hexagone de la carte. */
  short: string;
  /** Probabilité de tirer cette classe sur un emplacement normal du booster. */
  weight: number;
}

/** Du plus courant au plus rare. */
export const RARITIES: RarityInfo[] = [
  { id: "E", name: "Commune", short: "C", weight: 55 },
  { id: "D", name: "Rare", short: "R", weight: 27 },
  { id: "C", name: "Épique", short: "É", weight: 12 },
  { id: "B", name: "Légendaire", short: "L", weight: 5 },
  { id: "A", name: "Iridescente", short: "I", weight: 1 },
];

export const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r])) as Record<Rarity, RarityInfo>;

export const rarityRank = (r: Rarity) => RARITIES.findIndex((x) => x.id === r);
