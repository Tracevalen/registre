import { MAX_BOOSTERS } from "../game/store";
import { formatDuration } from "../lib/format";

export type Page = "home" | "archive" | "albums" | "links";

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  boosters: number;
  ink: number;
  nextIn: number;
  /** Nombre de dossiers liés prêts à être agrafés. */
  readyLinks: number;
  /** Nombre d'albums complets dont la récompense attend. */
  readyAlbums: number;
}

export function Header({ page, onNavigate, boosters, ink, nextIn, readyLinks, readyAlbums }: Props) {
  return (
    <header className="header">
      <button className="wordmark" onClick={() => onNavigate("home")}>
        Registre
      </button>
      <nav className="nav">
        <button className={page === "home" ? "is-active" : ""} onClick={() => onNavigate("home")}>
          Dossiers
        </button>
        <button className={page === "archive" ? "is-active" : ""} onClick={() => onNavigate("archive")}>
          Archive
        </button>
        <button className={page === "albums" ? "is-active" : ""} onClick={() => onNavigate("albums")}>
          Albums
          {readyAlbums > 0 && (
            <span className="nav-badge mono" aria-label={`${readyAlbums} à récupérer`}>
              {readyAlbums}
            </span>
          )}
        </button>
        <button className={page === "links" ? "is-active" : ""} onClick={() => onNavigate("links")}>
          Liaisons
          {readyLinks > 0 && (
            <span className="nav-badge mono" aria-label={`${readyLinks} prêts`}>
              {readyLinks}
            </span>
          )}
        </button>
      </nav>
      <div className="header-status mono">
        <span>
          Dossiers <strong>{boosters}</strong>/{MAX_BOOSTERS}
        </span>
        {boosters < MAX_BOOSTERS && <span className="header-timer">+1 dans {formatDuration(nextIn)}</span>}
        <span className="header-ink">
          Encre <strong>{ink}</strong>
        </span>
      </div>
    </header>
  );
}
