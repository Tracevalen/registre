import { useEffect, useState } from "react";
import { bestIndex, type Pull } from "../game/booster";
import { RARITY_BY_ID, rarityRank } from "../game/rarities";
import * as sound from "../lib/sound";
import { Fiche } from "./Fiche";
import { PackReveal } from "./PackReveal";

interface Props {
  pull: Pull;
  onClose: () => void;
  onShowCollection: () => void;
}

type Stage = "reveal" | "summary" | "all";

/**
 * Ouverture booster par booster : la révélation de la meilleure carte, puis le résumé
 * du booster (grande carte et les 4 autres). « Tout passer » montre toutes les cartes d'un coup.
 */
export function OpeningScreen({ pull, onClose, onShowCollection }: Props) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("reveal");
  const [muted, setMutedState] = useState(sound.isMuted);
  const total = pull.groups.length;
  const group = pull.groups[index];
  const best = bestIndex(group);
  const bestCard = group.cards[best];
  const last = index === total - 1;

  // La musique tourne pendant toutes les ouvertures, et s'éteint au dernier booster révélé.
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

  const next = () => {
    setIndex(index + 1);
    setStage("reveal");
  };

  const tagFor = (cardId: number, isBest: boolean) =>
    pull.fresh.has(cardId) ? "Nouveau" : isBest ? "Meilleure carte" : undefined;

  const allCards = pull.groups
    .flatMap((g) => g.cards.map((card, i) => ({ card, secret: g.secret[i] })))
    .sort(
      (a, b) => rarityRank(b.card.rarity) - rarityRank(a.card.rarity) || Number(b.secret) - Number(a.secret),
    );

  return (
    <div className="opening" role="dialog" aria-modal aria-label="Ouverture de boosters">
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

      {stage === "reveal" && (
        <PackReveal
          key={index}
          card={bestCard}
          secret={group.secret[best]}
          fresh={pull.fresh.has(bestCard.id)}
          dossierNumber={pull.id + index}
          onDone={() => setStage("summary")}
        />
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
            {group.cards.map((card, i) =>
              i === best ? null : (
                <div key={i} className="summary-small">
                  <Fiche
                    card={card}
                    secret={group.secret[i]}
                    tag={pull.fresh.has(card.id) ? "Nouveau" : undefined}
                  />
                  <span
                    className={`rarity-dot class-${card.rarity}`}
                    title={RARITY_BY_ID[card.rarity].name}
                  />
                </div>
              ),
            )}
          </div>

          <div className="summary-actions">
            {last ? (
              <button className="btn btn-primary btn-wide" onClick={onClose} autoFocus>
                Terminer
              </button>
            ) : (
              <button className="btn btn-primary btn-wide" onClick={next} autoFocus>
                Booster suivant
              </button>
            )}
            {!last && (
              <button className="btn btn-wide" onClick={() => setStage("all")}>
                Tout passer
              </button>
            )}
            {last && (
              <button className="btn btn-wide" onClick={onShowCollection}>
                Voir ma collection
              </button>
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
            {allCards.map(({ card, secret }, i) => (
              <Fiche key={i} card={card} secret={secret} tag={tagFor(card.id, i === 0)} />
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
