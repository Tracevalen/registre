import { useEffect, useState } from "react";
import { formatFans, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import { Fiche } from "./Fiche";

interface Props {
  card: Card;
  secret: boolean;
  fresh: boolean;
  onDone: () => void;
}

// Révélation façon « walkout » : trois indices l'un après l'autre, puis la fiche.
const STEPS = ["classe", "serie", "fans", "fiche"] as const;
const STEP_MS = 1400;

export function Walkout({ card, secret, fresh, onDone }: Props) {
  const [step, setStep] = useState(0);
  const r = RARITY_BY_ID[card.rarity];
  const last = step >= STEPS.length - 1;

  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, last]);

  return (
    <div className={`walkout class-${card.rarity} ${last ? "is-revealed" : ""}`}>
      <div className="walkout-rays" aria-hidden />

      {!last ? (
        <div className="walkout-clue" key={step}>
          {STEPS[step] === "classe" && (
            <>
              <span className="walkout-label mono">Classe</span>
              <span className="walkout-big">{r.id}</span>
              <span className="walkout-sub">{r.name}</span>
            </>
          )}
          {STEPS[step] === "serie" && (
            <>
              <span className="walkout-label mono">Série</span>
              <span className="walkout-mid">{card.anime}</span>
            </>
          )}
          {STEPS[step] === "fans" && (
            <>
              <span className="walkout-label mono">Fans AniList</span>
              <span className="walkout-big">{formatFans(card.favourites)}</span>
            </>
          )}
        </div>
      ) : (
        <div className="walkout-reveal">
          <span className="walkout-flash" aria-hidden />
          <Fiche card={card} secret={secret} className="fiche-lg walkout-card" />
          <p className="walkout-name">{card.name}</p>
          <div className="walkout-tags mono">
            <span>
              Classe {r.id} · {r.name}
            </span>
            {fresh && <span className="tag-new">Nouvelle</span>}
            {secret && <span className="tag-secret">Top secret</span>}
          </div>
          <button className="btn btn-primary" onClick={onDone} autoFocus>
            Voir le dossier
          </button>
        </div>
      )}

      {!last && (
        <button className="walkout-skip mono" onClick={() => setStep(STEPS.length - 1)}>
          Passer ›
        </button>
      )}
    </div>
  );
}
