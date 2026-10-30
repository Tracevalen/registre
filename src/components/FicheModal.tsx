import { useEffect } from "react";
import { formatFans, formatNumber, type Card } from "../game/cards";
import { RARITY_BY_ID } from "../game/rarities";
import { formatDate } from "../lib/format";
import { Fiche } from "./Fiche";

interface Props {
  card: Card;
  count: number;
  firstSeen?: number;
  onClose: () => void;
}

export function FicheModal({ card, count, firstSeen, onClose }: Props) {
  const r = RARITY_BY_ID[card.rarity];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal aria-label={card.name}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <Fiche card={card} className="fiche-lg" />
        <div className="modal-info">
          <p className="kicker mono">Fiche N°{formatNumber(card.number)}</p>
          <h2 className="modal-name">{card.name}</h2>
          {card.nativeName && <p className="modal-native">{card.nativeName}</p>}
          <dl className="spec">
            <dt>Classe</dt>
            <dd>
              <span className={`class-chip class-${card.rarity}`}>{r.id}</span> {r.name}
            </dd>
            <dt>Série</dt>
            <dd>{card.anime}</dd>
            <dt>Fans AniList</dt>
            <dd className="mono">{formatFans(card.favourites)}</dd>
            <dt>Exemplaires</dt>
            <dd className="mono">{count}</dd>
            {firstSeen && (
              <>
                <dt>Archivée le</dt>
                <dd className="mono">{formatDate(firstSeen)}</dd>
              </>
            )}
          </dl>
          <a className="link mono" href={card.url} target="_blank" rel="noreferrer">
            Source AniList ↗
          </a>
        </div>
        <button className="modal-close mono" onClick={onClose}>
          Fermer ✕
        </button>
      </div>
    </div>
  );
}
