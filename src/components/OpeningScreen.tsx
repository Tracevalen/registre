import { useEffect, useState } from "react";
import type { Pull } from "../game/booster";
import { RARITY_BY_ID } from "../game/rarities";
import { Dossier } from "./Dossier";
import { Fiche } from "./Fiche";

interface Props {
  pull: Pull;
  boostersLeft: number;
  onAgain: () => void;
  onClose: () => void;
  onShowArchive: () => void;
}

type Stage = "sealed" | "unsealing" | "fiches";

const UNSEAL_MS = 700;
const SCAN_STAGGER_MS = 180;

export function OpeningScreen({ pull, boostersLeft, onAgain, onClose, onShowArchive }: Props) {
  const [stage, setStage] = useState<Stage>("sealed");
  const [revealed, setRevealed] = useState<boolean[]>(() => pull.cards.map(() => false));
  const revealedCount = revealed.filter(Boolean).length;
  const done = revealedCount === pull.cards.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (stage !== "unsealing") return;
    const t = setTimeout(() => setStage("fiches"), UNSEAL_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const reveal = (i: number) => setRevealed((r) => r.map((v, j) => v || j === i));

  const revealAll = () => {
    revealed.forEach((isRevealed, i) => {
      if (!isRevealed) setTimeout(() => reveal(i), i * SCAN_STAGGER_MS);
    });
  };

  return (
    <div className="opening" role="dialog" aria-modal aria-label="Ouverture d'un dossier">
      <header className="opening-bar mono">
        <span>Dossier N°{String(pull.id).padStart(4, "0")}</span>
        <span>{stage === "fiches" ? `Déclassifiées ${revealedCount}/${pull.cards.length}` : "Scellé"}</span>
        <button className="opening-close" onClick={onClose}>
          Fermer ✕
        </button>
      </header>

      {stage !== "fiches" ? (
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
                <button className="btn btn-primary" onClick={onAgain} disabled={boostersLeft <= 0}>
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
