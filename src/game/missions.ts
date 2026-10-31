// Enquêtes du jour : trois missions tirées à partir de la date, identiques
// pour tous les joueurs ce jour-là. Elles se renouvellent à minuit.

export type Counter = "opened" | "fresh" | "rare" | "shredded" | "fused" | "requested";

export interface Mission {
  id: string;
  label: string;
  counter: Counter;
  goal: number;
  reward: { boosters?: number; ink?: number };
}

const POOL: Mission[] = [
  { id: "open-3", label: "Ouvrir 3 boosters", counter: "opened", goal: 3, reward: { ink: 15 } },
  { id: "open-6", label: "Ouvrir 6 boosters", counter: "opened", goal: 6, reward: { boosters: 1 } },
  { id: "fresh-3", label: "Obtenir 3 nouvelles cartes", counter: "fresh", goal: 3, reward: { ink: 20 } },
  {
    id: "rare-1",
    label: "Obtenir une carte Épique ou mieux",
    counter: "rare",
    goal: 1,
    reward: { ink: 15 },
  },
  {
    id: "rare-3",
    label: "Obtenir 3 cartes Épiques ou mieux",
    counter: "rare",
    goal: 3,
    reward: { boosters: 1 },
  },
  { id: "shred-5", label: "Broyer 5 doublons", counter: "shredded", goal: 5, reward: { ink: 10 } },
  { id: "shred-15", label: "Broyer 15 doublons", counter: "shredded", goal: 15, reward: { boosters: 1 } },
  { id: "fuse-1", label: "Réussir une fusion", counter: "fused", goal: 1, reward: { boosters: 1 } },
  { id: "request-1", label: "Faire une demande d'accès", counter: "requested", goal: 1, reward: { ink: 10 } },
];

/** Date locale du jour, au format AAAA-MM-JJ. */
export function dayKey(t: number) {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Trois missions différentes, sur trois compteurs différents. */
export function missionsForDay(day: string): Mission[] {
  const ranked = [...POOL].sort((a, b) => hash(day + a.id) - hash(day + b.id));
  const out: Mission[] = [];
  for (const m of ranked) {
    if (out.every((o) => o.counter !== m.counter)) out.push(m);
    if (out.length === 3) break;
  }
  return out;
}

export function formatReward(r: Mission["reward"]) {
  const parts: string[] = [];
  if (r.boosters) parts.push(`+${r.boosters} booster${r.boosters > 1 ? "s" : ""}`);
  if (r.ink) parts.push(`+${r.ink} encre`);
  return parts.join(", ");
}
