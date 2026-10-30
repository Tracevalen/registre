import { formatLinkNumber, type Link } from "../game/links";

interface Props {
  link: Link;
  className?: string;
  onClick?: () => void;
}

/** Un dossier lié : les fiches de ses membres agrafées sous un même numéro. */
export function LinkedFiche({ link, className = "", onClick }: Props) {
  const Tag = onClick ? "button" : "article";

  return (
    <Tag className={`fiche linked-fiche class-${link.rarity} ${className}`} onClick={onClick}>
      <Paperclip />
      <div className="fiche-inner">
        <header className="fiche-head">
          <h3 className="fiche-name" title={link.title}>
            {link.title}
          </h3>
          <span className="fiche-class fiche-class-wide">{link.kind.toUpperCase()}</span>
        </header>

        <div className={`fiche-img linked-imgs n-${link.members.length}`}>
          {link.members.map((c) => (
            <img
              key={c.id}
              src={c.image}
              alt={c.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          ))}
          <span className="linked-stamp">Affaire liée</span>
          <span className="fiche-no">{formatLinkNumber(link.number)}</span>
        </div>

        <footer className="fiche-series" title={link.anime}>
          {link.anime}
        </footer>
      </div>
    </Tag>
  );
}

function Paperclip() {
  return (
    <svg className="paperclip" viewBox="0 0 24 64" aria-hidden>
      <path d="M8 22V10a5 5 0 0 1 10 0v40a8 8 0 0 1-16 0V16" />
    </svg>
  );
}
