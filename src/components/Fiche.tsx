import type { CSSProperties } from "react";
import { CARDS, formatNumber, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import { PRESTIGE_NAME } from "../game/prestige";

interface Props {
  card: Card;
  className?: string;
  style?: CSSProperties;
  /** Exemplaire Top secret : la fiche porte un tampon rouge. */
  secret?: boolean;
  /** Niveau de prestige : 1 bronze, 2 argent, 3 or. */
  prestige?: number;
  /** Étiquette posée sur le coin de la carte (« Nouveau », « Meilleure carte »…). */
  tag?: string;
  onClick?: () => void;
}

const TOTAL = formatNumber(CARDS.length);

/** Une carte compacte : nom et classe en haut, grand portrait numéroté, série en bas. */
export function Fiche({ card, className = "", style, secret = false, prestige = 0, tag, onClick }: Props) {
  const r = RARITY_BY_ID[card.rarity];
  const Tag = onClick ? "button" : "article";

  return (
    <Tag
      className={`fiche class-${card.rarity} ${secret ? "is-secret" : ""} ${prestige ? `prestige-${prestige}` : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className="fiche-inner">
        <header className="fiche-head">
          <h3 className="fiche-name" title={card.name}>
            {card.name}
          </h3>
          <span className="fiche-class" title={`Classe ${r.id} — ${r.name}`}>
            {r.id}
          </span>
        </header>

        <div className="fiche-img">
          <img
            src={card.image}
            alt={card.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            draggable={false}
          />
          {prestige > 0 && <span className="prestige-badge">★ {PRESTIGE_NAME[prestige]}</span>}
          {secret && <span className="secret-stamp">Top secret</span>}
          <span className="fiche-no">
            #{formatNumber(card.number)}/{TOTAL}
          </span>
        </div>

        <footer className="fiche-series" title={card.anime}>
          {card.kind === "game"
            ? [card.studio, card.year].filter(Boolean).join(" · ") || card.anime
            : card.anime}
        </footer>
      </div>
      {tag && <span className={`fiche-tag ${tag === "Meilleure carte" ? "is-best" : ""}`}>{tag}</span>}
    </Tag>
  );
}
