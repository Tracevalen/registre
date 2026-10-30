import { formatLinkNumber, type Link } from "../game/links";
import { Barcode } from "./Barcode";

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
          <span className="fiche-no">{formatLinkNumber(link.number)}</span>
          <span className="fiche-class fiche-class-wide" title={link.kind === "duo" ? "Duo" : "Trio"}>
            {link.kind.toUpperCase()}
          </span>
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
        </div>

        <div className="fiche-body">
          <h3 className="fiche-name">{link.title}</h3>
          <dl className="fiche-data">
            <dt>Série</dt>
            <dd>{link.anime}</dd>
            <dt>Pièces</dt>
            <dd>{link.members.length} fiches agrafées</dd>
          </dl>
        </div>

        <footer className="fiche-foot">
          <Barcode value={link.number * 7919 + 100003} />
          <span className="fiche-id">{link.kind === "duo" ? "Duo" : "Trio"} · liaison</span>
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
