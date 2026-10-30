export const formatDuration = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const formatDate = (t: number) =>
  new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
