import { CARDS_PER_BOOSTER } from "../game/booster";
import { CARDS } from "../game/cards";
import { Barcode } from "./Barcode";

interface Props {
  /** Numéro du dossier affiché sur l'étiquette. */
  number?: number;
  /** Rend le scellé cliquable. */
  onUnseal?: () => void;
  className?: string;
}

/** Le booster : un dossier scellé qui contient 5 fiches. */
export function Dossier({ number, onUnseal, className = "" }: Props) {
  return (
    <div className={`dossier ${className}`}>
      <div className="dossier-tab mono">Registre</div>
      <div className="dossier-body">
        <div className="dossier-top mono">
          <span>Série 01</span>
          <span>{number ? `N°${String(number).padStart(4, "0")}` : "N°————"}</span>
        </div>
        <div className="dossier-count">{String(CARDS_PER_BOOSTER).padStart(2, "0")}</div>
        <div className="dossier-label">Fiches</div>
        <div className="dossier-meta mono">
          <span>Classes E — A</span>
          <span>{CARDS.length} personnages</span>
        </div>
        <Barcode value={number ?? 1} className="dossier-barcode" />
      </div>
      <button className="dossier-seal mono" onClick={onUnseal} disabled={!onUnseal}>
        <span>Scellé</span>
        {onUnseal && <span className="dossier-seal-cta">Cliquer pour rompre →</span>}
      </button>
    </div>
  );
}
