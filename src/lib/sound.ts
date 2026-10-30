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

// ---------- Musique de l'ouverture : boucle de 4 mesures de « Killcam » ----------
// Lue avec la Web Audio API, qui enchaîne la boucle sans aucun blanc :
// la musique tourne tant que le joueur n'a pas ouvert son dossier.

const MUSIC_URL = "./sons/ouverture.wav";
const MUSIC_VOLUME = 0.8;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
/** Boucle en train de s'éteindre, coupée net si une nouvelle ouverture commence. */
let fading: AudioBufferSourceNode | null = null;
let buffer: Promise<AudioBuffer | null> | null = null;
let playing = false;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { c: ctx, g: gain! };
}

function load(c: AudioContext) {
  buffer ??= fetch(MUSIC_URL)
    .then((r) => r.arrayBuffer())
    .then((data) => c.decodeAudioData(data))
    .catch(() => null);
  return buffer;
}

/** Lance la musique en boucle, avec une courte montée du volume. */
export function playMusic() {
  const { c, g } = audio();
  playing = true;
  try {
    fading?.stop();
  } catch {
    /* déjà arrêtée */
  }
  fading = null;
  void load(c).then((buf) => {
    if (!buf || !playing) return;
    source?.stop();
    source = c.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(g);
    g.gain.cancelScheduledValues(c.currentTime);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(isMuted() ? 0 : MUSIC_VOLUME, c.currentTime + 0.4);
    source.start();
  });
}

/** Baisse la musique jusqu'au silence en `seconds`, puis l'arrête. */
export function fadeOutMusic(seconds = 1.5) {
  playing = false;
  if (!ctx || !gain || !source) return;
  const s = source;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + seconds);
  s.stop(now + seconds + 0.05);
  fading = s;
  source = null;
}

/** Applique le bouton « Son coupé » à la musique en cours. */
export function syncMusicMute() {
  if (!ctx || !gain || !playing) return;
  gain.gain.setTargetAtTime(isMuted() ? 0 : MUSIC_VOLUME, ctx.currentTime, 0.05);
}
