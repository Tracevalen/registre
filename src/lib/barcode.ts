// Code-barres décoratif, déterministe à partir d'un nombre (pas un vrai standard).

// Largeurs barre/espace pour chaque chiffre : 4 modules par chiffre.
const DIGITS = [
  [3, 2, 1, 1],
  [2, 2, 2, 1],
  [2, 1, 2, 2],
  [1, 4, 1, 1],
  [1, 1, 3, 2],
  [1, 2, 3, 1],
  [1, 1, 1, 4],
  [1, 3, 1, 2],
  [1, 2, 1, 3],
  [3, 1, 1, 2],
];

export interface Bar {
  x: number;
  w: number;
}

/** Renvoie les barres et la largeur totale, en modules. */
export function barcode(value: number, digits = 7): { bars: Bar[]; width: number } {
  const code = String(value).padStart(digits, "0");
  const widths = [1, 1, 1, 1]; // garde de début
  for (const d of code) widths.push(...DIGITS[Number(d)]);
  widths.push(1, 1, 1, 1); // garde de fin

  const bars: Bar[] = [];
  let x = 0;
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  });
  return { bars, width: x };
}
