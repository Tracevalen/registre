import { gradeInfo } from "../game/grades";
import { MAX_BOOSTERS } from "../game/store";

export type Page = "home" | "affaire" | "archive" | "albums" | "links" | "market" | "friends";

const COLLECTION: Page[] = ["archive", "albums", "links"];

interface TopBarProps {
  boosters: number;
  ink: number;
  xp: number;
  onHome: () => void;
}

/** Barre du haut : le joueur (invité tant qu'il n'y a pas de comptes), l'encre et le stock. */
export function TopBar({ boosters, ink, xp, onHome }: TopBarProps) {
  const grade = gradeInfo(xp);
  return (
    <header className="topbar">
      <button className="topbar-user" onClick={onHome} aria-label="Accueil">
        <span className="avatar" aria-hidden>
          I
        </span>
        <span className="topbar-who">
          <strong>Invité</strong>
          <span title={grade.next ? `${grade.next.xp - xp} XP avant ${grade.next.name}` : "Grade maximal"}>
            {grade.current.name}
          </span>
        </span>
      </button>
      <div className="topbar-pills">
        <span className="pill" title="Encre : sert à demander une carte précise">
          <span className="pill-dot is-ink" aria-hidden /> {ink}
        </span>
        <span className="pill" title="Boosters en stock">
          <span className="pill-dot" aria-hidden /> {boosters}/{MAX_BOOSTERS}
        </span>
      </div>
    </header>
  );
}

interface BottomNavProps {
  page: Page;
  onNavigate: (p: Page) => void;
  /** Une récompense attend dans la collection (album complet, duo prêt). */
  collectionBadge: number;
}

/** Barre du bas : les quatre espaces du site. */
export function BottomNav({ page, onNavigate, collectionBadge }: BottomNavProps) {
  const items: { label: string; target: Page; active: boolean; badge?: number }[] = [
    { label: "Boosters", target: "home", active: page === "home" || page === "affaire" },
    { label: "Collection", target: "archive", active: COLLECTION.includes(page), badge: collectionBadge },
    { label: "Marché", target: "market", active: page === "market" },
    { label: "Amis", target: "friends", active: page === "friends" },
  ];
  return (
    <nav className="bottomnav" aria-label="Navigation principale">
      {items.map((it) => (
        <button key={it.label} className={it.active ? "is-active" : ""} onClick={() => onNavigate(it.target)}>
          {it.label}
          {!!it.badge && <span className="nav-badge">{it.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

interface CollectionTabsProps {
  page: Page;
  onNavigate: (p: Page) => void;
  readyAlbums: number;
  readyLinks: number;
}

/** Les onglets de la collection : cartes, albums par saga, duos et trios. */
export function CollectionTabs({ page, onNavigate, readyAlbums, readyLinks }: CollectionTabsProps) {
  const tabs: { label: string; target: Page; badge: number }[] = [
    { label: "Cartes", target: "archive", badge: 0 },
    { label: "Albums", target: "albums", badge: readyAlbums },
    { label: "Duos & trios", target: "links", badge: readyLinks },
  ];
  return (
    <div className="count-picker collection-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.target}
          role="tab"
          aria-selected={page === t.target}
          className={page === t.target ? "is-active" : ""}
          onClick={() => onNavigate(t.target)}
        >
          {t.label}
          {t.badge > 0 && <span className="nav-badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export const isCollection = (p: Page) => COLLECTION.includes(p);

/** Page provisoire pour ce qui demande des comptes joueurs (marché, amis). */
export function SoonPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass soon">
      <p className="eyebrow">Bientôt</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}
