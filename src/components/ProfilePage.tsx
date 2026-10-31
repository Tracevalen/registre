import { CARDS } from "../game/cards";
import { GRADES, gradeInfo } from "../game/grades";
import { formatReward, missionsForDay } from "../game/missions";
import { DAILY_INK, STREAK_BOOSTERS, STREAK_GOAL, type SaveData } from "../game/store";
import { Hex } from "./Nav";

interface Props {
  save: SaveData;
  onClaim: (missionId: string) => void;
}

/** Profil du joueur : grade, expérience et quelques chiffres. */
export function ProfilePage({ save, onClaim }: Props) {
  const missions = missionsForDay(save.daily.day);
  const streakDay = ((save.streak.days - 1) % STREAK_GOAL) + 1;
  const grade = gradeInfo(save.xp);
  const owned = CARDS.filter((c) => save.owned[c.id]).length;
  const fused = Object.values(save.linked).reduce((s, n) => s + n, 0);
  const stats = [
    { label: "Cartes obtenues", value: `${owned} / ${CARDS.length}` },
    { label: "Boosters ouverts", value: save.opened },
    { label: "Fusions", value: fused },
    { label: "Albums bouclés", value: save.albumsClaimed.length },
    { label: "Série de connexion", value: `${save.streak.days} j` },
    { label: "Encre", value: save.ink },
  ];
  return (
    <div className="profile">
      <section className="panel profile-head">
        <Hex className="hex-level hex-big">{grade.index + 1}</Hex>
        <div className="profile-who">
          <h1 className="title-serif">Invité</h1>
          <p className="label">
            {grade.current.name}
            {grade.next ? ` · ${grade.next.xp - save.xp} XP avant ${grade.next.name}` : " · grade maximal"}
          </p>
          <span className="bar">
            <span style={{ width: `${grade.progress * 100}%` }} />
          </span>
        </div>
      </section>
      <section className="panel missions-panel" id="quetes">
        <div className="panel-head">
          <h2 className="title-serif">Quêtes du jour</h2>
          <span className="label is-dim">Nouvelles à minuit</span>
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
                  <span>{formatReward(m.reward)}</span>
                </div>
                <span className="bar bar-green" aria-hidden>
                  <span style={{ width: `${(done / m.goal) * 100}%` }} />
                </span>
                {claimed ? (
                  <span className="mission-done label">Récupérée</span>
                ) : (
                  <button
                    className="btn-game btn-green btn-sm"
                    disabled={!ready}
                    onClick={() => onClaim(m.id)}
                  >
                    {ready ? "Récupérer" : `${done}/${m.goal}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="profile-note">
          Série de connexion : jour {streakDay}/{STREAK_GOAL} · +{STREAK_BOOSTERS} boosters au jour{" "}
          {STREAK_GOAL} · +{DAILY_INK} encre par jour
        </p>
      </section>

      <section className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="panel stat">
            <strong>{s.value}</strong>
            <span className="label">{s.label}</span>
          </div>
        ))}
      </section>
      <section className="panel">
        <p className="label">Grades</p>
        <ol className="grade-list">
          {GRADES.map((g, i) => (
            <li key={g.name} className={i <= grade.index ? "is-done" : ""}>
              <span>{i + 1}</span>
              {g.name}
              <em>{g.xp} XP</em>
            </li>
          ))}
        </ol>
      </section>
      <p className="profile-note">
        Les comptes (connexion Discord) arrivent bientôt : ta collection sera alors sauvegardée en ligne.
      </p>
    </div>
  );
}
