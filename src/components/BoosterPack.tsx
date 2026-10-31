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
      <span className="pack-logo">R</span>
      {number !== undefined && <span className="pack-number">N°{String(number).padStart(4, "0")}</span>}
    </div>
  );
}
