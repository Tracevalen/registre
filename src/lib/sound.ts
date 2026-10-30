// Bande-son du pack opening, synthétisée en direct avec la Web Audio API :
// aucune musique sous droits, aucun fichier à charger.

import type { Rarity } from "../game/rarities";

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
  if (muted) master?.gain.setTargetAtTime(0, ctx!.currentTime, 0.05);
  else master?.gain.setTargetAtTime(0.7, ctx!.currentTime, 0.05);
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;

/** Crée le contexte audio (à appeler pendant un clic, sinon le navigateur le bloque). */
function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = isMuted() ? 0 : 0.7;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, master: master!, reverb: reverb! };
}

function impulse(c: AudioContext, seconds: number) {
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.5;
  }
  return buf;
}

function noise(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Envoie un son à la fois en direct et dans la réverbération. */
function out(node: AudioNode) {
  const { master: m, reverb: r } = audio();
  node.connect(m);
  node.connect(r);
}

let stopCharge: (() => void) | null = null;

/** Montée en tension : souffle qui monte, nappe grave et battements qui accélèrent. */
export function charge(seconds: number) {
  const { ctx: c } = audio();
  const t = c.currentTime;
  const end = t + seconds;

  const n = noise(c, seconds + 0.5);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(200, t);
  bp.frequency.exponentialRampToValueAtTime(4000, end);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.001, t);
  ng.gain.exponentialRampToValueAtTime(0.35, end);
  n.connect(bp).connect(ng);
  out(ng);
  n.start(t);
  n.stop(end + 0.1);

  const drone = c.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(55, t);
  drone.frequency.exponentialRampToValueAtTime(110, end);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(200, t);
  lp.frequency.exponentialRampToValueAtTime(1800, end);
  const dg = c.createGain();
  dg.gain.setValueAtTime(0.001, t);
  dg.gain.exponentialRampToValueAtTime(0.25, end);
  drone.connect(lp).connect(dg);
  out(dg);
  drone.start(t);
  drone.stop(end + 0.1);

  // Battements de cœur de plus en plus rapprochés
  let beat = t + 0.1;
  let gap = 0.55;
  while (beat < end - 0.05) {
    kick(beat, 0.5);
    beat += gap;
    gap = Math.max(0.12, gap * 0.82);
  }

  stopCharge = () => {
    ng.gain.cancelScheduledValues(c.currentTime);
    dg.gain.cancelScheduledValues(c.currentTime);
    ng.gain.setTargetAtTime(0, c.currentTime, 0.02);
    dg.gain.setTargetAtTime(0, c.currentTime, 0.02);
  };
}

function kick(at: number, level: number) {
  const { ctx: c, master: m } = audio();
  const o = c.createOscillator();
  o.frequency.setValueAtTime(140, at);
  o.frequency.exponentialRampToValueAtTime(40, at + 0.25);
  const g = c.createGain();
  g.gain.setValueAtTime(level, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.35);
  o.connect(g).connect(m);
  o.start(at);
  o.stop(at + 0.4);
}

/** Explosion : gros impact grave et souffle. */
export function burst() {
  stopCharge?.();
  stopCharge = null;
  const { ctx: c } = audio();
  const t = c.currentTime;
  kick(t, 1);
  const n = noise(c, 1.5);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(6000, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
  const g = c.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  n.connect(lp).connect(g);
  out(g);
  n.start(t);
}

/** Apparition d'un indice : souffle rapide et coup de tambour. */
export function clue() {
  const { ctx: c } = audio();
  const t = c.currentTime;
  const n = noise(c, 0.5);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(600, t);
  bp.frequency.exponentialRampToValueAtTime(5000, t + 0.3);
  const g = c.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  n.connect(bp).connect(g);
  out(g);
  n.start(t);
  kick(t + 0.3, 0.8);
}

/** La carte tourne : arpège scintillant qui monte. */
export function spin(seconds: number) {
  const { ctx: c } = audio();
  const t = c.currentTime;
  const notes = [523.3, 659.3, 784, 1046.5, 1318.5, 1568, 2093];
  notes.forEach((f, i) => {
    const at = t + (i / notes.length) * seconds * 0.85;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.6);
    o.connect(g);
    out(g);
    o.start(at);
    o.stop(at + 0.7);
  });
}

/** La carte atterrit : impact et coup de cymbale, plus long pour les fiches rares. */
export function land(rarity: Rarity) {
  const { ctx: c } = audio();
  const t = c.currentTime;
  kick(t, 1);
  const tail = { E: 0.8, D: 1, C: 1.4, B: 1.9, A: 2.6 }[rarity];
  const n = noise(c, tail + 0.2);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 5000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + tail);
  n.connect(hp).connect(g);
  out(g);
  n.start(t);
}

/** Coupe tout son en cours (fermeture de l'écran, bouton Passer). */
export function stopAll() {
  stopCharge?.();
  stopCharge = null;
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
