// Encre : on broie ses doublons pour en obtenir, on la dépense pour demander
// l'accès à une fiche précise. Les valeurs sont les mêmes pour tout le monde.

import type { Rarity } from "./rarities";

/** Encre rendue par un doublon broyé. */
export const SHRED_INK: Record<Rarity, number> = { E: 1, D: 3, C: 8, B: 20, A: 60 };

/** Encre exigée pour une demande d'accès à une fiche. */
export const REQUEST_COST: Record<Rarity, number> = { E: 15, D: 45, C: 120, B: 300, A: 900 };

/** Chance qu'une fiche sorte en version « Top secret » (tamponnée). */
export const SECRET_CHANCE = 0.015;

interface CopiesView {
  owned: Record<number, number>;
  secret: Record<number, number>;
}

/**
 * Doublons qu'on peut broyer : on garde toujours un exemplaire,
 * et jamais un exemplaire Top secret.
 */
export function shreddable(save: CopiesView, id: number) {
  const owned = save.owned[id] ?? 0;
  const keep = Math.max(1, save.secret[id] ?? 0);
  return Math.max(0, owned - keep);
}
