import { useState } from "react";
import { MAX_GUESSES } from "../game/affaire";
import { PITY_LIMIT } from "../game/booster";
import { XP } from "../game/grades";
import { formatReward, missionsForDay } from "../game/missions";
import { specialSeries } from "../game/series";
import {
  DAILY_INK,
  MAX_BOOSTERS,
  RECHARGE_MS,
  STREAK_BOOSTERS,
  STREAK_GOAL,
  type SaveData,
} from "../game/store";
import { formatDuration } from "../lib/format";
import { BoosterPack } from "./BoosterPack";

interface Props {
  save: SaveData;
  nextIn: number;
  onOpen: (count: number) => void;
  onOpenSpecial: () => void;
  onShowAffaire: () => void;
  onClaim: (missionId: string) => void;
}

const COUNTS = [1, 3, 5, 10];

/** L'écran Boosters : le stock, le minuteur, le choix du nombre de boosters, puis le reste du jour. */
export function HomePage({ save, nextIn, onOpen, onOpenSpecial, onShowAffaire, onClaim }: Props) {
  const [count, setCount] = useState(3);
  const missions = missionsForDay(save.daily.day);
  const special = specialSeries(save.daily.day);
  const affaire = save.daily.affaire;
  const full = save.boosters >= MAX_BOOSTERS;
  const n = Math.min(count, save.boosters);
  // Temps avant que le stock soit plein : le prochain booster, puis un toutes les RECHARGE_MS.
  const toFull = full ? 0 : nextIn + (MAX_BOOSTERS - save.boosters - 1) * RECHARGE_MS;
  const ring = save.boosters / MAX_BOOSTERS;
  const streakDay = ((save.streak.days - 1) % STREAK_GOAL) + 1;

  return (
    <div className="boosters">
      <section className="booster-stage">
        <BoosterPack className="booster-hero" />

        <div className="glass timer">
          <div className="timer-ring" style={{ ["--p" as string]: ring }}>
            <span>{save.boosters}</span>
          </div>
          <div className="timer-text">
            <span className="timer-label">{full ? "Stock plein" : "Prochain booster"}</span>
            <strong className="timer-time">
              {full ? `${MAX_BOOSTERS}/${MAX_BOOSTERS}` : formatDuration(nextIn)}
            </strong>
            <span className="timer-sub">
              {full
                ? "Ouvre-en pour relancer le minuteur"
                : `Plein à ${MAX_BOOSTERS} boosters dans ${formatLong(toFull)}`}
            </span>
          </div>
        </div>

        <div className="count-picker" role="group" aria-label="Nombre de boosters à ouvrir">
          {COUNTS.map((c) => (
            <button
              key={c}
              className={count === c ? "is-active" : ""}
              onClick={() => setCount(c)}
              aria-pressed={count === c}
            >
              {c}
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-wide btn-open" onClick={() => onOpen(n)} disabled={n <= 0}>
          {n <= 0
            ? `Prochain booster dans ${formatDuration(nextIn)}`
            : `Ouvrir ${n} booster${n > 1 ? "s" : ""}${n < count ? ` (stock : ${save.boosters})` : ""}`}
        </button>

        <p className="booster-note">
          Carte Iridescente garantie dans {Math.max(1, PITY_LIMIT - save.pity)} booster
          {PITY_LIMIT - save.pity > 1 ? "s" : ""} · Série de connexion J{streakDay}/{STREAK_GOAL}
        </p>
      </section>

      <section className={`glass special ${save.daily.special ? "is-used" : ""}`}>
        <div className="special-copy">
          <p className="eyebrow">Booster du jour · gratuit</p>
          <h2 className="special-title">{special.series}</h2>
          <p className="special-lede">
            5 cartes tirées uniquement dans cette saga, dont une Épique ou mieux.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenSpecial} disabled={save.daily.special}>
          {save.daily.special ? "Déjà ouvert, revient demain" : "Ouvrir"}
        </button>
      </section>

      <button className={`glass affaire-teaser ${affaire.done ? "is-done" : ""}`} onClick={onShowAffaire}>
        <span className="affaire-teaser-mark" aria-hidden>
          ?
        </span>
        <span className="affaire-teaser-text">
          <strong>Enquête du jour</strong>
          <span>
            {affaire.done
              ? affaire.won
                ? `Résolue en ${affaire.guesses.length}/${MAX_GUESSES}. Nouvelle énigme demain.`
                : "Non résolue. Nouvelle énigme demain."
              : `Trouve la carte mystère en ${MAX_GUESSES} essais : elle rejoint ta collection, avec ${XP.affaire} XP.`}
          </span>
        </span>
        <span className="affaire-teaser-cta">{affaire.done ? "Voir" : "Jouer"}</span>
      </button>

      <section className="glass missions-panel">
        <div className="panel-head">
          <h2>Missions du jour</h2>
          <span>Nouvelles missions à minuit</span>
        </div>
        <ul className="missions">
          {missions.map((m) => {
            const done = Math.min(save.daily.counts[m.counter] ?? 0, m.goal);
            const claimed = save.daily.claimed.includes(m.id);
            const ready = done >= m.goal && !claimed;
            return (
              <li key={m.id} className={`mission ${ready ? "is-ready" : ""} ${claimed ? "is-claimed" : ""}`}>
                <div className="mission-text">
                  <strong>{m.label}</strong>
                  <span>{formatReward(m.reward)}</span>
                </div>
                <span className="mission-track" aria-hidden>
                  <span className="mission-fill" style={{ width: `${(done / m.goal) * 100}%` }} />
                </span>
                {claimed ? (
                  <span className="mission-done">Récupérée</span>
                ) : (
                  <button className="btn btn-sm btn-primary" disabled={!ready} onClick={() => onClaim(m.id)}>
                    {ready ? "Récupérer" : `${done}/${m.goal}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="booster-note">
          +{DAILY_INK} encre à chaque première visite du jour · +{STREAK_BOOSTERS} boosters tous les{" "}
          {STREAK_GOAL} jours de série
        </p>
      </section>
    </div>
  );
}

/** Durée lisible : « 42 min » ou « 1 h 12 ». */
function formatLong(ms: number) {
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
