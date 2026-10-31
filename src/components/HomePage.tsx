import { useRef, useState, type ReactNode } from "react";
import { MAX_GUESSES } from "../game/affaire";
import { PITY_LIMIT } from "../game/booster";
import { SECRET_CHANCE } from "../game/economy";
import { XP } from "../game/grades";
import { formatReward, missionsForDay } from "../game/missions";
import { RARITIES } from "../game/rarities";
import { specialSeries } from "../game/series";
import { DAILY_INK, MAX_BOOSTERS, STREAK_BOOSTERS, STREAK_GOAL, type SaveData } from "../game/store";
import { formatDuration } from "../lib/format";
import { BoosterPack } from "./BoosterPack";
import { Hex } from "./Nav";

interface Props {
  save: SaveData;
  nextIn: number;
  readyAlbums: number;
  readyLinks: number;
  onOpen: (count: number) => void;
  onOpenSpecial: () => void;
  onShowAffaire: () => void;
  onShowAlbums: () => void;
  onShowLinks: () => void;
  onClaim: (missionId: string) => void;
}

const COUNTS = [1, 3, 5, 10];

/** Temps restant avant minuit, heure locale : « 5H 12 ». */
function untilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const min = Math.ceil((end.getTime() - now.getTime()) / 60000);
  return `${Math.floor(min / 60)}H ${String(min % 60).padStart(2, "0")}`;
}

function SideButton({
  label,
  icon,
  badge,
  dot,
  glow,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  badge?: number;
  dot?: boolean;
  glow?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`side-btn ${glow ? "is-glow" : ""}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {!!badge && <span className="side-badge">{badge}</span>}
      {!badge && dot && <span className="side-dot" />}
    </button>
  );
}

const ico = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    {d}
  </svg>
);

/** L'écran Boosters, façon jeu : booster au centre, raccourcis sur les côtés, réserve et ouverture en bas. */
export function HomePage({
  save,
  nextIn,
  readyAlbums,
  readyLinks,
  onOpen,
  onOpenSpecial,
  onShowAffaire,
  onShowAlbums,
  onShowLinks,
  onClaim,
}: Props) {
  const [count, setCount] = useState(1);
  const [rates, setRates] = useState(false);
  const missionsRef = useRef<HTMLElement>(null);
  const missions = missionsForDay(save.daily.day);
  const special = specialSeries(save.daily.day);
  const affaire = save.daily.affaire;
  const full = save.boosters >= MAX_BOOSTERS;
  const n = Math.min(count, save.boosters);
  const pityLeft = Math.max(1, PITY_LIMIT - save.pity);
  const streakDay = ((save.streak.days - 1) % STREAK_GOAL) + 1;
  const readyMissions = missions.filter(
    (m) => (save.daily.counts[m.counter] ?? 0) >= m.goal && !save.daily.claimed.includes(m.id),
  ).length;
  const totalWeight = RARITIES.reduce((s, r) => s + r.weight, 0);

  return (
    <div className="boosters">
      <button
        className={`event ${save.daily.special ? "is-used" : ""}`}
        onClick={onOpenSpecial}
        disabled={save.daily.special}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2l2.4 6.9H22l-6 4.6 2.3 7.1L12 16.3 5.7 20.6 8 13.5 2 8.9h7.6z" />
        </svg>
        <span className="event-text">Booster du jour · {special.series}</span>
        <span className="event-chip">{save.daily.special ? untilMidnight() : "Gratuit"}</span>
      </button>

      <section className="stage-home">
        <div className="side side-left">
          <SideButton
            label="Quêtes"
            badge={readyMissions}
            icon={ico(
              <>
                <rect x="6" y="4" width="12" height="16" rx="2" />
                <path d="M9 9h6M9 13h6M9 17h4" />
              </>,
            )}
            onClick={() => missionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
          <SideButton
            label="Enquête"
            dot={!affaire.done}
            icon={ico(
              <>
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20l-4.5-4.5" />
              </>,
            )}
            onClick={onShowAffaire}
          />
          <SideButton
            label="Albums"
            badge={readyAlbums}
            icon={ico(<path d="M4 5h7v14H4zM13 5h7v14h-7z" />)}
            onClick={onShowAlbums}
          />
        </div>

        <button
          className="booster-hero-btn"
          onClick={() => n > 0 && onOpen(n)}
          disabled={n <= 0}
          aria-label={`Ouvrir ${n} booster${n > 1 ? "s" : ""}`}
        >
          <BoosterPack stock={save.boosters} className="booster-hero" />
        </button>

        <div className="side side-right">
          <SideButton
            label="Coffre"
            glow={!save.daily.special}
            dot={!save.daily.special}
            icon={ico(
              <>
                <rect x="4" y="9" width="16" height="10" rx="1" />
                <path d="M4 9l2-4h12l2 4M12 12v3" />
              </>,
            )}
            onClick={onOpenSpecial}
          />
          <SideButton
            label="Duos"
            badge={readyLinks}
            icon={ico(
              <>
                <rect x="3" y="6" width="9" height="13" rx="1.5" />
                <rect x="12" y="4" width="9" height="13" rx="1.5" />
              </>,
            )}
            onClick={onShowLinks}
          />
          <SideButton
            label="Taux"
            icon={ico(
              <>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 11v5M12 8h.01" />
              </>,
            )}
            onClick={() => setRates(true)}
          />
        </div>
      </section>

      <section className="meter">
        <div className="meter-head label">
          <span className="is-gold">Iridescente garantie</span>
          <span>
            Dans {pityLeft} booster{pityLeft > 1 ? "s" : ""}
          </span>
        </div>
        <div className="meter-row">
          <span className="bar bar-gold">
            <span style={{ width: `${(save.pity / PITY_LIMIT) * 100}%` }} />
          </span>
          <Hex className="hex-mini hex-irid">I</Hex>
        </div>
      </section>

      <section className="meter">
        <div className="meter-head label">
          <span>
            Réserve <b className="is-cyan">{save.boosters}</b> / {MAX_BOOSTERS}
          </span>
          <span className="is-dim">
            {full ? (
              "Réserve pleine"
            ) : (
              <>
                +1 dans <b>{formatDuration(nextIn)}</b>
              </>
            )}
          </span>
        </div>
        <div className="segments" aria-label={`${save.boosters} boosters sur ${MAX_BOOSTERS}`}>
          {Array.from({ length: MAX_BOOSTERS }, (_, i) => (
            <span key={i} className={i < save.boosters ? "is-on" : i === save.boosters ? "is-next" : ""} />
          ))}
        </div>
      </section>

      <div className="counts">
        {COUNTS.map((c) => (
          <button
            key={c}
            className={count === c ? "is-active" : ""}
            onClick={() => setCount(c)}
            disabled={c > Math.max(1, save.boosters)}
            aria-pressed={count === c}
          >
            ×{c}
          </button>
        ))}
      </div>

      <button className="btn-game btn-cyan btn-open" onClick={() => onOpen(n)} disabled={n <= 0}>
        {n <= 0 ? `Prochain dans ${formatDuration(nextIn)}` : `Ouvrir ×${n}`}
      </button>

      <p className="home-note">
        Série de connexion : jour {streakDay}/{STREAK_GOAL} · +{STREAK_BOOSTERS} boosters au jour{" "}
        {STREAK_GOAL} · +{DAILY_INK} encre par jour
      </p>

      <button className={`panel affaire-teaser ${affaire.done ? "is-done" : ""}`} onClick={onShowAffaire}>
        <Hex className="hex-mini hex-cyan">?</Hex>
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
        <span className="chip-cta">{affaire.done ? "Voir" : "Jouer"}</span>
      </button>

      <section className="panel missions-panel" ref={missionsRef}>
        <div className="panel-head">
          <h2 className="title-serif">Quêtes du jour</h2>
          <span className="label is-dim">Nouvelles à minuit</span>
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
                <span className="bar bar-green" aria-hidden>
                  <span style={{ width: `${(done / m.goal) * 100}%` }} />
                </span>
                {claimed ? (
                  <span className="mission-done label">Récupérée</span>
                ) : (
                  <button
                    className="btn-game btn-green btn-sm"
                    disabled={!ready}
                    onClick={() => onClaim(m.id)}
                  >
                    {ready ? "Récupérer" : `${done}/${m.goal}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {rates && (
        <div
          className="sheet"
          onClick={() => setRates(false)}
          role="dialog"
          aria-modal
          aria-label="Taux d'obtention"
        >
          <div className="sheet-panel panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="title-serif">Taux d'obtention</h2>
            <p className="sheet-sub">Les mêmes pour tout le monde : rien ne s'achète.</p>
            <ul className="rates">
              {[...RARITIES].reverse().map((r) => (
                <li key={r.id} className={`r-${r.id}`}>
                  <Hex className="hex-mini hex-rarity">{r.short}</Hex>
                  <span>{r.name}</span>
                  <b>
                    {((r.weight / totalWeight) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                  </b>
                </li>
              ))}
              <li className="r-secret">
                <Hex className="hex-mini hex-rarity">S</Hex>
                <span>Version Top secret (par carte)</span>
                <b>{(SECRET_CHANCE * 100).toLocaleString("fr-FR")} %</b>
              </li>
            </ul>
            <p className="sheet-sub">
              La 5ᵉ carte de chaque booster est Rare ou mieux. Une Iridescente est garantie tous les{" "}
              {PITY_LIMIT} boosters au plus.
            </p>
            <button className="btn-game btn-cyan" onClick={() => setRates(false)}>
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
