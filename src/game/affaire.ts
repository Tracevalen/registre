// L'Affaire du jour : un personnage mystère à identifier en 6 essais.
// Le même pour tout le monde ce jour-là, pour pouvoir comparer ses résultats.

import { CARDS, type Card } from "./cards";
import { rarityRank } from "./rarities";

export const MAX_GUESSES = 6;

/** Suspects possibles : les personnages assez connus pour être devinés (classes A à C). */
const SUSPECTS = CARDS.filter((c) => rarityRank(c.rarity) >= rarityRank("C"));

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function suspectOfDay(day: string): Card {
  return SUSPECTS[hash("affaire" + day) % SUSPECTS.length];
}

export type Hint = "match" | "up" | "down" | "miss";

export interface Clue {
  card: Card;
  series: Hint;
  rarity: Hint;
  fans: Hint;
  initial: Hint;
}

/** Compare un essai au suspect : « up » veut dire que le suspect est plus haut. */
export function compare(guess: Card, target: Card): Clue {
  const rank = (c: Card) => rarityRank(c.rarity);
  const order = (a: number, b: number): Hint => (a === b ? "match" : b > a ? "up" : "down");
  return {
    card: guess,
    series: guess.anime === target.anime ? "match" : "miss",
    rarity: order(rank(guess), rank(target)),
    fans: guess.id === target.id ? "match" : order(guess.favourites, target.favourites),
    initial: guess.name[0]?.toUpperCase() === target.name[0]?.toUpperCase() ? "match" : "miss",
  };
}

/** Flou du portrait selon le nombre d'essais déjà faits. */
export const blurFor = (tries: number, done: boolean) => (done ? 0 : Math.max(4, 28 - tries * 5));

/** Encre gagnée : plus on trouve vite, plus on gagne. */
export const affaireReward = (tries: number) => 40 - (tries - 1) * 5;

const SQUARE: Record<Hint, string> = { match: "🟩", up: "🟨", down: "🟨", miss: "⬛" };

/** Ligne de résultat à partager, sans révéler le suspect. */
export function shareText(day: string, clues: Clue[], won: boolean) {
  const [y, m, d] = day.split("-");
  const lines = clues.map((c) => [c.series, c.rarity, c.fans, c.initial].map((h) => SQUARE[h]).join(""));
  return `Registre · Affaire du ${d}/${m}/${y} · ${won ? clues.length : "X"}/${MAX_GUESSES}\n${lines.join("\n")}`;
}

/** Normalise un nom pour la recherche (accents, casse). */
export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
