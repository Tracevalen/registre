import type { CSSProperties } from "react";
import { formatFans, formatNumber, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import { Barcode } from "./Barcode";

interface Props {
  card: Card;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Une carte = une fiche d'archive. Le traitement visuel dépend de la classe (E → A). */
export function Fiche({ card, className = "", style, onClick }: Props) {
  const r = RARITY_BY_ID[card.rarity];
  const Tag = onClick ? "button" : "article";

  return (
    <Tag className={`fiche class-${card.rarity} ${className}`} style={style} onClick={onClick}>
      <div className="fiche-inner">
        <header className="fiche-head">
          <span className="fiche-no">N°{formatNumber(card.number)}</span>
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
        </div>

        <div className="fiche-body">
          <h3 className="fiche-name">{card.name}</h3>
          <dl className="fiche-data">
            <dt>Série</dt>
            <dd>{card.anime}</dd>
            <dt>Fans</dt>
            <dd>{formatFans(card.favourites)}</dd>
          </dl>
        </div>

        <footer className="fiche-foot">
          <Barcode value={card.id} />
          <span className="fiche-id">
            {String(card.id).padStart(7, "0")} · {r.name}
          </span>
        </footer>
      </div>
    </Tag>
  );
}
