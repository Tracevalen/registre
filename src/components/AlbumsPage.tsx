import { useMemo, useState } from "react";
import type { Card } from "../game/cards";
import { ALBUMS } from "../game/series";
import type { SaveData } from "../game/store";

type Filter = "all" | "started" | "ready" | "done";

interface Props {
  save: SaveData;
  onFocus: (c: Card) => void;
  onClaim: (series: string) => void;
}

/** Un album par série : le compléter rapporte de l'encre, et des dossiers pour les gros albums. */
export function AlbumsPage({ save, onFocus, onClaim }: Props) {
  const [filter, setFilter] = useState<Filter>("started");

  const rows = useMemo(
    () =>
      ALBUMS.map((album) => {
        const have = album.cards.filter((c) => save.owned[c.id]).length;
        const claimed = save.albumsClaimed.includes(album.series);
        const complete = have === album.cards.length;
        return { album, have, claimed, ready: complete && !claimed };
      }).sort(
        (a, b) =>
          Number(b.ready) - Number(a.ready) ||
          b.have / b.album.cards.length - a.have / a.album.cards.length ||
          b.album.cards.length - a.album.cards.length,
      ),
    [save],
  );

  const counts = {
    all: rows.length,
    started: rows.filter((r) => r.have > 0).length,
    ready: rows.filter((r) => r.ready).length,
    done: rows.filter((r) => r.claimed).length,
  };

  const list = rows.filter(
    (r) =>
      filter === "all" ||
      (filter === "started" && r.have > 0) ||
      (filter === "ready" && r.ready) ||
      (filter === "done" && r.claimed),
  );

  return (
    <div className="archive albums">
      <div className="archive-head">
        <div>
          <p className="kicker mono">Albums par série</p>
          <h1 className="archive-count">
            {String(counts.done).padStart(2, "0")}
            <span>/{rows.length}</span>
          </h1>
        </div>
        <div className="segmented" role="group" aria-label="Filtrer les albums">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "is-active" : ""} onClick={() => setFilter(f.id)}>
              <strong>{f.label}</strong>
              <span className="mono">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="links-intro-text">
        Complète toutes les cartes d'une saga pour boucler son album. Chaque album rapporte 10 encre par
        carte, et les albums de 5 cartes ou plus offrent aussi des boosters.
      </p>

      {list.length === 0 ? (
        <p className="empty mono">
          {filter === "started"
            ? "Aucun album commencé. Ouvre des boosters pour en lancer un."
            : "Aucun album ici."}
        </p>
      ) : (
        <div className="albums-grid">
          {list.map(({ album, have, claimed, ready }) => (
            <article
              key={album.series}
              className={`album ${ready ? "is-ready" : ""} ${claimed ? "is-claimed" : ""}`}
            >
              <header className="album-head">
                <h3>{album.series}</h3>
                <span className="mono">
                  {have}/{album.cards.length}
                </span>
              </header>
              <span className="mission-track" aria-hidden>
                <span className="mission-fill" style={{ width: `${(have / album.cards.length) * 100}%` }} />
              </span>
              <ul className="album-cards">
                {album.cards.map((c) =>
                  save.owned[c.id] ? (
                    <li key={c.id}>
                      <button
                        className={`album-thumb class-${c.rarity}`}
                        onClick={() => onFocus(c)}
                        title={c.name}
                      >
                        <img src={c.image} alt={c.name} loading="lazy" referrerPolicy="no-referrer" />
                      </button>
                    </li>
                  ) : (
                    <li key={c.id}>
                      <button
                        className={`album-thumb is-missing class-${c.rarity}`}
                        onClick={() => onFocus(c)}
                        aria-label={`Carte de rareté ${c.rarity} pas encore obtenue`}
                      >
                        <span>{c.rarity}</span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
              <footer className="album-foot">
                <span className="mono">
                  +{album.reward} encre
                  {album.bonusBoosters > 0 &&
                    ` · +${album.bonusBoosters} booster${album.bonusBoosters > 1 ? "s" : ""}`}
                </span>
                {claimed ? (
                  <span className="mission-stamp mono">Bouclé</span>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!ready}
                    onClick={() => onClaim(album.series)}
                  >
                    Récupérer
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "started", label: "En cours" },
  { id: "ready", label: "Complets" },
  { id: "done", label: "Bouclés" },
  { id: "all", label: "Tous" },
];
