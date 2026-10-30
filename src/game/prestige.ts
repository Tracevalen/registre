// Prestige : fusionner ses doublons d'une même fiche pour la faire monter en grade.
// Niveau 1 bronze, 2 argent, 3 or. Chaque niveau coûte deux fois plus de doublons.

export const MAX_PRESTIGE = 3;

export const PRESTIGE_NAME = ["", "Bronze", "Argent", "Or"] as const;

/** Doublons consommés pour passer du niveau `level` au suivant : 1, puis 2, puis 4. */
export const prestigeCost = (level: number) => 2 ** level;

interface PrestigeView {
  owned: Record<number, number>;
  secret: Record<number, number>;
  prestige: Record<number, number>;
}

/** Doublons disponibles pour le prestige (on garde toujours un exemplaire et les Top secret). */
export function spareCopies(save: PrestigeView, id: number) {
  const keep = Math.max(1, save.secret[id] ?? 0);
  return Math.max(0, (save.owned[id] ?? 0) - keep);
}

export function canPrestige(save: PrestigeView, id: number) {
  const level = save.prestige[id] ?? 0;
  return level < MAX_PRESTIGE && spareCopies(save, id) >= prestigeCost(level);
}
