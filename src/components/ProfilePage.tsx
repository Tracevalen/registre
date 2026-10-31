import { CARDS } from "../game/cards";
import { GRADES, gradeInfo } from "../game/grades";
import type { SaveData } from "../game/store";
import { Hex } from "./Nav";

interface Props {
  save: SaveData;
}

/** Profil du joueur : grade, expérience et quelques chiffres. */
export function ProfilePage({ save }: Props) {
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
