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

/** Notes de l'accord final selon la rareté : plus c'est rare, plus c'est grand. */
const CHORD: Record<Rarity, number[]> = {
  E: [220, 277.2, 329.6],
  D: [246.9, 311.1, 370],
  C: [261.6, 329.6, 392, 523.3],
  B: [293.7, 370, 440, 587.3, 740],
  A: [329.6, 415.3, 493.9, 659.3, 830.6, 987.8],
};

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
export function clue(index: number) {
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
  // Une note qui monte à chaque indice
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = [392, 523.3, 659.3][index % 3];
  const og = c.createGain();
  og.gain.setValueAtTime(0.001, t + 0.3);
  og.gain.exponentialRampToValueAtTime(0.18, t + 0.32);
  og.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  o.connect(og);
  out(og);
  o.start(t + 0.3);
  o.stop(t + 1.5);
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

/** La carte atterrit : impact et grand accord, plus riche pour les fiches rares. */
export function land(rarity: Rarity) {
  const { ctx: c } = audio();
  const t = c.currentTime;
  kick(t, 1);
  CHORD[rarity].forEach((f, i) => {
    for (const detune of [-7, 7]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = detune;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(800, t);
      lp.frequency.exponentialRampToValueAtTime(4000, t + 0.3);
      const g = c.createGain();
      g.gain.setValueAtTime(0.001, t + i * 0.03);
      g.gain.exponentialRampToValueAtTime(0.07, t + i * 0.03 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      o.connect(lp).connect(g);
      out(g);
      o.start(t);
      o.stop(t + 3.6);
    }
  });
}

/** Coupe tout son en cours (fermeture de l'écran, bouton Passer). */
export function stopAll() {
  stopCharge?.();
  stopCharge = null;
}
