interface Props {
  /** Numéro du booster, affiché en bas. */
  number?: number;
  className?: string;
}

const Sparkle = ({ className }: { className: string }) => (
  <svg className={`pack-spark ${className}`} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z" />
  </svg>
);

/** Le booster : dégradé rose → violet → bleu, trame de points, étincelles et logo au centre. */
export function BoosterPack({ number, className = "" }: Props) {
  return (
    <div className={`pack ${className}`} aria-hidden>
      <span className="pack-dots" />
      <span className="pack-shine" />
      <span className="pack-sheen" />
      <Sparkle className="s1" />
      <Sparkle className="s2" />
      <Sparkle className="s3" />
      <span className="pack-logo">R</span>
      <span className="pack-foot">
        <span className="pack-name">Booster</span>
        <span className="pack-count">
          {number !== undefined ? `N°${String(number).padStart(4, "0")}` : "5 cartes"}
        </span>
      </span>
    </div>
  );
}
