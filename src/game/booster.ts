import { CARDS_BY_RARITY, type Card } from "./cards";
import { SECRET_CHANCE } from "./economy";
import { RARITIES, type Rarity } from "./rarities";

export const CARDS_PER_BOOSTER = 5;

/** Un dossier ouvert : ses fiches et celles qui sont nouvelles pour le joueur. */
export interface Pull {
  id: number;
  cards: Card[];
  fresh: Set<number>;
  /** Fiches sorties en version Top secret, par emplacement. */
  secret: boolean[];
  /** Fiches qui figuraient dans les avis de recherche. */
  wanted: Set<number>;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rollRarity(minRank = 0): Rarity {
  const pool = RARITIES.slice(minRank);
  const total = pool.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of pool) {
    roll -= r.weight;
    if (roll < 0) return r.id;
  }
  return pool[pool.length - 1].id;
}

/** 4 emplacements normaux + 1 emplacement garanti classe D ou mieux. */
export function openBooster(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < CARDS_PER_BOOSTER; i++) {
    const last = i === CARDS_PER_BOOSTER - 1;
    cards.push(pick(CARDS_BY_RARITY[rollRarity(last ? 1 : 0)]));
  }
  return cards;
}

/** Tire, pour chaque fiche, si elle sort en version Top secret. */
export const rollSecrets = (n: number) => Array.from({ length: n }, () => Math.random() < SECRET_CHANCE);

/** Probabilité d'une classe sur un emplacement normal, en %. */
export function slotOdds(r: Rarity) {
  const total = RARITIES.reduce((s, x) => s + x.weight, 0);
  return (RARITIES.find((x) => x.id === r)!.weight / total) * 100;
}

export const formatOdds = (pct: number) => `${pct.toFixed(pct < 2 ? 1 : 0)} %`;
