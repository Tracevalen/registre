import { useEffect, useState } from "react";
import { bestIndex, type Pull } from "../game/booster";
import type { Card } from "../game/cards";
import { RARITY_BY_ID, rarityRank } from "../game/rarities";
import * as sound from "../lib/sound";
import { BoosterPack } from "./BoosterPack";
import { Fiche } from "./Fiche";
import { GLOW, PackReveal } from "./PackReveal";

interface Props {
  pull: Pull;
  onClose: () => void;
  onShowCollection: () => void;
}

/**
 * pack : le booster fermé, on touche pour l'ouvrir.
 * cards : les cartes une par une, de la plus commune à la plus rare.
 * summary : les 5 cartes du booster. all : toutes les cartes de l'ouverture.
 */
type Stage = "pack" | "cards" | "summary" | "all";

/** La grande animation n'est jouée que pour une dernière carte Épique ou mieux (ou Top secret). */
const isBig = (card: Card, secret: boolean) => secret || rarityRank(card.rarity) >= rarityRank("C");

export function OpeningScreen({ pull, onClose, onShowCollection }: Props) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("pack");
  const [step, setStep] = useState(0);
  const [tearing, setTearing] = useState(false);
  const [muted, setMutedState] = useState(sound.isMuted);
  const total = pull.groups.length;
  const group = pull.groups[index];
  const best = bestIndex(group);
  const last = index === total - 1;
  // Ordre de révélation : de la plus commune à la plus rare (la meilleure en dernier).
  const order = group.cards.map((_, i) => i).reverse();
  const slot = order[step];
  const card = group.cards[slot];
  const secret = group.secret[slot];
  const lastStep = step === order.length - 1;

  useEffect(() => {
    sound.playMusic();
    return () => sound.fadeOutMusic(0.6);
  }, []);

  useEffect(() => {
    if (stage === "all" || (stage === "summary" && last)) sound.fadeOutMusic(1.8);
  }, [stage, last]);

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

  const nextCard = () => (lastStep ? setStage("summary") : setStep(step + 1));

  const nextBooster = () => {
    setIndex(index + 1);
    setStep(0);
    setStage("pack");
  };

  const tagFor = (cardId: number, isBest: boolean) =>
    pull.fresh.has(cardId) ? "Nouveau" : isBest ? "Meilleure carte" : undefined;

  const allCards = pull.groups
    .flatMap((g) => g.cards.map((c, i) => ({ card: c, secret: g.secret[i] })))
    .sort(
      (a, b) => rarityRank(b.card.rarity) - rarityRank(a.card.rarity) || Number(b.secret) - Number(a.secret),
    );

  const bestCard = group.cards[best];
  const ambient = stage === "cards" ? card : bestCard;

  return (
    <div className="opening" role="dialog" aria-modal aria-label="Ouverture de boosters">
      {/* Fond d'ambiance : l'image de la carte, très floue, teintée par sa rareté. */}
      {stage !== "pack" && stage !== "all" && (
        <div
          className="stage-bg"
          aria-hidden
          style={{
            backgroundImage: `url("${ambient.image}")`,
            ["--glow" as string]: GLOW[ambient.rarity],
          }}
        />
      )}

      <header className="opening-bar">
        <span>
          {stage === "all" ? `${total} booster${total > 1 ? "s" : ""}` : `Booster ${index + 1} sur ${total}`}
        </span>
        <button className="opening-sound" onClick={toggleSound} aria-pressed={!muted}>
          {muted ? "Son coupé" : "Son activé"}
        </button>
        <button className="opening-close" onClick={onClose}>
          Fermer
        </button>
      </header>

      {stage === "pack" && (
        <section className="stage stage-pack" onClick={tear}>
          <div className={`stage-pack-wrap ${tearing ? "is-tearing" : ""}`}>
            <BoosterPack number={pull.id + index} className="stage-pack-pack" />
          </div>
          <p className="stage-hint">{tearing ? "Ouverture…" : "Touche le booster pour l'ouvrir"}</p>
          {total > 1 && (
            <button
              className="btn stage-skip"
              onClick={(e) => {
                e.stopPropagation();
                setStage("all");
              }}
            >
              Tout passer
            </button>
          )}
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
          doneLabel="Voir le booster"
          onDone={() => setStage("summary")}
        />
      )}

      {stage === "cards" && !(lastStep && isBig(card, secret)) && (
        <section className="stage stage-card" onClick={nextCard}>
          <div className="stage-count">
            {order.map((s, i) => (
              <i
                key={s}
                className={`${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}`}
                style={{ ["--k" as string]: i <= step ? GLOW[group.cards[s].rarity] : undefined }}
              />
            ))}
          </div>

          <div className={`stage-flip class-${card.rarity}`} key={`${index}-${step}`}>
            <Fiche
              card={card}
              secret={secret}
              tag={pull.fresh.has(card.id) ? "Nouveau" : undefined}
              className="fiche-xl"
            />
          </div>

          <div className="stage-info" key={`i-${index}-${step}`}>
            <h2>{card.name}</h2>
            <p>
              {card.kind === "game" ? "Jeu" : "Personnage"} · {card.anime}
            </p>
            <span className={`rarity-pill class-${card.rarity}`}>{RARITY_BY_ID[card.rarity].name}</span>
          </div>

          <div className="stage-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-primary btn-wide" onClick={nextCard} autoFocus>
              {lastStep ? "Voir le booster" : `Carte suivante (${step + 2}/${order.length})`}
            </button>
            <button className="btn btn-wide" onClick={() => setStage("summary")}>
              Passer au résumé
            </button>
          </div>
        </section>
      )}

      {stage === "summary" && (
        <section className="summary">
          <div className="summary-head">
            <h2>
              Booster {index + 1} sur {total}
            </h2>
            <p>{group.cards.length} cartes obtenues</p>
          </div>

          <div className="summary-best">
            <Fiche
              card={bestCard}
              secret={group.secret[best]}
              tag={tagFor(bestCard.id, false)}
              className="fiche-lg"
            />
            <p className="summary-name">{bestCard.name}</p>
            <p className="summary-sub">{bestCard.anime}</p>
            <span className={`rarity-pill class-${bestCard.rarity}`}>
              {RARITY_BY_ID[bestCard.rarity].name}
            </span>
          </div>

          <div className="summary-rest">
            {group.cards.map((c, i) =>
              i === best ? null : (
                <div key={i} className="summary-small">
                  <Fiche
                    card={c}
                    secret={group.secret[i]}
                    tag={pull.fresh.has(c.id) ? "Nouveau" : undefined}
                  />
                  <span className={`rarity-dot class-${c.rarity}`} title={RARITY_BY_ID[c.rarity].name} />
                </div>
              ),
            )}
          </div>

          <div className="summary-actions">
            {last ? (
              <>
                <button className="btn btn-primary btn-wide" onClick={onClose} autoFocus>
                  Terminer
                </button>
                <button className="btn btn-wide" onClick={onShowCollection}>
                  Voir ma collection
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-wide" onClick={nextBooster} autoFocus>
                  Booster suivant
                </button>
                <button className="btn btn-wide" onClick={() => setStage("all")}>
                  Tout passer
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {stage === "all" && (
        <section className="summary">
          <div className="summary-head">
            <h2>{allCards.length} cartes obtenues</h2>
            <p>
              {total} booster{total > 1 ? "s" : ""}, de la plus rare à la plus commune
            </p>
          </div>
          <div className="summary-grid">
            {allCards.map(({ card: c, secret: s }, i) => (
              <Fiche key={i} card={c} secret={s} tag={tagFor(c.id, i === 0)} />
            ))}
          </div>
          <div className="summary-actions">
            <button className="btn btn-primary btn-wide" onClick={onClose} autoFocus>
              Terminer
            </button>
            <button className="btn btn-wide" onClick={onShowCollection}>
              Voir ma collection
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
