import { useEffect, useState } from "react";
import { type Pull } from "../game/booster";
import type { Card } from "../game/cards";
import { GRADE_BOOSTERS, gradeInfo, XP } from "../game/grades";
import { RARITY_BY_ID, rarityRank } from "../game/rarities";
import * as sound from "../lib/sound";
import { BoosterPack } from "./BoosterPack";
import { Fiche } from "./Fiche";
import { Hex } from "./Nav";
import { PackReveal } from "./PackReveal";

interface Props {
  pull: Pull;
  /** Expérience du joueur après cette ouverture. */
  xp: number;
  /** Boosters encore en stock. */
  boosters: number;
  onClose: () => void;
  onShowCollection: () => void;
  onAgain: (count: number) => void;
}

/**
 * pack : le booster fermé, on le touche pour l'ouvrir.
 * cards : les cartes une par une, de la plus commune à la plus rare.
 * rewards : toutes les cartes de l'ouverture.
 */
type Stage = "pack" | "cards" | "rewards";

/** La grande animation n'est jouée que pour une dernière carte Épique ou mieux (ou Top secret). */
const isBig = (card: Card, secret: boolean) => secret || rarityRank(card.rarity) >= rarityRank("C");

const Ornament = () => (
  <svg className="ornament" viewBox="0 0 220 18" aria-hidden>
    <path d="M0 9h96M124 9h96" />
    <path d="M70 9l10-5 10 5-10 5z" className="o-dim" />
    <path d="M130 9l10-5 10 5-10 5z" className="o-dim" />
    <rect x="105" y="4" width="10" height="10" transform="rotate(45 110 9)" />
  </svg>
);

const Ring = () => (
  <svg className="halo-ring" viewBox="0 0 360 360" aria-hidden>
    <circle cx="180" cy="180" r="172" className="r1" />
    <circle cx="180" cy="180" r="160" className="r2" />
    <polygon points="315,180 247.5,63.1 112.5,63.1 45,180 112.5,296.9 247.5,296.9" className="r3" />
    <polygon
      points="315,180 247.5,63.1 112.5,63.1 45,180 112.5,296.9 247.5,296.9"
      className="r4"
      transform="rotate(30 180 180)"
    />
    <circle cx="180" cy="180" r="118" className="r4" />
    <rect x="176" y="4" width="8" height="8" transform="rotate(45 180 8)" />
    <rect x="176" y="348" width="8" height="8" transform="rotate(45 180 352)" />
    <rect x="4" y="176" width="8" height="8" transform="rotate(45 8 180)" />
    <rect x="348" y="176" width="8" height="8" transform="rotate(45 352 180)" />
  </svg>
);

export function OpeningScreen({ pull, xp, boosters, onClose, onShowCollection, onAgain }: Props) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("pack");
  const [step, setStep] = useState(0);
  const [tearing, setTearing] = useState(false);
  const [muted, setMutedState] = useState(sound.isMuted);
  const total = pull.groups.length;
  const group = pull.groups[index];
  // Ordre de révélation : de la plus commune à la plus rare (la meilleure en dernier).
  const order = group.cards.map((_, i) => i).reverse();
  const slot = order[step];
  const card = group.cards[slot];
  const secret = group.secret[slot];
  const lastStep = step === order.length - 1;
  const lastBooster = index === total - 1;

  useEffect(() => {
    sound.playMusic();
    return () => sound.fadeOutMusic(0.6);
  }, []);

  useEffect(() => {
    if (stage === "rewards") sound.fadeOutMusic(1.8);
  }, [stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleSound = () => {
    sound.setMuted(!muted);
    sound.syncMusicMute();
    setMutedState(!muted);
  };

  const tear = () => {
    if (tearing) return;
    setTearing(true);
    setTimeout(() => {
      setTearing(false);
      setStep(0);
      setStage("cards");
    }, 650);
  };

  const next = () => {
    if (!lastStep) return setStep(step + 1);
    if (lastBooster) return setStage("rewards");
    setIndex(index + 1);
    setStep(0);
    setStage("pack");
  };

  const all = pull.groups
    .flatMap((g) => g.cards.map((c, i) => ({ card: c, secret: g.secret[i] })))
    .sort(
      (a, b) =>
        rarityRank(b.card.rarity) - rarityRank(a.card.rarity) ||
        Number(b.secret) - Number(a.secret) ||
        b.card.favourites - a.card.favourites,
    );
  // Une carte compte comme « nouvelle » une seule fois, même tirée deux fois.
  const shownFresh = new Set<number>();
  const freshTag = (c: Card) => {
    if (!pull.fresh.has(c.id) || shownFresh.has(c.id)) return undefined;
    shownFresh.add(c.id);
    return "Nouvelle";
  };
  const epicPlus = all.filter((x) => rarityRank(x.card.rarity) >= rarityRank("C")).length;
  const doubles = all.length - pull.fresh.size;
  const gained = XP.opened * total + XP.freshCard * pull.fresh.size;
  const before = gradeInfo(Math.max(0, xp - gained));
  const after = gradeInfo(xp);
  const levelUp = after.index > before.index;
  const r = RARITY_BY_ID[card.rarity];

  return (
    <div
      className={`opening theme-${stage === "rewards" ? "violet" : "gold"}`}
      role="dialog"
      aria-modal
      aria-label="Ouverture de boosters"
    >
      <header className="op-bar">
        <button className="square-btn" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="label">
          {stage === "rewards"
            ? `${total} booster${total > 1 ? "s" : ""} · ${all.length} cartes`
            : `Booster ${index + 1} / ${total}`}
        </span>
        {stage === "rewards" ? (
          <button className="pill-btn" onClick={toggleSound} aria-pressed={!muted}>
            {muted ? "Son coupé" : "Son"}
          </button>
        ) : (
          <button className="pill-btn" onClick={() => setStage("rewards")}>
            Passer ›
          </button>
        )}
      </header>

      {stage === "pack" && (
        <section className="op-stage op-pack" onClick={tear}>
          <h2 className="title-serif title-glow">Booster {index + 1}</h2>
          <Ornament />
          <div className={`op-pack-wrap ${tearing ? "is-tearing" : ""}`}>
            <Ring />
            <BoosterPack number={pull.id + index} className="op-pack-pack" />
          </div>
          <p className="op-hint label">{tearing ? "Ouverture…" : "Touche le booster pour l'ouvrir"}</p>
        </section>
      )}

      {stage === "cards" && lastStep && isBig(card, secret) && (
        <PackReveal
          key={`${index}-big`}
          card={card}
          secret={secret}
          fresh={pull.fresh.has(card.id)}
          dossierNumber={pull.id + index}
          intro="back"
          doneLabel={lastBooster ? "Récompenses" : "Booster suivant"}
          onDone={next}
        />
      )}

      {stage === "cards" && !(lastStep && isBig(card, secret)) && (
        <section className={`op-stage op-card r-${card.rarity}`} onClick={next}>
          <h2 className="title-serif title-rarity" key={`t-${index}-${step}`}>
            {secret ? "Top secret" : r.name}
          </h2>
          <Ornament />
          <div className="op-card-zone">
            <Ring />
            <div className="op-flip" key={`${index}-${step}`}>
              <Fiche
                card={card}
                secret={secret}
                tag={pull.fresh.has(card.id) ? "Nouvelle !" : undefined}
                sub="saga"
                className="carte-xl"
              />
            </div>
          </div>
          <p className="label op-count">
            Carte {step + 1} / {order.length}
          </p>
          <div className="mini-row" aria-label="Cartes du booster">
            {order.map((s, i) => {
              const c = group.cards[s];
              return i <= step ? (
                <span key={s} className={`mini r-${c.rarity} ${i === step ? "is-current" : ""}`}>
                  {RARITY_BY_ID[c.rarity].short}
                </span>
              ) : (
                <span key={s} className="mini is-hidden">
                  ?
                </span>
              );
            })}
          </div>
          <div className="op-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn-game btn-outline" onClick={() => setStage("rewards")}>
              Tout révéler
            </button>
            <button className="btn-game btn-gold" onClick={next} autoFocus>
              {lastStep ? (lastBooster ? "Récompenses" : "Booster suivant") : "Suivante"}
            </button>
          </div>
        </section>
      )}

      {stage === "rewards" && (
        <section className="op-rewards">
          <h2 className="title-serif title-glow">Récompenses</h2>
          <Ornament />

          <div className="panel level-panel">
            <Hex className="hex-level hex-violet">{after.index + 1}</Hex>
            <div className="level-text">
              <div className="label level-head">
                <span className="is-violet">{levelUp ? "Niveau supérieur !" : after.current.name}</span>
                <span className="is-cyan">+{gained} XP</span>
              </div>
              <span className="bar bar-violet">
                <span style={{ width: `${after.progress * 100}%` }} />
              </span>
              <span className="level-sub">
                {levelUp
                  ? `Nouveau grade : ${after.current.name}. Récompense : ${GRADE_BOOSTERS} booster offert.`
                  : after.next
                    ? `${after.next.xp - xp} XP avant ${after.next.name}`
                    : "Grade maximal"}
              </span>
            </div>
          </div>

          <div className="stat-row">
            <div className="panel stat">
              <strong>{pull.fresh.size}</strong>
              <span className="label">Nouvelles</span>
            </div>
            <div className="panel stat is-gold">
              <strong>{epicPlus}</strong>
              <span className="label">Épique ou +</span>
            </div>
            <div className="panel stat">
              <strong>{doubles}</strong>
              <span className="label">Doublons</span>
            </div>
          </div>

          <div className="reward-grid">
            {all.map(({ card: c, secret: s }, i) => (
              <Fiche key={i} card={c} secret={s} tag={freshTag(c)} />
            ))}
          </div>

          <div className="op-actions op-actions-sticky">
            <button className="btn-game btn-outline" onClick={onShowCollection}>
              Collection
            </button>
            <button
              className="btn-game btn-violet"
              onClick={() => onAgain(Math.min(total, boosters))}
              disabled={boosters <= 0}
            >
              {boosters > 0 ? "Ouvrir encore" : "Plus de booster"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
