import { useMemo, useState } from "react";
import {
  affaireReward,
  blurFor,
  compare,
  MAX_GUESSES,
  normalize,
  shareText,
  suspectOfDay,
  type Hint,
} from "../game/affaire";
import { CARDS, formatFans, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import type { SaveData } from "../game/store";

interface Props {
  save: SaveData;
  onGuess: (c: Card) => void;
  onFocus: (c: Card) => void;
}

const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

const ARROW: Record<Hint, string> = { match: "✓", up: "↑", down: "↓", miss: "✕" };

export function AffairePage({ save, onGuess, onFocus }: Props) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const target = suspectOfDay(save.daily.day);
  const { guesses, done, won } = save.daily.affaire;
  const clues = guesses.map((id) => compare(CARD_BY_ID.get(id)!, target));
  const left = MAX_GUESSES - guesses.length;

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return CARDS.filter((c) => !guesses.includes(c.id) && normalize(c.name).includes(q)).slice(0, 8);
  }, [query, guesses]);

  const pick = (c: Card) => {
    onGuess(c);
    setQuery("");
  };

  const share = async () => {
    const text = shareText(save.daily.day, clues, won);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie ce texte :", text);
    }
  };

  return (
    <div className="affaire">
      <section className="affaire-hero">
        <div className="affaire-photo" aria-hidden>
          <img
            src={target.image}
            alt=""
            referrerPolicy="no-referrer"
            draggable={false}
            style={{ filter: `blur(${blurFor(guesses.length, done)}px) ${done ? "" : "grayscale(0.6)"}` }}
          />
          {!done && <span className="affaire-stamp mono">Identité inconnue</span>}
        </div>

        <div className="affaire-copy">
          <p className="hero-eyebrow">Enquête du jour · même énigme pour tout le monde</p>
          <h1 className="special-title">
            {done ? (won ? target.name : `C'était ${target.name}`) : "Quelle est la carte mystère ?"}
          </h1>
          <p className="special-lede">
            {done
              ? won
                ? `Trouvée en ${guesses.length} essai${guesses.length > 1 ? "s" : ""}. Sa carte rejoint ta collection, avec ${affaireReward(guesses.length)} encre.`
                : "Pas trouvée cette fois. Nouvelle énigme demain à minuit."
              : `Propose un jeu ou un personnage : chaque essai donne des indices et précise le portrait. Il te reste ${left} essai${left > 1 ? "s" : ""}.`}
          </p>

          {!done ? (
            <div className="affaire-search">
              <input
                id="affaire-input"
                className="field field-search"
                type="search"
                placeholder="Tape un nom, par exemple Gojou"
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && suggestions[0] && pick(suggestions[0])}
              />
              {suggestions.length > 0 && (
                <ul className="affaire-suggest">
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => pick(c)}>
                        <strong>{c.name}</strong>
                        <span>{c.anime}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={share}>
                {copied ? "Résultat copié" : "Copier mon résultat"}
              </button>
              {won && (
                <button className="btn btn-ghost" onClick={() => onFocus(target)}>
                  Voir sa carte
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="affaire-table" role="table" aria-label="Indices de l'enquête">
        <div className="affaire-row affaire-head mono" role="row">
          <span>Proposition</span>
          <span>Saga</span>
          <span>Rareté</span>
          <span>Popularité</span>
          <span>Initiale</span>
        </div>
        {clues.length === 0 && <p className="empty mono">Aucune proposition pour l'instant.</p>}
        {clues.map((c) => (
          <div key={c.card.id} className="affaire-row" role="row">
            <span className="affaire-name">{c.card.name}</span>
            <span className={`hint hint-${c.series}`} title={c.card.anime}>
              <span className="hint-text">{c.card.anime}</span>
            </span>
            <span className={`hint hint-${c.rarity}`}>
              {c.card.rarity} {c.rarity !== "match" && ARROW[c.rarity]}
            </span>
            <span className={`hint hint-${c.fans}`}>
              {formatFans(c.card.favourites)} {c.fans !== "match" && ARROW[c.fans]}
            </span>
            <span className={`hint hint-${c.initial}`}>{c.card.name[0]}</span>
          </div>
        ))}
      </div>

      <p className="streak-note mono">
        Vert : identique · Jaune : la carte mystère est plus haut (↑) ou plus bas (↓) · Noir : différent.
        Raretés de {RARITY_BY_ID.C.name.toLowerCase()} à {RARITY_BY_ID.A.name.toLowerCase()} uniquement.
      </p>
    </div>
  );
}
