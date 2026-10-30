// Grades d'enquêteur : chaque action rapporte de l'expérience.

export const XP = {
  opened: 10,
  freshCard: 5,
  fused: 30,
  album: 60,
  affaire: 40,
  mission: 15,
} as const;

export interface Grade {
  name: string;
  xp: number;
}

export const GRADES: Grade[] = [
  { name: "Stagiaire", xp: 0 },
  { name: "Agent", xp: 200 },
  { name: "Enquêteur", xp: 600 },
  { name: "Inspecteur", xp: 1500 },
  { name: "Lieutenant", xp: 3500 },
  { name: "Commissaire", xp: 7000 },
  { name: "Directeur", xp: 12000 },
];

/** Dossiers offerts à chaque nouveau grade. */
export const GRADE_BOOSTERS = 1;

export function gradeIndex(xp: number) {
  let i = 0;
  while (i + 1 < GRADES.length && xp >= GRADES[i + 1].xp) i++;
  return i;
}

export function gradeInfo(xp: number) {
  const i = gradeIndex(xp);
  const current = GRADES[i];
  const next = GRADES[i + 1];
  const progress = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { index: i, current, next, progress };
}
