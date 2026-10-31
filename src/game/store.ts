import { useCallback, useEffect, useState } from "react";
import { CARDS, type Card } from "./cards";
import { REQUEST_COST, SHRED_INK, shreddable } from "./economy";
import { canFuse, type Link } from "./links";
import { dayKey, missionsForDay, type Counter } from "./missions";
import { rarityRank } from "./rarities";
import { ALBUMS } from "./series";
import { affaireReward, MAX_GUESSES, suspectOfDay } from "./affaire";
import { GRADE_BOOSTERS, gradeIndex, XP } from "./grades";
import { canPrestige, prestigeCost } from "./prestige";

// Sauvegarde locale (navigateur). À remplacer par un backend quand il y aura des comptes.

export const MAX_BOOSTERS = 15;
export const RECHARGE_MS = 3 * 60 * 1000; // un booster toutes les 3 minutes

export interface Daily {
  day: string;
  counts: Partial<Record<Counter, number>>;
  claimed: string[];
  /** Dossier spécial du jour déjà ouvert. */
  special: boolean;
  /** Affaire du jour : identifiants des personnages proposés. */
  affaire: { guesses: number[]; done: boolean; won: boolean };
}

/** Série de connexion : jours consécutifs avec au moins une visite. */
export interface Streak {
  last: string;
  days: number;
}

/** Encre offerte à chaque première visite du jour. */
export const DAILY_INK = 5;
/** Tous les 7 jours de série, des dossiers en cadeau. */
export const STREAK_GOAL = 7;
export const STREAK_BOOSTERS = 2;

export interface SaveData {
  /** id de carte → nombre d'exemplaires */
  owned: Record<number, number>;
  /** id de carte → date de première obtention */
  firstSeen: Record<number, number>;
  boosters: number;
  /** horodatage du dernier booster rechargé */
  lastRecharge: number;
  opened: number;
  /** id de dossier lié → nombre d'exemplaires agrafés */
  linked: Record<string, number>;
  /** id de dossier lié → date de la première fusion */
  linkedFirst: Record<string, number>;
  /** Une fusion ne consomme jamais le dernier exemplaire d'une fiche. */
  keepOne: boolean;
  /** Encre gagnée en broyant des doublons. */
  ink: number;
  /** id de carte → exemplaires Top secret parmi ceux possédés */
  secret: Record<number, number>;
  /** Avis de recherche : fiches que le joueur veut obtenir. */
  wanted: number[];
  daily: Daily;
  /** Dossiers ouverts depuis la dernière fiche A. */
  pity: number;
  streak: Streak;
  /** Albums complets dont la récompense a été récupérée. */
  albumsClaimed: string[];
  /** Expérience d'enquêteur, qui fait monter en grade. */
  xp: number;
  /** id de carte → niveau de prestige (0 à 3) */
  prestige: Record<number, number>;
}

// Nouvelle clé : les cartes d'anime ont été remplacées par des jeux vidéo, la collection repart de zéro.
const KEY = "registre-jeux-v1";

const freshDaily = (t: number): Daily => ({
  day: dayKey(t),
  counts: {},
  claimed: [],
  special: false,
  affaire: { guesses: [], done: false, won: false },
});

const fresh = (): SaveData => ({
  owned: {},
  firstSeen: {},
  boosters: MAX_BOOSTERS,
  lastRecharge: Date.now(),
  opened: 0,
  linked: {},
  linkedFirst: {},
  keepOne: true,
  ink: 0,
  secret: {},
  wanted: [],
  daily: freshDaily(Date.now()),
  pity: 0,
  streak: { last: "", days: 0 },
  albumsClaimed: [],
  xp: 0,
  prestige: {},
});

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const base = fresh();
      const data = { ...base, ...JSON.parse(raw) };
      return { ...data, daily: { ...base.daily, ...data.daily } };
    }
  } catch {
    /* sauvegarde illisible : on repart de zéro */
  }
  return fresh();
}

/** Remet les enquêtes à zéro quand on change de jour, et compte la série de connexion. */
function rollDay(s: SaveData, now: number): SaveData {
  const today = dayKey(now);
  if (s.daily.day === today && s.streak.last === today) return s;
  const next = s.daily.day === today ? s : { ...s, daily: freshDaily(now) };
  if (s.streak.last === today) return next;
  const yesterday = dayKey(now - 24 * 60 * 60 * 1000);
  const days = s.streak.last === yesterday ? s.streak.days + 1 : 1;
  return {
    ...next,
    streak: { last: today, days },
    ink: next.ink + DAILY_INK,
    boosters: next.boosters + (days % STREAK_GOAL === 0 ? STREAK_BOOSTERS : 0),
  };
}

function recharge(s: SaveData, now: number): SaveData {
  s = rollDay(s, now);
  if (s.boosters >= MAX_BOOSTERS) return s.lastRecharge === now ? s : { ...s, lastRecharge: now };
  const gained = Math.floor((now - s.lastRecharge) / RECHARGE_MS);
  if (gained <= 0) return s;
  const boosters = Math.min(MAX_BOOSTERS, s.boosters + gained);
  return {
    ...s,
    boosters,
    lastRecharge: boosters >= MAX_BOOSTERS ? now : s.lastRecharge + gained * RECHARGE_MS,
  };
}

function bump(s: SaveData, counter: Counter, n = 1): SaveData {
  if (n <= 0) return s;
  const d = rollDay(s, Date.now()).daily;
  return { ...s, daily: { ...d, counts: { ...d.counts, [counter]: (d.counts[counter] ?? 0) + n } } };
}

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/** Ajoute de l'expérience ; chaque nouveau grade offre des dossiers. */
function gainXp(s: SaveData, n: number): SaveData {
  const xp = s.xp + n;
  const levels = gradeIndex(xp) - gradeIndex(s.xp);
  return { ...s, xp, boosters: s.boosters + Math.max(0, levels) * GRADE_BOOSTERS };
}

export function useSave() {
  const [save, setSave] = useState(() => recharge(load(), Date.now()));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setSave((s) => recharge(s, n));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* stockage indisponible (navigation privée…) */
    }
  }, [save]);

  /** Consomme un booster et ajoute ses cartes à la collection. */
  const spendBooster = useCallback((cards: Card[], secrets: boolean[], special = false) => {
    setSave((s) => {
      if (special ? s.daily.special : s.boosters <= 0) return s;
      const owned = { ...s.owned };
      const firstSeen = { ...s.firstSeen };
      const secret = { ...s.secret };
      const t = Date.now();
      let freshCount = 0;
      cards.forEach((c, i) => {
        if (!owned[c.id]) freshCount++;
        owned[c.id] = (owned[c.id] ?? 0) + 1;
        firstSeen[c.id] ??= t;
        if (secrets[i]) secret[c.id] = (secret[c.id] ?? 0) + 1;
      });
      const got = new Set(cards.map((c) => c.id));
      const wasFull = s.boosters >= MAX_BOOSTERS;
      let next: SaveData = {
        ...s,
        owned,
        firstSeen,
        secret,
        wanted: s.wanted.filter((id) => !got.has(id)),
        boosters: special ? s.boosters : s.boosters - 1,
        lastRecharge: wasFull && !special ? t : s.lastRecharge,
        opened: s.opened + 1,
        pity: cards.some((c) => c.rarity === "A") ? 0 : s.pity + 1,
        daily: special ? { ...s.daily, special: true } : s.daily,
      };
      next = bump(next, "opened");
      next = bump(next, "fresh", freshCount);
      next = bump(next, "rare", cards.filter((c) => rarityRank(c.rarity) >= rarityRank("C")).length);
      return gainXp(next, XP.opened + freshCount * XP.freshCard);
    });
  }, []);

  /** Agrafe les fiches d'un dossier lié : elles sont consommées. */
  const fuse = useCallback((link: Link) => {
    setSave((s) => {
      if (!canFuse(s, link)) return s;
      const owned = { ...s.owned };
      const secret = { ...s.secret };
      for (const c of link.members) {
        owned[c.id] -= 1;
        if ((secret[c.id] ?? 0) > owned[c.id]) secret[c.id] = owned[c.id];
      }
      return gainXp(
        bump(
          {
            ...s,
            owned,
            secret,
            linked: { ...s.linked, [link.id]: (s.linked[link.id] ?? 0) + 1 },
            linkedFirst: { ...s.linkedFirst, [link.id]: s.linkedFirst[link.id] ?? Date.now() },
          },
          "fused",
        ),
        XP.fused,
      );
    });
  }, []);

  /** Broie des doublons. Sans liste, broie tous les doublons de l'archive. */
  const shred = useCallback((ids?: number[]) => {
    setSave((s) => {
      const owned = { ...s.owned };
      let ink = 0;
      let count = 0;
      for (const id of ids ?? Object.keys(s.owned).map(Number)) {
        const card = CARD_BY_ID.get(id);
        const n = ids ? Math.min(1, shreddable(s, id)) : shreddable(s, id);
        if (!card || n <= 0) continue;
        owned[id] -= n;
        ink += n * SHRED_INK[card.rarity];
        count += n;
      }
      return count ? bump({ ...s, owned, ink: s.ink + ink }, "shredded", count) : s;
    });
  }, []);

  /** Dépense de l'encre pour obtenir une fiche précise. */
  const request = useCallback((card: Card) => {
    setSave((s) => {
      const cost = REQUEST_COST[card.rarity];
      if (s.ink < cost) return s;
      return bump(
        {
          ...s,
          ink: s.ink - cost,
          owned: { ...s.owned, [card.id]: (s.owned[card.id] ?? 0) + 1 },
          firstSeen: { ...s.firstSeen, [card.id]: s.firstSeen[card.id] ?? Date.now() },
          wanted: s.wanted.filter((id) => id !== card.id),
        },
        "requested",
      );
    });
  }, []);

  const toggleWanted = useCallback((id: number) => {
    setSave((s) => ({
      ...s,
      wanted: s.wanted.includes(id) ? s.wanted.filter((w) => w !== id) : [...s.wanted, id],
    }));
  }, []);

  /** Récupère la récompense d'une enquête terminée. */
  const claim = useCallback((missionId: string) => {
    setSave((s0) => {
      const s = rollDay(s0, Date.now());
      const m = missionsForDay(s.daily.day).find((x) => x.id === missionId);
      if (!m || s.daily.claimed.includes(m.id) || (s.daily.counts[m.counter] ?? 0) < m.goal) return s0;
      return gainXp(
        {
          ...s,
          boosters: s.boosters + (m.reward.boosters ?? 0),
          ink: s.ink + (m.reward.ink ?? 0),
          daily: { ...s.daily, claimed: [...s.daily.claimed, m.id] },
        },
        XP.mission,
      );
    });
  }, []);

  /** Récupère la récompense d'un album complet. */
  const claimAlbum = useCallback((series: string) => {
    setSave((s) => {
      const album = ALBUMS.find((a) => a.series === series);
      if (!album || s.albumsClaimed.includes(series)) return s;
      if (!album.cards.every((c) => (s.owned[c.id] ?? 0) > 0)) return s;
      return gainXp(
        {
          ...s,
          ink: s.ink + album.reward,
          boosters: s.boosters + album.bonusBoosters,
          albumsClaimed: [...s.albumsClaimed, series],
        },
        XP.album,
      );
    });
  }, []);

  /** Fusionne des doublons pour monter une fiche d'un niveau de prestige. */
  const upgradePrestige = useCallback((card: Card) => {
    setSave((s) => {
      if (!canPrestige(s, card.id)) return s;
      const level = s.prestige[card.id] ?? 0;
      return gainXp(
        {
          ...s,
          owned: { ...s.owned, [card.id]: s.owned[card.id] - prestigeCost(level) },
          prestige: { ...s.prestige, [card.id]: level + 1 },
        },
        XP.fused,
      );
    });
  }, []);

  /** Propose un personnage pour l'Affaire du jour. */
  const guessAffaire = useCallback((card: Card) => {
    setSave((s0) => {
      const s = rollDay(s0, Date.now());
      const a = s.daily.affaire;
      if (a.done || a.guesses.includes(card.id)) return s0;
      const target = suspectOfDay(s.daily.day);
      const guesses = [...a.guesses, card.id];
      const won = card.id === target.id;
      const done = won || guesses.length >= MAX_GUESSES;
      let next: SaveData = { ...s, daily: { ...s.daily, affaire: { guesses, done, won } } };
      if (won) {
        next = gainXp(
          {
            ...next,
            ink: next.ink + affaireReward(guesses.length),
            owned: { ...next.owned, [target.id]: (next.owned[target.id] ?? 0) + 1 },
            firstSeen: { ...next.firstSeen, [target.id]: next.firstSeen[target.id] ?? Date.now() },
          },
          XP.affaire,
        );
      }
      return next;
    });
  }, []);

  const setKeepOne = useCallback((keepOne: boolean) => setSave((s) => ({ ...s, keepOne })), []);

  const reset = useCallback(() => setSave(fresh()), []);

  const nextIn = save.boosters >= MAX_BOOSTERS ? 0 : Math.max(0, save.lastRecharge + RECHARGE_MS - now);

  return {
    save,
    spendBooster,
    fuse,
    shred,
    request,
    toggleWanted,
    claim,
    claimAlbum,
    guessAffaire,
    upgradePrestige,
    setKeepOne,
    reset,
    nextIn,
  };
}
