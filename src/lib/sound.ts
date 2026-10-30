// Musique de l'écran d'ouverture des dossiers.

const MUTE_KEY = "registre-son-coupe";

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* stockage indisponible : le réglage vaut pour cette visite seulement */
  }
}

// ---------- Musique de l'ouverture (extrait de « Killcam », 0:58 à 1:08) ----------

let music: HTMLAudioElement | null = null;
let fadeTimer: ReturnType<typeof setInterval> | undefined;
const MUSIC_VOLUME = 0.8;

/** Lance la musique depuis le début de l'extrait. */
export function playMusic() {
  clearInterval(fadeTimer);
  if (!music) {
    music = new Audio("./sons/ouverture.mp3");
    music.preload = "auto";
  }
  music.currentTime = 0;
  music.volume = isMuted() ? 0 : MUSIC_VOLUME;
  void music.play().catch(() => {
    /* lecture refusée par le navigateur : l'animation continue sans musique */
  });
}

/** Baisse la musique jusqu'au silence, puis l'arrête. */
export function fadeOutMusic(seconds = 1.2) {
  const m = music;
  if (!m || m.paused) return;
  clearInterval(fadeTimer);
  const step = m.volume / (seconds * 20);
  fadeTimer = setInterval(() => {
    m.volume = Math.max(0, m.volume - step);
    if (m.volume <= 0) {
      clearInterval(fadeTimer);
      m.pause();
    }
  }, 50);
}

/** Applique le bouton « Son coupé » à la musique en cours. */
export function syncMusicMute() {
  if (music) music.volume = isMuted() ? 0 : MUSIC_VOLUME;
}
