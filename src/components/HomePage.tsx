import { CARDS, CARDS_BY_RARITY, formatNumber, type Card } from "../game/cards";
import { CARDS_PER_BOOSTER, formatOdds, PITY_LIMIT, slotOdds } from "../game/booster";
import { RARITIES } from "../game/rarities";
import { formatReward, missionsForDay } from "../game/missions";
import { specialSeries } from "../game/series";
import { MAX_GUESSES } from "../game/affaire";
import { gradeInfo, XP } from "../game/grades";
import { DAILY_INK, MAX_BOOSTERS, STREAK_BOOSTERS, STREAK_GOAL, type SaveData } from "../game/store";
import { formatDate, formatDuration, plural } from "../lib/format";
import { Fiche } from "./Fiche";

interface Props {
  save: SaveData;
  nextIn: number;
  onOpen: () => void;
  onOpenSpecial: () => void;
  onShowAffaire: () => void;
  onOpenAll: () => void;
  onShowArchive: () => void;
  onFocus: (c: Card) => void;
  onClaim: (missionId: string) => void;
}

export function HomePage({
  save,
  nextIn,
  onOpen,
  onOpenSpecial,
  onShowAffaire,
  onOpenAll,
  onShowArchive,
  onFocus,
  onClaim,
}: Props) {
  const special = specialSeries(save.daily.day);
  const specialHave = special.cards.filter((c) => save.owned[c.id]).length;
  const pityLeft = Math.max(1, PITY_LIMIT - save.pity);
  const grade = gradeInfo(save.xp);
  const affaire = save.daily.affaire;
  const streakDay = ((save.streak.days - 1) % STREAK_GOAL) + 1;
  const missions = missionsForDay(save.daily.day);
  const ownedCount = CARDS.filter((c) => save.owned[c.id]).length;
  const recent = CARDS.filter((c) => save.firstSeen[c.id])
    .sort((a, b) => save.firstSeen[b.id] - save.firstSeen[a.id])
    .slice(0, 6);
  const missionsDone = missions.filter((m) => (save.daily.counts[m.counter] ?? 0) >= m.goal).length;
  // Trois fiches en éventail : les plus rares du joueur, sinon les plus populaires du registre.
  const byFans = [...CARDS].sort((a, b) => b.favourites - a.favourites);
  const mine = byFans.filter((c) => save.owned[c.id] && (c.rarity === "A" || c.rarity === "B"));
  const showcase = [...mine, ...byFans.filter((c) => !mine.includes(c))].slice(0, 3);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Série 01 · {CARDS.length} personnages</p>
          <h1 className="hero-title">
            Chaque perso
            <br />a sa fiche.
          </h1>
          <p className="hero-lede">
            Ouvre des dossiers de {CARDS_PER_BOOSTER} fiches et complète le registre. Plus un personnage a de
            fans sur AniList, plus sa fiche est rare.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOpen} disabled={save.boosters <= 0}>
              {save.boosters > 0 ? "Ouvrir un dossier" : `Prochain dossier dans ${formatDuration(nextIn)}`}
            </button>
            {save.boosters > 1 ? (
              <button className="btn btn-ghost" onClick={onOpenAll}>
                Tout ouvrir ({save.boosters})
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={onShowArchive}>
                Voir ma collection
              </button>
            )}
          </div>
        </div>

        <div className="hero-fan" aria-hidden>
          {showcase.map((c, i) => (
            <Fiche key={c.id} card={c} className={`fan-${i}`} />
          ))}
        </div>
      </section>

      <ul className="pills">
        <li className="pill pill-boosters">
          <span className="pill-icon">▤</span>
          <strong>
            {save.boosters}/{MAX_BOOSTERS}
          </strong>
          <span>dossiers{save.boosters < MAX_BOOSTERS && <> · +1 dans {formatDuration(nextIn)}</>}</span>
        </li>
        <li className="pill pill-missions">
          <span className="pill-icon">◎</span>
          <strong>
            {missionsDone}/{missions.length}
          </strong>
          <span>enquêtes du jour</span>
        </li>
        <li className="pill pill-ink">
          <span className="pill-icon">✒</span>
          <strong>{save.ink}</strong>
          <span>encre</span>
        </li>
        <li className="pill pill-pity">
          <span className="pill-icon">★</span>
          <strong>{pityLeft}</strong>
          <span>avant une fiche A garantie</span>
        </li>
        <li className="pill pill-streak">
          <span className="pill-icon">⟳</span>
          <strong>
            J{streakDay}/{STREAK_GOAL}
          </strong>
          <span>série de connexion</span>
        </li>
        <li className="pill pill-grade">
          <span className="pill-icon">◈</span>
          <strong>{grade.current.name}</strong>
          <span>
            {grade.next ? `${grade.next.xp - save.xp} XP avant ${grade.next.name}` : "grade maximal"}
          </span>
        </li>
        <li className="pill pill-collection">
          <span className="pill-icon">◆</span>
          <strong>
            {ownedCount}/{CARDS.length}
          </strong>
          <span>fiches archivées</span>
        </li>
      </ul>

      <section className={`special ${save.daily.special ? "is-used" : ""}`}>
        <div className="special-copy">
          <p className="hero-eyebrow">Dossier spécial du jour · gratuit</p>
          <h2 className="special-title">{special.series}</h2>
          <p className="special-lede">
            5 fiches tirées uniquement dans cette série, dont une classe C ou mieux si la série en a. Tu as{" "}
            {specialHave}/{special.cards.length} fiches de cet album.
          </p>
        </div>
        <button className="btn btn-primary special-btn" onClick={onOpenSpecial} disabled={save.daily.special}>
          {save.daily.special ? "Déjà ouvert, nouveau dossier demain" : "Ouvrir le dossier spécial"}
        </button>
      </section>

      <button className={`affaire-teaser ${affaire.done ? "is-done" : ""}`} onClick={onShowAffaire}>
        <span className="affaire-teaser-mark" aria-hidden>
          ?
        </span>
        <span className="affaire-teaser-text">
          <strong>Affaire du jour</strong>
          <span>
            {affaire.done
              ? affaire.won
                ? `Résolue en ${affaire.guesses.length}/${MAX_GUESSES}. Reviens demain pour un nouveau suspect.`
                : "Non résolue. Nouveau suspect demain."
              : `Identifie le personnage mystère en ${MAX_GUESSES} essais et gagne sa fiche, de l'encre et ${XP.affaire} XP.`}
          </span>
        </span>
        <span className="affaire-teaser-cta">{affaire.done ? "Voir" : "Enquêter"}</span>
      </button>

      <p className="streak-note mono">
        +{DAILY_INK} encre à chaque première visite du jour · +{STREAK_BOOSTERS} dossiers tous les{" "}
        {STREAK_GOAL} jours de série
      </p>

      <section className="section">
        <div className="section-head">
          <h2>Enquêtes du jour</h2>
          <p className="mono">Nouvelles enquêtes à minuit</p>
        </div>
        <ul className="missions">
          {missions.map((m) => {
            const done = Math.min(save.daily.counts[m.counter] ?? 0, m.goal);
            const claimed = save.daily.claimed.includes(m.id);
            const ready = done >= m.goal && !claimed;
            return (
              <li key={m.id} className={`mission ${ready ? "is-ready" : ""} ${claimed ? "is-claimed" : ""}`}>
                <div className="mission-text">
                  <strong>{m.label}</strong>
                  <span className="mono">{formatReward(m.reward)}</span>
                </div>
                <span className="mission-track" aria-hidden>
                  <span className="mission-fill" style={{ width: `${(done / m.goal) * 100}%` }} />
                </span>
                <span className="mission-count mono">
                  {done}/{m.goal}
                </span>
                {claimed ? (
                  <span className="mission-stamp mono">Classée</span>
                ) : (
                  <button className="btn btn-sm btn-primary" disabled={!ready} onClick={() => onClaim(m.id)}>
                    Récupérer
                  </button>
                )}
              </li>
            );
          })}
        </ul>
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
