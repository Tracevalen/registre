import { useMemo, useState } from "react";
import { CARDS, CARDS_BY_RARITY, formatFans, formatNumber, type Card } from "../game/cards";
import { SHRED_INK, shreddable } from "../game/economy";
import { RARITIES, rarityRank, type Rarity } from "../game/rarities";
import type { SaveData } from "../game/store";
import { Fiche } from "./Fiche";

type Sort = "number" | "rarity" | "recent";
type View = "grid" | "list";

interface Props {
  save: SaveData;
  onFocus: (c: Card) => void;
  onShredAll: () => void;
  onReset: () => void;
}

const SERIES = [...new Set(CARDS.map((c) => c.anime))].sort((a, b) => a.localeCompare(b));

export function ArchivePage({ save, onFocus, onShredAll, onReset }: Props) {
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [series, setSeries] = useState("all");
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [wantedOnly, setWantedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("number");
  const [view, setView] = useState<View>("grid");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const owned = (c: Card) => (save.owned[c.id] ?? 0) > 0;
    const out = CARDS.filter(
      (c) =>
        (rarity === "all" || c.rarity === rarity) &&
        (series === "all" || c.anime === series) &&
        (!ownedOnly || owned(c)) &&
        (!wantedOnly || save.wanted.includes(c.id)) &&
        // Une fiche non archivée reste cherchable par série, pas par nom.
        (!q || c.anime.toLowerCase().includes(q) || (owned(c) && c.name.toLowerCase().includes(q))),
    );
    if (sort === "rarity")
      out.sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || a.number - b.number);
    if (sort === "recent")
      out.sort((a, b) => (save.firstSeen[b.id] ?? 0) - (save.firstSeen[a.id] ?? 0) || a.number - b.number);
    return out;
  }, [rarity, series, query, ownedOnly, wantedOnly, sort, save]);

  const total = CARDS.filter((c) => save.owned[c.id]).length;
  const spare = CARDS.reduce(
    (acc, c) => {
      const n = shreddable(save, c.id);
      return { count: acc.count + n, ink: acc.ink + n * SHRED_INK[c.rarity] };
    },
    { count: 0, ink: 0 },
  );

  return (
    <div className="archive">
      <div className="archive-head">
        <div>
          <p className="kicker mono">Archive</p>
          <h1 className="archive-count">
            {String(total).padStart(3, "0")}
            <span>/{CARDS.length}</span>
          </h1>
        </div>
        <div className="segmented" role="group" aria-label="Filtrer par classe">
          <button className={rarity === "all" ? "is-active" : ""} onClick={() => setRarity("all")}>
            <strong>Tout</strong>
            <span className="mono">
              {total}/{CARDS.length}
            </span>
          </button>
          {[...RARITIES].reverse().map((r) => {
            const pool = CARDS_BY_RARITY[r.id];
            const have = pool.filter((c) => save.owned[c.id]).length;
            return (
              <button
                key={r.id}
                className={rarity === r.id ? "is-active" : ""}
                onClick={() => setRarity(rarity === r.id ? "all" : r.id)}
              >
                <strong>{r.id}</strong>
                <span className="mono">
                  {have}/{pool.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="toolbar">
        <input
          className="field field-search"
          type="search"
          placeholder="Rechercher un nom ou une série"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field" value={series} onChange={(e) => setSeries(e.target.value)}>
          <option value="all">Toutes les séries</option>
          {SERIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="number">Tri · numéro</option>
          <option value="rarity">Tri · classe</option>
          <option value="recent">Tri · récentes</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
          Archivées seulement
        </label>
        <label className="check">
          <input type="checkbox" checked={wantedOnly} onChange={(e) => setWantedOnly(e.target.checked)} />
          Avis de recherche ({save.wanted.length})
        </label>
        <div className="view-toggle" role="group" aria-label="Affichage">
          <button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")}>
            Grille
          </button>
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>
            Liste
          </button>
        </div>
      </div>

      <div className="shredder">
        <div>
          <strong>Broyeuse</strong>
          <p>
            Tes doublons deviennent de l'encre. Avec l'encre, tu demandes l'accès à n'importe quelle fiche. Un
            exemplaire de chaque fiche est toujours gardé, et les Top secret ne sont jamais broyés.
          </p>
        </div>
        <div className="shredder-side">
          <span className="ink-count">
            <strong>{save.ink}</strong> encre
          </span>
          <button
            className="btn btn-sm"
            disabled={spare.count === 0}
            onClick={() =>
              window.confirm(
                `Broyer ${spare.count} doublon${spare.count > 1 ? "s" : ""} pour ${spare.ink} encre ?`,
              ) && onShredAll()
            }
          >
            {spare.count
              ? `Broyer ${spare.count} doublon${spare.count > 1 ? "s" : ""} (+${spare.ink})`
              : "Aucun doublon"}
          </button>
        </div>
      </div>

      <p className="result-count mono">{list.length} résultats</p>

      {list.length === 0 ? (
        <p className="empty mono">Aucune fiche ne correspond.</p>
      ) : view === "grid" ? (
        <div className="grid">
          {list.map((c) =>
            save.owned[c.id] ? (
              <div key={c.id} className="grid-item">
                <Fiche card={c} secret={(save.secret[c.id] ?? 0) > 0} onClick={() => onFocus(c)} />
                {save.owned[c.id] > 1 && <span className="copies mono">×{save.owned[c.id]}</span>}
              </div>
            ) : (
              <button
                key={c.id}
                className={`grid-item empty-fiche class-${c.rarity} ${save.wanted.includes(c.id) ? "is-wanted" : ""}`}
                onClick={() => onFocus(c)}
              >
                <div className="empty-fiche-head mono">
                  <span>N°{formatNumber(c.number)}</span>
                  <span className="empty-fiche-class">{c.rarity}</span>
                </div>
                <div className="empty-fiche-body">
                  <span className="redacted" />
                  <span className="redacted short" />
                  <span className="empty-fiche-label mono">
                    {save.wanted.includes(c.id) ? "Avis de recherche" : "Non archivée"}
                  </span>
                </div>
                <div className="empty-fiche-series">{c.anime}</div>
              </button>
            ),
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table table-full">
            <thead>
              <tr>
                <th>N°</th>
                <th>Classe</th>
                <th>Nom</th>
                <th>Série</th>
                <th className="num">Fans</th>
                <th className="num">Ex.</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const count = save.owned[c.id] ?? 0;
                return (
                  <tr
                    key={c.id}
                    className={count ? "is-clickable" : "is-missing is-clickable"}
                    onClick={() => onFocus(c)}
                  >
                    <td className="mono">{formatNumber(c.number)}</td>
                    <td>
                      <span className={`class-chip class-${c.rarity}`}>{c.rarity}</span>
                    </td>
                    <td className="table-name">{count ? c.name : <span className="redacted inline" />}</td>
                    <td className="table-muted">{c.anime}</td>
                    <td className="mono num">{count ? formatFans(c.favourites) : "—"}</td>
                    <td className="mono num">{count || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="archive-foot">
        <button
          className="link mono"
          onClick={() => window.confirm("Effacer tout le registre de ce navigateur ?") && onReset()}
        >
          Réinitialiser la sauvegarde
        </button>
      </footer>
    </div>
  );
}
