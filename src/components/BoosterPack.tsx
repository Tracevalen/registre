interface Props {
  /** Numéro gravé au dos du booster. */
  number?: number;
  className?: string;
}

/** Le booster : une plaque de verre dépoli avec le logo au centre. */
export function BoosterPack({ number, className = "" }: Props) {
  return (
    <div className={`pack ${className}`} aria-hidden>
      <span className="pack-sheen" />
      <span className="pack-title">Registre</span>
      <span className="pack-logo">R</span>
      <span className="pack-sub">5 cartes · jeux vidéo</span>
      {number !== undefined && <span className="pack-number">N°{String(number).padStart(4, "0")}</span>}
    </div>
  );
}
