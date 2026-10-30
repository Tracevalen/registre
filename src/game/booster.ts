import { CARDS_BY_RARITY, type Card } from "./cards";
import { SECRET_CHANCE } from "./economy";
import { RARITIES, rarityRank, type Rarity } from "./rarities";

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
  /** Nombre de dossiers ouverts d'un coup (« Tout ouvrir »). */
  batch?: number;
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

/** Après ce nombre de dossiers sans fiche A, la 5ᵉ fiche est forcément A. */
export const PITY_LIMIT = 60;

interface BoosterOptions {
  /** Force une fiche A sur le dernier emplacement (indice de pitié atteint). */
  guaranteeA?: boolean;
  /** Dossier thématique : on ne tire que dans ces fiches. */
  pool?: Card[];
}

/** 4 emplacements normaux + 1 emplacement garanti classe D ou mieux. */
export function openBooster({ guaranteeA = false, pool }: BoosterOptions = {}): Card[] {
  if (pool && pool.length) {
    const best = pool.filter((c) => rarityRank(c.rarity) >= rarityRank("C"));
    const cards = Array.from({ length: CARDS_PER_BOOSTER - 1 }, () => pick(pool));
    cards.push(pick(best.length ? best : pool));
    return cards;
  }
  const cards: Card[] = [];
  for (let i = 0; i < CARDS_PER_BOOSTER; i++) {
    const last = i === CARDS_PER_BOOSTER - 1;
    if (last && guaranteeA) cards.push(pick(CARDS_BY_RARITY.A));
    else cards.push(pick(CARDS_BY_RARITY[rollRarity(last ? 1 : 0)]));
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
