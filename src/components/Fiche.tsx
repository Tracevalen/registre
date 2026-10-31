import type { CSSProperties } from "react";
import { formatNumber, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import { PRESTIGE_NAME } from "../game/prestige";

interface Props {
  card: Card;
  className?: string;
  style?: CSSProperties;
  /** Exemplaire Top secret : bandeau rouge en travers. */
  secret?: boolean;
  /** Niveau de prestige : 1 bronze, 2 argent, 3 or. */
  prestige?: number;
  /** Bandeau en haut de la carte (« Nouvelle », « Meilleure carte »…). */
  tag?: string;
  /** Nombre d'exemplaires en trop, affiché en bas du portrait. */
  copies?: number;
  /** Ligne sous le nom : la rareté (par défaut) ou la saga. */
  sub?: "rarity" | "saga";
  onClick?: () => void;
}

/** Une carte : portrait lumineux, bandeau éventuel, nom, rareté et hexagone de rareté. */
export function Fiche({
  card,
  className = "",
  style,
  secret = false,
  prestige = 0,
  tag,
  copies = 0,
  sub = "rarity",
  onClick,
}: Props) {
  const r = RARITY_BY_ID[card.rarity];
  const Tag = onClick ? "button" : "article";

  return (
    <Tag
      className={`carte r-${card.rarity} ${secret ? "is-secret" : ""} ${prestige ? `prestige-${prestige}` : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className="carte-art">
        <img src={card.image} alt={card.name} loading="lazy" referrerPolicy="no-referrer" draggable={false} />
        {tag && <span className={`carte-banner ${tag === "Meilleure carte" ? "is-best" : ""}`}>{tag}</span>}
        <span className="carte-no">N°{formatNumber(card.number)}</span>
        {secret && <span className="carte-secret">Top secret</span>}
        {prestige > 0 && <span className="carte-prestige">★ {PRESTIGE_NAME[prestige]}</span>}
        {copies > 0 && <span className="carte-copies">×{copies + 1}</span>}
      </div>
      <div className="carte-foot">
        <div className="carte-text">
          <h3 className="carte-name" title={card.name}>
            {card.name}
          </h3>
          <span
            className={`carte-sub ${sub === "saga" ? "is-saga" : ""}`}
            title={sub === "saga" ? card.anime : r.name}
          >
            {sub === "saga" ? card.anime : r.name}
          </span>
        </div>
        <span className="carte-hex" title={r.name}>
          {r.short}
        </span>
      </div>
    </Tag>
  );
}
