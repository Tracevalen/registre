import { useEffect } from "react";
import { formatFans, formatNumber, type Card } from "../game/cards";
import { REQUEST_COST, SHRED_INK, shreddable } from "../game/economy";
import { RARITY_BY_ID } from "../game/rarities";
import { canPrestige, MAX_PRESTIGE, PRESTIGE_NAME, prestigeCost } from "../game/prestige";
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
  onPrestige: (c: Card) => void;
}

export function FicheModal({ card, save, onClose, onShred, onRequest, onToggleWanted, onPrestige }: Props) {
  const level = save.prestige[card.id] ?? 0;
  const nextCost = prestigeCost(level);
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
      aria-label={owned ? card.name : "Carte pas encore obtenue"}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {owned ? (
          <Fiche card={card} className="fiche-lg" secret={secret > 0} prestige={level} />
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
                  {wanted ? "Avis de recherche" : "Pas encore obtenue"}
                </span>
              </div>
              <div className="empty-fiche-series">{card.anime}</div>
            </div>
          </div>
        )}

        <div className="modal-info">
          <p className="kicker mono">Carte N°{formatNumber(card.number)}</p>
          <h2 className="modal-name">{owned ? card.name : "Carte mystère"}</h2>
          {owned && card.nativeName && <p className="modal-native">{card.nativeName}</p>}
          <dl className="spec">
            <dt>Rareté</dt>
            <dd>
              <span className={`rarity-pill class-${card.rarity}`}>{r.name}</span>
            </dd>
            <dt>Saga</dt>
            <dd>
              {card.kind === "game"
                ? [card.anime, card.studio, card.year].filter(Boolean).join(" · ")
                : card.anime}
            </dd>
            {owned && (
              <>
                <dt>Popularité</dt>
                <dd className="mono">{formatFans(card.favourites)} votes IGDB</dd>
                <dt>Exemplaires</dt>
                <dd className="mono">
                  {count}
                  {count > 1 && (
                    <span className="tag-dup">
                      {count - 1} doublon{count > 2 ? "s" : ""}
                    </span>
                  )}
                  {secret > 0 && <span className="tag-secret">dont {secret} Top secret</span>}
                </dd>
                <dt>Prestige</dt>
                <dd>{level ? `★ ${PRESTIGE_NAME[level]} (niveau ${level}/${MAX_PRESTIGE})` : "Aucun"}</dd>
              </>
            )}
            {firstSeen && (
              <>
                <dt>Obtenue le</dt>
                <dd className="mono">{formatDate(firstSeen)}</dd>
              </>
            )}
            <dt>Encre</dt>
            <dd className="mono">{save.ink} disponible</dd>
          </dl>

          <div className="modal-actions">
            {owned && level < MAX_PRESTIGE && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onPrestige(card)}
                disabled={!canPrestige(save, card.id)}
              >
                Passer en {PRESTIGE_NAME[level + 1]} ({nextCost} doublon{nextCost > 1 ? "s" : ""})
              </button>
            )}
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
              Il te manque {cost - save.ink} encre. Broie tes doublons depuis ta collection pour en gagner.
            </p>
          )}

          {owned && (
            <a className="link mono" href={card.url} target="_blank" rel="noreferrer">
              Fiche IGDB ↗
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
