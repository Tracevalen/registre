import { useState } from "react";
import { MAX_GUESSES } from "../game/affaire";
import { PITY_LIMIT } from "../game/booster";
import { XP } from "../game/grades";
import { formatReward, missionsForDay } from "../game/missions";
import { specialSeries } from "../game/series";
import { DAILY_INK, STREAK_BOOSTERS, STREAK_GOAL, type SaveData } from "../game/store";
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

/** L'écran Boosters : le booster à toucher (le nombre se choisit ensuite), puis le reste du jour. */
export function HomePage({ save, nextIn, onOpen, onOpenSpecial, onShowAffaire, onClaim }: Props) {
  const [count, setCount] = useState(1);
  const [picking, setPicking] = useState(false);
  const missions = missionsForDay(save.daily.day);
  const special = specialSeries(save.daily.day);
  const affaire = save.daily.affaire;
  const n = Math.min(count, save.boosters);
  const streakDay = ((save.streak.days - 1) % STREAK_GOAL) + 1;

  return (
    <div className="boosters">
      <section className="booster-stage">
        <button
          className="booster-hero-btn"
          onClick={() => {
            // Le dernier choix reste, sauf s'il dépasse le stock.
            if (count > save.boosters) setCount(1);
            setPicking(true);
          }}
          aria-label="Ouvrir des boosters"
        >
          <BoosterPack className="booster-hero" />
          {save.boosters > 0 && <span className="booster-badge">{save.boosters}</span>}
        </button>
        <p className="booster-cta">
          {save.boosters > 0
            ? "Touche le booster pour l'ouvrir"
            : `Prochain booster dans ${formatDuration(nextIn)}`}
        </p>
        <p className="booster-note">
          Carte Iridescente garantie dans {Math.max(1, PITY_LIMIT - save.pity)} booster
          {PITY_LIMIT - save.pity > 1 ? "s" : ""} · Série de connexion J{streakDay}/{STREAK_GOAL}
        </p>
      </section>

      {picking && (
        <div
          className="sheet"
          onClick={() => setPicking(false)}
          role="dialog"
          aria-modal
          aria-label="Combien de boosters ?"
        >
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <span className="sheet-grip" aria-hidden />
            <h2>Combien de boosters ?</h2>
            <p className="sheet-sub">
              {save.boosters > 0
                ? `Tu en as ${save.boosters} en stock.`
                : `Plus de booster : le prochain arrive dans ${formatDuration(nextIn)}.`}
            </p>
            <div className="sheet-counts">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  className={`sheet-count ${count === c ? "is-active" : ""}`}
                  onClick={() => setCount(c)}
                  disabled={c > save.boosters}
                  aria-pressed={count === c}
                >
                  <strong>×{c}</strong>
                  <span>{c * 5} cartes</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-wide btn-open"
              disabled={n <= 0}
              onClick={() => {
                setPicking(false);
                onOpen(n);
              }}
            >
              {n <= 0 ? "Aucun booster disponible" : `Ouvrir ${n} booster${n > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

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
