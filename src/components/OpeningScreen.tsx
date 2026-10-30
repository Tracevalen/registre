import { useEffect, useMemo, useState } from "react";
import type { Pull } from "../game/booster";
import { RARITY_BY_ID, rarityRank } from "../game/rarities";
import { Walkout } from "./Walkout";
import { Dossier } from "./Dossier";
import { Fiche } from "./Fiche";

interface Props {
  pull: Pull;
  boostersLeft: number;
  onAgain: () => void;
  onOpenAll: () => void;
  onClose: () => void;
  onShowArchive: () => void;
}

type Stage = "sealed" | "unsealing" | "flare" | "walkout" | "fiches";

const UNSEAL_MS = 700;
/** Durée de la montée en lumière avant l'ouverture, plus longue pour les gros tirages. */
const FLARE_MS = { E: 1100, D: 1300, C: 1600, B: 2200, A: 2800 } as const;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const SCAN_STAGGER_MS = 180;

export function OpeningScreen({ pull, boostersLeft, onAgain, onOpenAll, onClose, onShowArchive }: Props) {
  // « Tout ouvrir » saute le sceau : lumière, walkout de la meilleure fiche, puis toutes les fiches révélées.
  const [stage, setStage] = useState<Stage>(pull.batch ? "flare" : "sealed");
  const [revealed, setRevealed] = useState<boolean[]>(() => pull.cards.map(() => Boolean(pull.batch)));
  const revealedCount = revealed.filter(Boolean).length;
  const done = revealedCount === pull.cards.length;

  // La meilleure fiche du dossier donne la couleur de la lumière et déclenche le walkout (B, A ou Top secret).
  const best = useMemo(() => {
    let b = 0;
    pull.cards.forEach((c, i) => {
      const cur = pull.cards[b];
      const score = rarityRank(c.rarity) * 2 + (pull.secret[i] ? 1 : 0);
      const bestScore = rarityRank(cur.rarity) * 2 + (pull.secret[b] ? 1 : 0);
      if (score > bestScore || (score === bestScore && c.favourites > cur.favourites)) b = i;
    });
    return b;
  }, [pull]);
  const bestCard = pull.cards[best];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (stage === "unsealing") {
      const t = setTimeout(() => setStage(reducedMotion() ? "fiches" : "flare"), UNSEAL_MS);
      return () => clearTimeout(t);
    }
    if (stage === "flare") {
      const t = setTimeout(() => setStage("walkout"), FLARE_MS[bestCard.rarity]);
      return () => clearTimeout(t);
    }
  }, [stage, bestCard.rarity]);

  const reveal = (i: number) => setRevealed((r) => r.map((v, j) => v || j === i));

  const revealAll = () => {
    revealed.forEach((isRevealed, i) => {
      if (!isRevealed) setTimeout(() => reveal(i), i * SCAN_STAGGER_MS);
    });
  };

  return (
    <div className="opening" role="dialog" aria-modal aria-label="Ouverture d'un dossier">
      <header className="opening-bar mono">
        <span>
          {pull.batch ? `${pull.batch} dossiers ouverts` : `Dossier N°${String(pull.id).padStart(4, "0")}`}
        </span>
        <span>{stage === "fiches" ? `Déclassifiées ${revealedCount}/${pull.cards.length}` : "Scellé"}</span>
        <button className="opening-close" onClick={onClose}>
          Fermer ✕
        </button>
      </header>

      {stage === "flare" ? (
        <div
          className={`flare class-${bestCard.rarity} ${pull.secret[best] ? "is-secret" : ""}`}
          style={{ animationDuration: `${FLARE_MS[bestCard.rarity]}ms` }}
          onClick={() => setStage("walkout")}
        >
          <span className="flare-rays" aria-hidden />
          <span className="flare-core" aria-hidden />
          <div className="flare-dossier">
            <Dossier number={pull.id} />
          </div>
        </div>
      ) : stage === "walkout" ? (
        <Walkout
          card={bestCard}
          secret={pull.secret[best]}
          fresh={pull.fresh.has(bestCard.id)}
          onDone={() => {
            reveal(best);
            setStage("fiches");
          }}
        />
      ) : stage !== "fiches" ? (
        <div className={`opening-dossier is-${stage}`}>
          <Dossier number={pull.id} onUnseal={stage === "sealed" ? () => setStage("unsealing") : undefined} />
        </div>
      ) : (
        <>
          <div className="pull">
            {pull.cards.map((card, i) => (
              <div
                key={i}
                className={`pull-slot class-${card.rarity} ${pull.secret[i] ? "is-secret" : ""} ${revealed[i] ? "is-revealed" : ""}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="pull-card">
                  <Fiche card={card} secret={pull.secret[i]} />
                  <button
                    className="cover"
                    onClick={() => reveal(i)}
                    disabled={revealed[i]}
                    aria-label={`Déclassifier la fiche ${i + 1}`}
                  >
                    <span className="cover-lines" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="cover-label mono">
                      Fiche {i + 1}/{pull.cards.length}
                      <br />
                      Classe ?
                    </span>
                  </button>
                  <span className="scanline" aria-hidden />
                </div>
                <div className="pull-caption mono">
                  {revealed[i] ? (
                    <>
                      <span>
                        Classe {card.rarity} · {RARITY_BY_ID[card.rarity].name}
                      </span>
                      {pull.fresh.has(card.id) && <span className="tag-new">Nouvelle</span>}
                      {pull.secret[i] && <span className="tag-secret">Top secret</span>}
                      {pull.wanted.has(card.id) && <span className="tag-wanted">Recherchée</span>}
                    </>
                  ) : (
                    <span>Cliquer pour déclassifier</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="opening-actions">
            {!done ? (
              <button className="btn btn-inverse" onClick={revealAll}>
                Tout déclassifier
              </button>
            ) : (
              <>
                {boostersLeft > 1 && (
                  <button className="btn btn-primary" onClick={onOpenAll}>
                    Tout ouvrir ({boostersLeft})
                  </button>
                )}
                <button className="btn btn-inverse" onClick={onAgain} disabled={boostersLeft <= 0}>
                  {boostersLeft > 0 ? `Dossier suivant (${boostersLeft})` : "Plus de dossier"}
                </button>
                <button className="btn btn-inverse" onClick={onShowArchive}>
                  Voir l'archive
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
