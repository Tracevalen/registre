import { CARDS, CARDS_BY_RARITY, formatNumber, type Card } from "../game/cards";
import { CARDS_PER_BOOSTER, formatOdds, slotOdds } from "../game/booster";
import { RARITIES } from "../game/rarities";
import { MAX_BOOSTERS, type SaveData } from "../game/store";
import { formatDate, formatDuration, plural } from "../lib/format";
import { Dossier } from "./Dossier";

interface Props {
  save: SaveData;
  nextIn: number;
  onOpen: () => void;
  onShowArchive: () => void;
  onFocus: (c: Card) => void;
}

export function HomePage({ save, nextIn, onOpen, onShowArchive, onFocus }: Props) {
  const ownedCount = CARDS.filter((c) => save.owned[c.id]).length;
  const recent = CARDS.filter((c) => save.firstSeen[c.id])
    .sort((a, b) => save.firstSeen[b.id] - save.firstSeen[a.id])
    .slice(0, 6);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker mono">Série 01 · {CARDS.length} personnages · 5 classes</p>
          <h1 className="hero-title">
            Chaque personnage
            <br />a sa fiche.
          </h1>
          <p className="hero-lede">
            Ouvre des dossiers scellés de {CARDS_PER_BOOSTER} fiches et complète le registre. La classe d'un
            personnage dépend de sa popularité sur AniList&nbsp;: plus il a de fans, plus il est rare.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOpen} disabled={save.boosters <= 0}>
              Ouvrir un dossier
            </button>
            <p className="hero-status mono">
              {save.boosters}/{MAX_BOOSTERS} disponibles
              {save.boosters < MAX_BOOSTERS && <> · prochain dans {formatDuration(nextIn)}</>}
            </p>
          </div>
        </div>

        <div className="hero-stack" aria-hidden>
          {save.boosters === 0 ? (
            <div className="hero-empty mono">Aucun dossier disponible</div>
          ) : (
            Array.from({ length: Math.min(save.boosters, 3) }).map((_, i, all) => (
              <Dossier
                key={i}
                number={save.opened + all.length - i}
                className={`depth-${all.length - 1 - i}`}
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Répartition</h2>
          <p className="mono">Probabilité par fiche · la 5ᵉ fiche est toujours classe D ou mieux</p>
        </div>
        <div className="distribution">
          {[...RARITIES].reverse().map((r) => (
            <div
              key={r.id}
              className={`dist-col class-${r.id}`}
              style={{ flexGrow: Math.max(slotOdds(r.id), 6) }}
            >
              <div className="dist-bar" />
              <div className="dist-letter">{r.id}</div>
              <div className="dist-name">{r.name}</div>
              <div className="dist-figures mono">
                <span>{formatOdds(slotOdds(r.id))}</span>
                <span>{CARDS_BY_RARITY[r.id].length} fiches</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <div className="section-head">
            <h2>Progression</h2>
            <p className="mono">
              {plural(save.opened, "dossier")} ouvert{save.opened > 1 ? "s" : ""}
            </p>
          </div>
          <div className="big-count">
            <span>{String(ownedCount).padStart(3, "0")}</span>
            <span className="big-count-total">/{CARDS.length}</span>
          </div>
          <ul className="progress-list">
            {[...RARITIES].reverse().map((r) => {
              const pool = CARDS_BY_RARITY[r.id];
              const have = pool.filter((c) => save.owned[c.id]).length;
              return (
                <li key={r.id} className={`class-${r.id}`}>
                  <span className="progress-letter">{r.id}</span>
                  <span className="progress-track">
                    <span className="progress-fill" style={{ width: `${(have / pool.length) * 100}%` }} />
                  </span>
                  <span className="mono">
                    {have}/{pool.length}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="section-head">
            <h2>Dernières entrées</h2>
            <button className="link mono" onClick={onShowArchive}>
              Voir l'archive →
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="empty mono">Registre vide. Ouvre ton premier dossier.</p>
          ) : (
            <table className="table">
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} onClick={() => onFocus(c)} className="is-clickable">
                    <td className="mono">N°{formatNumber(c.number)}</td>
                    <td>
                      <span className={`class-chip class-${c.rarity}`}>{c.rarity}</span>
                    </td>
                    <td className="table-name">{c.name}</td>
                    <td className="mono table-muted">{formatDate(save.firstSeen[c.id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
