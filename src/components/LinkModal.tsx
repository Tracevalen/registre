import { useEffect } from "react";
import { formatLinkNumber, LINK_CLASS_NAME, type Link } from "../game/links";
import { formatDate } from "../lib/format";
import { LinkedFiche } from "./LinkedFiche";

interface Props {
  link: Link;
  count: number;
  firstFused?: number;
  /** Juste agrafé : la fiche arrive avec le tampon. */
  fresh?: boolean;
  onClose: () => void;
}

export function LinkModal({ link, count, firstFused, fresh = false, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal aria-label={link.title}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <LinkedFiche link={link} className={`fiche-lg ${fresh ? "is-fresh" : ""}`} />
        <div className="modal-info">
          <p className="kicker mono">
            Dossier lié {formatLinkNumber(link.number)}
            {fresh && <span className="tag-new">Agrafé</span>}
          </p>
          <h2 className="modal-name">{link.title}</h2>
          <dl className="spec">
            <dt>Classe</dt>
            <dd>
              <span className={`class-chip class-${link.rarity}`}>{link.rarity}</span>{" "}
              {LINK_CLASS_NAME[link.rarity]}
            </dd>
            <dt>Type</dt>
            <dd>{link.kind === "duo" ? "Duo" : "Trio"}</dd>
            <dt>Série</dt>
            <dd>{link.anime}</dd>
            <dt>Pièces</dt>
            <dd>{link.members.map((c) => c.name).join(", ")}</dd>
            <dt>Exemplaires</dt>
            <dd className="mono">{count}</dd>
            {firstFused && (
              <>
                <dt>Agrafé le</dt>
                <dd className="mono">{formatDate(firstFused)}</dd>
              </>
            )}
          </dl>
        </div>
        <button className="modal-close mono" onClick={onClose}>
          Fermer ✕
        </button>
      </div>
    </div>
  );
}
