interface Props {
  /** Numéro du booster, affiché en bas à la place de « 5 cartes ». */
  number?: number;
  /** Nombre de boosters en stock, dans l'hexagone du coin. */
  stock?: number;
  /** Nom écrit sur le bandeau du haut. */
  label?: string;
  className?: string;
}

/** Le booster : cadre doré, bandeau, hexagone lumineux au centre. */
export function BoosterPack({ number, stock, label = "Booster standard", className = "" }: Props) {
  return (
    <div className={`pack ${className}`} aria-hidden>
      <div className="pack-in">
        <span className="pack-band">{label}</span>
        <span className="pack-glow" />
        <span className="pack-hex">
          <span>R</span>
        </span>
        <span className="pack-sheen" />
        <span className="pack-chip">
          {number !== undefined ? `N°${String(number).padStart(4, "0")}` : "5 cartes"}
        </span>
      </div>
      {stock !== undefined && stock > 0 && <span className="pack-stock">×{stock}</span>}
    </div>
  );
}
