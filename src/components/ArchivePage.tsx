import { useMemo, useState } from "react";
import { CARDS, CARDS_BY_RARITY, formatFans, formatNumber, type Card } from "../game/cards";
import { SHRED_INK, shreddable } from "../game/economy";
import { RARITIES, RARITY_BY_ID, rarityRank, type Rarity } from "../game/rarities";
import type { SaveData } from "../game/store";
import { ConfirmDialog } from "./ConfirmDialog";
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
  const [ask, setAsk] = useState<"shred" | "reset" | null>(null);
  const [series, setSeries] = useState("all");
  const [kind, setKind] = useState<"all" | "game" | "character">("all");
  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [wantedOnly, setWantedOnly] = useState(false);
  const [dupOnly, setDupOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("number");
  const [view, setView] = useState<View>("grid");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const owned = (c: Card) => (save.owned[c.id] ?? 0) > 0;
    const out = CARDS.filter(
      (c) =>
        (rarity === "all" || c.rarity === rarity) &&
        (series === "all" || c.anime === series) &&
        (kind === "all" || c.kind === kind) &&
        (!ownedOnly || owned(c)) &&
        (!wantedOnly || save.wanted.includes(c.id)) &&
        (!dupOnly || (save.owned[c.id] ?? 0) > 1) &&
        // Une fiche non archivée reste cherchable par série, pas par nom.
        (!q || c.anime.toLowerCase().includes(q) || (owned(c) && c.name.toLowerCase().includes(q))),
    );
    if (sort === "rarity")
      out.sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || a.number - b.number);
    if (sort === "recent")
      out.sort((a, b) => (save.firstSeen[b.id] ?? 0) - (save.firstSeen[a.id] ?? 0) || a.number - b.number);
    return out;
  }, [rarity, series, kind, query, ownedOnly, wantedOnly, dupOnly, sort, save]);
  const dupCount = CARDS.filter((c) => (save.owned[c.id] ?? 0) > 1).length;

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
          <p className="kicker mono">Collection</p>
          <h1 className="archive-count">
            {String(total).padStart(3, "0")}
            <span>/{CARDS.length}</span>
          </h1>
        </div>
        <div className="segmented" role="group" aria-label="Filtrer par rareté">
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
                <strong>{r.short}</strong>
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
          placeholder="Rechercher un nom, un jeu ou une saga"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field" value={series} onChange={(e) => setSeries(e.target.value)}>
          <option value="all">Toutes les sagas</option>
          {SERIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="all">Jeux et personnages</option>
          <option value="game">Jeux</option>
          <option value="character">Personnages</option>
        </select>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="number">Tri · numéro</option>
          <option value="rarity">Tri · rareté</option>
          <option value="recent">Tri · récentes</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} />
          Obtenues seulement
        </label>
        <label className="check">
          <input type="checkbox" checked={dupOnly} onChange={(e) => setDupOnly(e.target.checked)} />
          Doublons ({dupCount})
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
            Tes doublons deviennent de l'encre. Avec l'encre, tu demandes l'accès à n'importe quelle carte. Un
            exemplaire de chaque carte est toujours gardé, et les Top secret ne sont jamais broyés.
          </p>
        </div>
        <div className="shredder-side">
          <span className="ink-count">
            <strong>{save.ink}</strong> encre
          </span>
          <button className="btn btn-sm" disabled={spare.count === 0} onClick={() => setAsk("shred")}>
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
              <Fiche
                key={c.id}
                card={c}
                secret={(save.secret[c.id] ?? 0) > 0}
                prestige={save.prestige[c.id] ?? 0}
                copies={save.owned[c.id] - 1}
                onClick={() => onFocus(c)}
              />
            ) : (
              <button
                key={c.id}
                className={`carte is-locked r-${c.rarity} ${save.wanted.includes(c.id) ? "is-wanted" : ""}`}
                onClick={() => onFocus(c)}
                aria-label={`Carte N°${formatNumber(c.number)}, ${RARITY_BY_ID[c.rarity].name}, pas encore obtenue`}
              >
                <div className="carte-art">
                  <svg className="carte-lock" viewBox="0 0 24 24" aria-hidden>
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  {save.wanted.includes(c.id) && <span className="carte-banner is-wanted">Recherchée</span>}
                </div>
                <div className="carte-foot">
                  <div className="carte-text">
                    <h3 className="carte-name">N°{formatNumber(c.number)}</h3>
                    <span className="carte-sub">{RARITY_BY_ID[c.rarity].name}</span>
                  </div>
                  <span className="carte-hex">{RARITY_BY_ID[c.rarity].short}</span>
                </div>
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
                <th>Rareté</th>
                <th>Nom</th>
                <th>Saga</th>
                <th className="num">Popularité</th>
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
        <button className="link mono" onClick={() => setAsk("reset")}>
          Réinitialiser la sauvegarde
        </button>
      </footer>

      {ask === "shred" && (
        <ConfirmDialog
          title="Broyeuse"
          icon="✦"
          confirmLabel={`Broyer (+${spare.ink})`}
          onConfirm={onShredAll}
          onCancel={() => setAsk(null)}
        >
          <p>
            <strong>
              {spare.count} doublon{spare.count > 1 ? "s" : ""}
            </strong>{" "}
            {spare.count > 1 ? "vont" : "va"} être broyé{spare.count > 1 ? "s" : ""}.
          </p>
          <p className="confirm-gain">
            <span className="ico-diamond" aria-hidden /> +{spare.ink} encre
          </p>
          <p className="confirm-note">
            Un exemplaire de chaque carte est gardé, et les Top secret ne sont jamais broyés.
          </p>
        </ConfirmDialog>
      )}

      {ask === "reset" && (
        <ConfirmDialog
          title="Tout effacer ?"
          icon="!"
          danger
          confirmLabel="Effacer"
          onConfirm={onReset}
          onCancel={() => setAsk(null)}
        >
          <p>Ta collection, ton encre et ta progression seront supprimées de ce navigateur.</p>
          <p className="confirm-note">Impossible de revenir en arrière.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
