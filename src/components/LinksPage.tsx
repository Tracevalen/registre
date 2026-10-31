import { useEffect, useMemo, useState } from "react";
import { formatNumber, type Card } from "../game/cards";
import {
  formatLinkNumber,
  linkClassRank,
  LINKS,
  linkState,
  required,
  type Link,
  type LinkState,
} from "../game/links";
import type { SaveData } from "../game/store";

type Filter = "all" | "ready" | "detected" | "archived";

interface Props {
  save: SaveData;
  onFuse: (link: Link) => void;
  onOpenLink: (link: Link) => void;
  onFocusCard: (c: Card) => void;
  onKeepOneChange: (keepOne: boolean) => void;
}

export function LinksPage({ save, onFuse, onOpenLink, onFocusCard, onKeepOneChange }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState<Link | null>(null);

  const rows = useMemo(
    () =>
      LINKS.map((link) => ({ link, state: linkState(save, link), count: save.linked[link.id] ?? 0 })).sort(
        // Prêts d'abord, puis détectés, puis classifiés ; à état égal, les plus rares d'abord.
        (a, b) =>
          STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
          linkClassRank(b.link.rarity) - linkClassRank(a.link.rarity) ||
          a.link.number - b.link.number,
      ),
    [save],
  );

  const counts = {
    all: rows.length,
    ready: rows.filter((r) => r.state === "ready").length,
    detected: rows.filter((r) => r.state !== "classified").length,
    archived: rows.filter((r) => r.count > 0).length,
  };

  const list = rows.filter(
    (r) =>
      filter === "all" ||
      (filter === "ready" && r.state === "ready") ||
      (filter === "detected" && r.state !== "classified") ||
      (filter === "archived" && r.count > 0),
  );

  return (
    <div className="archive links">
      <div className="archive-head">
        <div>
          <p className="kicker mono">Duos &amp; trios</p>
          <h1 className="archive-count">
            {String(counts.archived).padStart(3, "0")}
            <span>/{LINKS.length}</span>
          </h1>
        </div>
        <div className="segmented" role="group" aria-label="Filtrer les fusions">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "is-active" : ""} onClick={() => setFilter(f.id)}>
              <strong>{f.label}</strong>
              <span className="mono">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="links-intro">
        <p>
          Fusionne deux ou trois cartes qui vont ensemble (un duo de héros, une trilogie) pour obtenir leur
          carte Duo ou Trio. Les cartes fusionnées sont consommées. Une recette apparaît dès que tu as obtenu
          l'une de ses pièces.
        </p>
        <label className="check">
          <input type="checkbox" checked={save.keepOne} onChange={(e) => onKeepOneChange(e.target.checked)} />
          Toujours garder un exemplaire de chaque carte
        </label>
      </div>

      {list.length === 0 ? (
        <p className="empty mono">{EMPTY[filter]}</p>
      ) : (
        <div className="links-grid">
          {list.map(({ link, state, count }) => (
            <LinkItem
              key={link.id}
              link={link}
              state={state}
              count={count}
              save={save}
              onFuse={() => setConfirm(link)}
              onOpen={() => onOpenLink(link)}
              onFocusCard={onFocusCard}
            />
          ))}
        </div>
      )}

      {confirm && (
        <FuseDialog
          link={confirm}
          save={save}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onFuse(confirm);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

const STATE_ORDER: Record<LinkState, number> = { ready: 0, detected: 1, classified: 2 };

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "ready", label: "Prêts" },
  { id: "detected", label: "Repérés" },
  { id: "archived", label: "Fusionnés" },
];

const EMPTY: Record<Filter, string> = {
  all: "Aucune fusion.",
  ready: "Aucune fusion possible pour l'instant. Garde tes doublons.",
  detected: "Aucune recette détectée. Ouvre des boosters pour en trouver.",
  archived: "Aucune fusion pour l'instant.",
};

interface ItemProps {
  link: Link;
  state: LinkState;
  count: number;
  save: SaveData;
  onFuse: () => void;
  onOpen: () => void;
  onFocusCard: (c: Card) => void;
}

function LinkItem({ link, state, count, save, onFuse, onOpen, onFocusCard }: ItemProps) {
  const classified = state === "classified" && count === 0;
  const need = required(save.keepOne);

  return (
    <article className={`link-item is-${state} ${count ? "is-archived" : ""}`}>
      <header className="link-item-head mono">
        <span>{formatLinkNumber(link.number)}</span>
        <span>{link.kind}</span>
        {classified ? (
          <span className="class-chip class-E">?</span>
        ) : (
          <span className="class-chip class-S chip-wide">{link.kind.toUpperCase()}</span>
        )}
      </header>

      <h3 className="link-item-title">{classified ? <span className="redacted inline" /> : link.title}</h3>

      <ul className="link-pieces">
        {link.members.map((c) => {
          const have = save.owned[c.id] ?? 0;
          const seen = Boolean(save.firstSeen[c.id]);
          return (
            <li key={c.id} className={have >= need ? "is-ok" : ""}>
              {seen ? (
                <button className="link-piece-thumb" onClick={() => have && onFocusCard(c)} disabled={!have}>
                  <img src={c.image} alt="" loading="lazy" referrerPolicy="no-referrer" draggable={false} />
                </button>
              ) : (
                <span className="link-piece-thumb is-missing" aria-hidden />
              )}
              <span className="link-piece-name">
                {seen ? c.name : classified ? <span className="redacted inline" /> : "Pièce manquante"}
                <span className="link-piece-sub mono">
                  {seen ? `N°${formatNumber(c.number)}` : classified ? "Mystère" : c.anime}
                </span>
              </span>
              <span className="link-piece-count mono">
                {have}/{need}
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="link-item-foot">
        {count > 0 && (
          <button className="link mono" onClick={onOpen}>
            Fusionné ×{count} · voir
          </button>
        )}
        {state === "ready" ? (
          <button className="btn btn-primary btn-sm" onClick={onFuse}>
            Fusionner
          </button>
        ) : (
          !count && <span className="mono link-item-status">{classified ? "Mystère" : "Repéré"}</span>
        )}
      </footer>
    </article>
  );
}

interface DialogProps {
  link: Link;
  save: SaveData;
  onCancel: () => void;
  onConfirm: () => void;
}

function FuseDialog({ link, save, onCancel, onConfirm }: DialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const lastCopies = link.members.filter((c) => (save.owned[c.id] ?? 0) === 1);

  return (
    <div className="modal" onClick={onCancel} role="dialog" aria-modal aria-label={`Agrafer ${link.title}`}>
      <div className="modal-panel dialog" onClick={(e) => e.stopPropagation()}>
        <p className="kicker mono">
          {formatLinkNumber(link.number)} · {link.kind === "duo" ? "Duo" : "Trio"}
        </p>
        <h2 className="modal-name">Agrafer {link.title}&nbsp;?</h2>
        <p className="dialog-lede">Ces fiches seront consommées&nbsp;:</p>
        <ul className="dialog-list">
          {link.members.map((c) => {
            const have = save.owned[c.id] ?? 0;
            return (
              <li key={c.id}>
                <span>{c.name}</span>
                <span className="mono">
                  ×{have} → ×{have - 1}
                </span>
              </li>
            );
          })}
        </ul>
        {lastCopies.length > 0 && (
          <p className="dialog-warning mono">
            Dernier exemplaire de {lastCopies.map((c) => c.name).join(", ")}. La carte quittera ta collection.
          </p>
        )}
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={onConfirm} autoFocus>
            Fusionner
          </button>
        </div>
      </div>
    </div>
  );
}
