import { useEffect, useState, type PointerEvent } from "react";
import { formatFans, type Card } from "../game/cards";
import { RARITY_BY_ID, type Rarity } from "../game/rarities";
import { BoosterPack } from "./BoosterPack";
import { Fiche } from "./Fiche";
import { Particles } from "./Particles";

interface Props {
  card: Card;
  secret: boolean;
  fresh: boolean;
  /** Numéro affiché sur le dossier, ou nombre de dossiers ouverts d'un coup. */
  dossierNumber: number;
  onDone: () => void;
}

type Phase = "charge" | "burst" | "clue" | "spin" | "show";

/** Couleur de lumière par classe (charte). */
const GLOW: Record<Rarity, string> = {
  E: "#7c88b8",
  D: "#6fa0ff",
  C: "#ff8fc8",
  B: "#00e8c6",
  A: "#ffc94d",
};

/** Plus la fiche est rare, plus la montée en tension dure. */
const CHARGE_MS: Record<Rarity, number> = { E: 1200, D: 1500, C: 1900, B: 2500, A: 3200 };
const BURST_MS = 450;
const CLUE_MS = 1800;
const SPIN_MS = 2300;

type Clue = { key: string; label: string; value: string; image?: string; symbol?: string };

const GENDER: Record<string, { value: string; symbol: string }> = {
  male: { value: "Homme", symbol: "♂" },
  female: { value: "Femme", symbol: "♀" },
  "non-binary": { value: "Non-binaire", symbol: "⚧" },
};

/**
 * Indices avant la révélation. Jeux vidéo : année, style, puis studio.
 * Personnages : sexe, style, puis saga.
 */
function cluesFor(card: Card): Clue[] {
  const clues: Clue[] = [];
  if (card.year) clues.push({ key: "annee", label: "Sortie", value: String(card.year) });
  const g = card.gender ? GENDER[card.gender.toLowerCase()] : undefined;
  if (g) clues.push({ key: "genre", label: "Sexe", value: g.value, symbol: g.symbol });
  if (card.style) clues.push({ key: "style", label: "Style", value: card.style });
  if (card.studio) clues.push({ key: "studio", label: "Studio", value: card.studio });
  else clues.push({ key: "univers", label: "Saga", value: card.anime, image: card.cover ?? undefined });
  return clues;
}

/** Révélation de la meilleure fiche, façon pack opening : tension, explosion, indices, carte en 3D. */
export function PackReveal({ card, secret, fresh, dossierNumber, onDone }: Props) {
  const clues = cluesFor(card);
  const [phase, setPhase] = useState<Phase>("charge");
  const [clue, setClue] = useState(0);
  const [burst, setBurst] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const r = RARITY_BY_ID[card.rarity];
  const color = secret ? "#ff3b47" : GLOW[card.rarity];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (phase === "charge") t = setTimeout(() => setPhase("burst"), CHARGE_MS[card.rarity]);
    if (phase === "burst") {
      setBurst((b) => b + 1);
      t = setTimeout(() => setPhase("clue"), BURST_MS);
    }
    if (phase === "clue") {
      t = setTimeout(() => {
        if (clue + 1 < clues.length) setClue(clue + 1);
        else setPhase("spin");
      }, CLUE_MS);
    }
    if (phase === "spin") t = setTimeout(() => setPhase("show"), SPIN_MS);
    if (phase === "show") setBurst((b) => b + 1);
    return () => clearTimeout(t);
  }, [phase, clue, clues.length, card.rarity]);

  const skip = () => {
    if (phase === "show") return;
    setPhase(phase === "spin" ? "show" : "spin");
  };

  // La carte suit légèrement le pointeur une fois révélée.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (phase !== "show") return;
    const box = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - box.top) / box.height - 0.5) * -16,
      y: ((e.clientX - box.left) / box.width - 0.5) * 22,
    });
  };

  const current = clues[clue];

  return (
    <div
      className={`reveal phase-${phase} class-${card.rarity} ${secret ? "is-secret" : ""}`}
      style={{ ["--glow" as string]: color, ["--charge" as string]: `${CHARGE_MS[card.rarity]}ms` }}
      onPointerMove={onMove}
    >
      <div className="reveal-floor" aria-hidden />
      <div className="reveal-halo" aria-hidden />
      <Particles color={color} burst={burst} ambient={phase === "charge" ? 0.35 : 0.7} />

      {phase === "charge" && (
        <div className="reveal-pack" onClick={() => setPhase("burst")}>
          <div className="reveal-pack-inner">
            <BoosterPack number={dossierNumber} />
          </div>
        </div>
      )}

      {phase === "burst" && <span className="reveal-flash" aria-hidden />}

      {phase === "clue" && current && (
        <div className="clue3d" key={current.key}>
          <span className="clue3d-label mono">{current.label}</span>
          {current.image && (
            <img
              className="clue3d-cover"
              src={current.image}
              alt=""
              referrerPolicy="no-referrer"
              draggable={false}
            />
          )}
          {current.symbol && <span className="clue3d-symbol">{current.symbol}</span>}
          <span className="clue3d-value">{current.value}</span>
          <span className="clue3d-steps" aria-hidden>
            {clues.map((c, i) => (
              <i key={c.key} className={i <= clue ? "is-on" : ""} />
            ))}
          </span>
        </div>
      )}

      {(phase === "spin" || phase === "show") && (
        <div className="reveal-card-zone">
          <div className="card3d-tilt" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
            <div className={`card3d ${phase === "spin" ? "is-spinning" : "is-landed"}`}>
              <div className="card3d-face card3d-front">
                <Fiche card={card} secret={secret} className="fiche-lg" />
                <span className="card3d-foil" aria-hidden />
              </div>
              <div className="card3d-face card3d-back" aria-hidden>
                <span className="card3d-back-mark">Registre</span>
                <span className="card3d-back-class">{r.id}</span>
              </div>
            </div>
          </div>

          {phase === "show" && (
            <div className="reveal-info">
              <p className="reveal-name">{card.name}</p>
              <div className="reveal-tags mono">
                <span>
                  {r.name} · présent dans {formatFans(card.favourites)} Wikipédias
                </span>
                {fresh && <span className="tag-new">Nouvelle</span>}
                {secret && <span className="tag-secret">Top secret</span>}
              </div>
              <button className="btn btn-primary" onClick={onDone} autoFocus>
                Voir le booster
              </button>
            </div>
          )}
        </div>
      )}

      {phase !== "show" && (
        <button className="reveal-skip mono" onClick={skip}>
          Passer ›
        </button>
      )}
    </div>
  );
}
