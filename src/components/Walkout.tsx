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

// Révélation façon walkout FIFA : l'univers, le sexe, le rôle, puis la fiche.
const STEP_MS = 1700;

type Clue = { key: string; label: string; value: string; image?: string; symbol?: string };

const GENDER: Record<string, { value: string; symbol: string }> = {
  male: { value: "Homme", symbol: "♂" },
  female: { value: "Femme", symbol: "♀" },
  "non-binary": { value: "Non-binaire", symbol: "⚧" },
};

const ROLE: Record<string, string> = {
  MAIN: "Personnage principal",
  SUPPORTING: "Personnage secondaire",
  BACKGROUND: "Figurant",
};

function cluesFor(card: Card): Clue[] {
  const clues: Clue[] = [
    { key: "univers", label: "Univers", value: card.anime, image: card.cover ?? undefined },
  ];
  const g = card.gender ? GENDER[card.gender.toLowerCase()] : undefined;
  if (g) clues.push({ key: "genre", label: "Sexe", value: g.value, symbol: g.symbol });
  if (card.role && ROLE[card.role]) clues.push({ key: "role", label: "Rôle", value: ROLE[card.role] });
  return clues;
}

export function Walkout({ card, secret, fresh, onDone }: Props) {
  const clues = cluesFor(card);
  const [step, setStep] = useState(0);
  const r = RARITY_BY_ID[card.rarity];
  const last = step >= clues.length;

  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, last]);

  const clue = clues[step];

  return (
    <div className={`walkout class-${card.rarity} ${secret ? "is-secret" : ""} ${last ? "is-revealed" : ""}`}>
      <div className="walkout-rays" aria-hidden />
      <div className="walkout-beams" aria-hidden>
        <i />
        <i />
        <i />
      </div>

      {!last ? (
        <div className={`walkout-clue clue-${clue.key}`} key={clue.key}>
          <span className="walkout-label mono">{clue.label}</span>
          {clue.image && (
            <img
              className="walkout-cover"
              src={clue.image}
              alt=""
              referrerPolicy="no-referrer"
              draggable={false}
            />
          )}
          {clue.symbol && <span className="walkout-symbol">{clue.symbol}</span>}
          <span className="walkout-mid">{clue.value}</span>
          <span className="walkout-steps" aria-hidden>
            {clues.map((c, i) => (
              <i key={c.key} className={i <= step ? "is-on" : ""} />
            ))}
          </span>
        </div>
      ) : (
        <div className="walkout-reveal">
          <span className="walkout-flash" aria-hidden />
          <Fiche card={card} secret={secret} className="fiche-lg walkout-card" />
          <p className="walkout-name">{card.name}</p>
          <div className="walkout-tags mono">
            <span>
              Classe {r.id} · {r.name} · {formatFans(card.favourites)} fans
            </span>
            {fresh && <span className="tag-new">Nouvelle</span>}
            {secret && <span className="tag-secret">Top secret</span>}
          </div>
          <button className="btn btn-primary" onClick={onDone} autoFocus>
            Voir les fiches
          </button>
        </div>
      )}

      {!last && (
        <button className="walkout-skip mono" onClick={() => setStep(clues.length)}>
          Passer ›
        </button>
      )}
    </div>
  );
}
