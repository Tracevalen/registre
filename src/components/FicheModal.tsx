import { useEffect } from "react";
import { formatFans, formatNumber, type Card } from "../game/cards";
import { REQUEST_COST, SHRED_INK, shreddable } from "../game/economy";
import { RARITY_BY_ID } from "../game/rarities";
import type { SaveData } from "../game/store";
import { formatDate } from "../lib/format";
import { Fiche } from "./Fiche";

interface Props {
  card: Card;
  save: SaveData;
  onClose: () => void;
  onShred: (c: Card) => void;
  onRequest: (c: Card) => void;
  onToggleWanted: (c: Card) => void;
}

export function FicheModal({ card, save, onClose, onShred, onRequest, onToggleWanted }: Props) {
  const r = RARITY_BY_ID[card.rarity];
  const count = save.owned[card.id] ?? 0;
  const secret = save.secret[card.id] ?? 0;
  const firstSeen = save.firstSeen[card.id];
  const spare = shreddable(save, card.id);
  const cost = REQUEST_COST[card.rarity];
  const wanted = save.wanted.includes(card.id);
  const owned = count > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={owned ? card.name : "Fiche non archivée"}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {owned ? (
          <Fiche card={card} className="fiche-lg" secret={secret > 0} />
        ) : (
          <div className="fiche-lg modal-empty">
            <div className={`empty-fiche class-${card.rarity} ${wanted ? "is-wanted" : ""}`}>
              <div className="empty-fiche-head mono">
                <span>N°{formatNumber(card.number)}</span>
                <span className="empty-fiche-class">{card.rarity}</span>
              </div>
              <div className="empty-fiche-body">
                <span className="redacted" />
                <span className="redacted short" />
                <span className="empty-fiche-label mono">
                  {wanted ? "Avis de recherche" : "Non archivée"}
                </span>
              </div>
              <div className="empty-fiche-series">{card.anime}</div>
            </div>
          </div>
        )}

        <div className="modal-info">
          <p className="kicker mono">Fiche N°{formatNumber(card.number)}</p>
          <h2 className="modal-name">{owned ? card.name : "Identité classifiée"}</h2>
          {owned && card.nativeName && <p className="modal-native">{card.nativeName}</p>}
          <dl className="spec">
            <dt>Classe</dt>
            <dd>
              <span className={`class-chip class-${card.rarity}`}>{r.id}</span> {r.name}
            </dd>
            <dt>Série</dt>
            <dd>{card.anime}</dd>
            {owned && (
              <>
                <dt>Fans AniList</dt>
                <dd className="mono">{formatFans(card.favourites)}</dd>
                <dt>Exemplaires</dt>
                <dd className="mono">
                  {count}
                  {secret > 0 && <span className="tag-secret">dont {secret} Top secret</span>}
                </dd>
              </>
            )}
            {firstSeen && (
              <>
                <dt>Archivée le</dt>
                <dd className="mono">{formatDate(firstSeen)}</dd>
              </>
            )}
            <dt>Encre</dt>
            <dd className="mono">{save.ink} disponible</dd>
          </dl>

          <div className="modal-actions">
            {owned ? (
              <button className="btn btn-sm" onClick={() => onShred(card)} disabled={spare <= 0}>
                {spare > 0
                  ? `Broyer un doublon (+${SHRED_INK[card.rarity]} encre)`
                  : "Aucun doublon à broyer"}
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onRequest(card)}
                  disabled={save.ink < cost}
                >
                  Demander l'accès ({cost} encre)
                </button>
                <button
                  className={`btn btn-sm ${wanted ? "is-on" : ""}`}
                  onClick={() => onToggleWanted(card)}
                >
                  {wanted ? "Retirer l'avis de recherche" : "Lancer un avis de recherche"}
                </button>
              </>
            )}
          </div>
          {!owned && save.ink < cost && (
            <p className="modal-hint">
              Il te manque {cost - save.ink} encre. Broie tes doublons depuis l'archive pour en gagner.
            </p>
          )}

          {owned && (
            <a className="link mono" href={card.url} target="_blank" rel="noreferrer">
              Source AniList ↗
            </a>
          )}
        </div>
        <button className="modal-close mono" onClick={onClose}>
          Fermer ✕
        </button>
      </div>
    </div>
  );
}
