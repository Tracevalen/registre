// Albums par série et dossier spécial du jour.

import { CARDS, type Card } from "./cards";

/** Série → ses fiches, de la plus rare à la plus courante. */
const BY_SERIES = CARDS.reduce((map, c) => {
  const list = map.get(c.anime) ?? [];
  list.push(c);
  map.set(c.anime, list);
  return map;
}, new Map<string, Card[]>());

export interface Album {
  series: string;
  cards: Card[];
  /** Encre offerte quand l'album est complet. */
  reward: number;
  /** Dossiers offerts en plus pour les gros albums. */
  bonusBoosters: number;
}

/** Un album par série qui compte au moins 3 fiches. */
export const ALBUMS: Album[] = [...BY_SERIES.entries()]
  .filter(([, cards]) => cards.length >= 3)
  .map(([series, cards]) => ({
    series,
    cards: [...cards].sort((a, b) => a.number - b.number),
    reward: cards.length * 10,
    bonusBoosters: cards.length >= 8 ? 2 : cards.length >= 5 ? 1 : 0,
  }))
  .sort((a, b) => b.cards.length - a.cards.length || a.series.localeCompare(b.series));

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Série du dossier spécial : la même pour tout le monde, différente chaque jour. */
export function specialSeries(day: string): Album {
  const pool = ALBUMS.filter((a) => a.cards.length >= 5);
  return pool[hash("special" + day) % pool.length];
}
