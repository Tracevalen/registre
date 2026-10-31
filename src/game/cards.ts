import raw from "../data/cards.json";
import type { Rarity } from "./rarities";

export interface Card {
  /** Carte de jeu (la licence elle-même) ou de personnage. */
  kind: "game" | "character";
  id: number;
  number: number;
  name: string;
  nativeName: string | null;
  image: string;
  /** Saga du jeu ou du personnage (franchise IGDB). Le nom du champ vient de la première version. */
  anime: string;
  favourites: number;
  url: string;
  rarity: Rarity;
  /** Sexe du personnage, si connu. */
  gender?: string | null;
  /** Année de sortie (cartes de jeux vidéo). */
  year?: number | null;
  /** Studio de développement (cartes de jeux vidéo). */
  studio?: string | null;
  /** Style du jeu : genre et thème (« RPG · Fantasy »). */
  style?: string | null;
  /** Jaquette du jeu principal. */
  cover?: string | null;
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
