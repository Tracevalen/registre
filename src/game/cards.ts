import raw from "../data/cards.json";
import type { Rarity } from "./rarities";

export interface Card {
  id: number;
  number: number;
  name: string;
  nativeName: string | null;
  image: string;
  anime: string;
  favourites: number;
  url: string;
  rarity: Rarity;
}

export const CARDS = raw as Card[];

export const CARDS_BY_RARITY = CARDS.reduce(
  (acc, c) => {
    (acc[c.rarity] ??= []).push(c);
    return acc;
  },
  {} as Record<Rarity, Card[]>,
);

export const formatNumber = (n: number) => String(n).padStart(4, "0");

export const formatFans = (n: number) => n.toLocaleString("fr-FR");
