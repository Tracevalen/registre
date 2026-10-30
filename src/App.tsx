import { useState } from "react";
import { Header, type Page } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { ArchivePage } from "./components/ArchivePage";
import { OpeningScreen } from "./components/OpeningScreen";
import { FicheModal } from "./components/FicheModal";
import { LinksPage } from "./components/LinksPage";
import { LinkModal } from "./components/LinkModal";
import { openBooster, type Pull } from "./game/booster";
import type { Card } from "./game/cards";
import { canFuse, LINKS, type Link } from "./game/links";
import { useSave } from "./game/store";

export default function App() {
  const { save, spendBooster, fuse, setKeepOne, reset, nextIn } = useSave();
  const [page, setPage] = useState<Page>("home");
  const [pull, setPull] = useState<Pull | null>(null);
  const [focus, setFocus] = useState<Card | null>(null);
  const [focusLink, setFocusLink] = useState<{ link: Link; fresh: boolean } | null>(null);

  const readyLinks = LINKS.filter((l) => canFuse(save, l)).length;

  const fuseLink = (link: Link) => {
    if (!canFuse(save, link)) return;
    fuse(link);
    setFocusLink({ link, fresh: true });
  };

  const open = () => {
    if (save.boosters <= 0) return;
    const cards = openBooster();
    const fresh = new Set(cards.filter((c) => !save.owned[c.id]).map((c) => c.id));
    spendBooster(cards.map((c) => c.id));
    setPull({ id: save.opened + 1, cards, fresh });
  };

  return (
    <>
      <Header
        page={page}
        onNavigate={setPage}
        boosters={save.boosters}
        nextIn={nextIn}
        readyLinks={readyLinks}
      />

      <main className="main">
        {page === "home" ? (
          <HomePage
            save={save}
            nextIn={nextIn}
            onOpen={open}
            onShowArchive={() => setPage("archive")}
            onFocus={setFocus}
          />
        ) : page === "archive" ? (
          <ArchivePage save={save} onFocus={setFocus} onReset={reset} />
        ) : (
          <LinksPage
            save={save}
            onFuse={fuseLink}
            onOpenLink={(link) => setFocusLink({ link, fresh: false })}
            onFocusCard={setFocus}
            onKeepOneChange={setKeepOne}
          />
        )}
      </main>

      {pull && (
        <OpeningScreen
          key={pull.id}
          pull={pull}
          boostersLeft={save.boosters}
          onAgain={open}
          onClose={() => setPull(null)}
          onShowArchive={() => {
            setPull(null);
            setPage("archive");
          }}
        />
      )}

      {focus && (
        <FicheModal
          card={focus}
          count={save.owned[focus.id] ?? 0}
          firstSeen={save.firstSeen[focus.id]}
          onClose={() => setFocus(null)}
        />
      )}

      {focusLink && (
        <LinkModal
          key={focusLink.link.id}
          link={focusLink.link}
          count={save.linked[focusLink.link.id] ?? 0}
          firstFused={save.linkedFirst[focusLink.link.id]}
          fresh={focusLink.fresh}
          onClose={() => setFocusLink(null)}
        />
      )}
    </>
  );
}
