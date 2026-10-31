import type { ReactNode } from "react";
import { gradeInfo } from "../game/grades";

export type Page = "home" | "affaire" | "archive" | "albums" | "links" | "market" | "friends" | "profile";

const COLLECTION: Page[] = ["archive", "albums", "links"];

export const isCollection = (p: Page) => COLLECTION.includes(p);

/** Hexagone à bord doré (niveau, boutons, badges). */
export function Hex({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`hex ${className}`}>
      <span className="hex-in">{children}</span>
    </span>
  );
}

interface TopBarProps {
  boosters: number;
  ink: number;
  xp: number;
  onHome: () => void;
  onInk: () => void;
}

/** Barre du haut : niveau, joueur et barre d'XP, puis l'encre et les boosters en stock. */
export function TopBar({ boosters, ink, xp, onHome, onInk }: TopBarProps) {
  const grade = gradeInfo(xp);
  return (
    <header className="topbar">
      <button className="topbar-user" onClick={onHome} aria-label="Accueil">
        <Hex className="hex-level">{grade.index + 1}</Hex>
        <span className="topbar-who">
          <strong>Invité</strong>
          <span className="xpbar" aria-hidden>
            <span style={{ width: `${grade.progress * 100}%` }} />
          </span>
          <span className="topbar-xp">
            {grade.next ? `${xp} / ${grade.next.xp} XP` : `${xp} XP · ${grade.current.name}`}
          </span>
        </span>
      </button>
      <div className="topbar-pills">
        <span className="pill" title="Encre : sert à demander une carte précise">
          <span className="ico-diamond" aria-hidden />
          {ink}
          <button className="pill-plus" onClick={onInk} aria-label="Gagner de l'encre (broyer ses doublons)">
            +
          </button>
        </span>
        <span className="pill" title="Boosters en stock">
          <span className="ico-hexa" aria-hidden />
          {boosters}
        </span>
      </div>
    </header>
  );
}

const Icon = {
  collection: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="4" width="7" height="9" />
      <rect x="13" y="4" width="7" height="9" />
      <rect x="4" y="15" width="7" height="5" />
      <rect x="13" y="15" width="7" height="5" />
    </svg>
  ),
  market: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 8h14l-3-3M20 16H6l3 3" />
    </svg>
  ),
  boosters: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="7" y="3" width="12" height="16" rx="2" />
      <path d="M4 7v11a3 3 0 0 0 3 3h8" />
    </svg>
  ),
  friends: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8 0 5 2.2 5 5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
};

interface BottomNavProps {
  page: Page;
  onNavigate: (p: Page) => void;
  /** Une récompense attend dans la collection (album complet, duo prêt). */
  collectionBadge: number;
}

/** Barre du bas : quatre espaces, et les boosters au centre dans un hexagone. */
export function BottomNav({ page, onNavigate, collectionBadge }: BottomNavProps) {
  const item = (label: string, target: Page, icon: ReactNode, active: boolean, badge = 0) => (
    <button className={`nav-item ${active ? "is-active" : ""}`} onClick={() => onNavigate(target)}>
      {icon}
      {label}
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  );
  return (
    <nav className="bottomnav" aria-label="Navigation principale">
      {item("Collection", "archive", Icon.collection, isCollection(page), collectionBadge)}
      {item("Marché", "market", Icon.market, page === "market")}
      <button
        className={`nav-item nav-center ${page === "home" || page === "affaire" ? "is-active" : ""}`}
        onClick={() => onNavigate("home")}
      >
        <Hex className="hex-nav">{Icon.boosters}</Hex>
        Boosters
      </button>
      {item("Amis", "friends", Icon.friends, page === "friends")}
      {item("Profil", "profile", Icon.profile, page === "profile")}
    </nav>
  );
}

interface CollectionTabsProps {
  page: Page;
  onNavigate: (p: Page) => void;
  readyAlbums: number;
  readyLinks: number;
  /** Part de la collection obtenue, de 0 à 1. */
  progress: number;
  owned: number;
  total: number;
}

/** En-tête de la collection : titre, anneau de progression, onglets. */
export function CollectionTabs({
  page,
  onNavigate,
  readyAlbums,
  readyLinks,
  progress,
  owned,
  total,
}: CollectionTabsProps) {
  const tabs: { label: string; target: Page; badge: number }[] = [
    { label: "Séries", target: "albums", badge: readyAlbums },
    { label: "Cartes", target: "archive", badge: 0 },
    { label: "Duos", target: "links", badge: readyLinks },
  ];
  return (
    <div className="collection-head">
      <div className="collection-title">
        <div>
          <h1 className="title-serif">Collection</h1>
          <p className="label">
            <strong>{owned}</strong> / {total} cartes
          </p>
        </div>
        <span className="ring" style={{ ["--p" as string]: progress }}>
          <span>{Math.floor(progress * 100)}%</span>
        </span>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.target}
            role="tab"
            aria-selected={page === t.target}
            className={page === t.target ? "is-active" : ""}
            onClick={() => onNavigate(t.target)}
          >
            {t.label}
            {t.badge > 0 && <span className="tab-dot" aria-label={`${t.badge} à récupérer`} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Page provisoire pour ce qui demande des comptes joueurs (marché, amis). */
export function SoonPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel soon">
      <p className="label">Bientôt</p>
      <h1 className="title-serif">{title}</h1>
      <p>{text}</p>
    </section>
  );
}
