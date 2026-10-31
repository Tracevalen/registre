import { useState } from "react";
import { BottomNav, CollectionTabs, isCollection, SoonPage, TopBar, type Page } from "./components/Nav";
import { HomePage } from "./components/HomePage";
import { ArchivePage } from "./components/ArchivePage";
import { OpeningScreen } from "./components/OpeningScreen";
import { FicheModal } from "./components/FicheModal";
import { LinksPage } from "./components/LinksPage";
import { LinkModal } from "./components/LinkModal";
import {
  openBooster,
  PITY_LIMIT,
  rollSecrets,
  sortByRarity,
  type BoosterGroup,
  type Pull,
} from "./game/booster";
import type { Card } from "./game/cards";
import { canFuse, LINKS, type Link } from "./game/links";
import { ALBUMS, specialSeries } from "./game/series";
import { useSave } from "./game/store";
import { AlbumsPage } from "./components/AlbumsPage";
import { AffairePage } from "./components/AffairePage";

export default function App() {
  const {
    save,
    spendBooster,
    fuse,
    shred,
    request,
    toggleWanted,
    claim,
    claimAlbum,
    guessAffaire,
    upgradePrestige,
    setKeepOne,
    reset,
    nextIn,
  } = useSave();
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

  const readyAlbums = ALBUMS.filter(
    (a) => !save.albumsClaimed.includes(a.series) && a.cards.every((c) => save.owned[c.id]),
  ).length;

  /** Ouvre `count` boosters d'un coup (ou le booster spécial du jour). */
  const open = (count = 1, special = false) => {
    const n = special ? 1 : Math.min(count, save.boosters);
    if (special ? save.daily.special : n <= 0) return;
    const groups: BoosterGroup[] = [];
    const fresh = new Set<number>();
    const seen = new Set(
      Object.keys(save.owned)
        .filter((id) => save.owned[Number(id)])
        .map(Number),
    );
    let pity = save.pity;
    for (let i = 0; i < n; i++) {
      const cards = special
        ? openBooster({ pool: specialSeries(save.daily.day).cards })
        : openBooster({ guaranteeA: pity + 1 >= PITY_LIMIT });
      const secret = rollSecrets(cards.length);
      pity = cards.some((c) => c.rarity === "A") ? 0 : pity + 1;
      for (const c of cards) {
        if (!seen.has(c.id)) fresh.add(c.id);
        seen.add(c.id);
      }
      spendBooster(cards, secret, special);
      groups.push(sortByRarity(cards, secret));
    }
    const all = groups.flatMap((g) => g.cards);
    const wanted = new Set(all.filter((c) => save.wanted.includes(c.id)).map((c) => c.id));
    setPull({ id: save.opened + 1, groups, fresh, wanted });
  };

  return (
    <>
      <TopBar
        boosters={save.boosters}
        ink={save.ink}
        xp={save.xp}
        nextIn={nextIn}
        onHome={() => setPage("home")}
      />

      <main className="main">
        {isCollection(page) && (
          <CollectionTabs
            page={page}
            onNavigate={setPage}
            readyAlbums={readyAlbums}
            readyLinks={readyLinks}
          />
        )}
        {page === "home" ? (
          <HomePage
            save={save}
            nextIn={nextIn}
            onOpen={(n) => open(n)}
            onOpenSpecial={() => open(1, true)}
            onShowAffaire={() => setPage("affaire")}
            onClaim={claim}
          />
        ) : page === "affaire" ? (
          <AffairePage save={save} onGuess={guessAffaire} onFocus={setFocus} />
        ) : page === "albums" ? (
          <AlbumsPage save={save} onFocus={setFocus} onClaim={claimAlbum} />
        ) : page === "archive" ? (
          <ArchivePage save={save} onFocus={setFocus} onShredAll={() => shred()} onReset={reset} />
        ) : page === "links" ? (
          <LinksPage
            save={save}
            onFuse={fuseLink}
            onOpenLink={(link) => setFocusLink({ link, fresh: false })}
            onFocusCard={setFocus}
            onKeepOneChange={setKeepOne}
          />
        ) : page === "market" ? (
          <SoonPage
            title="Marché"
            text="Échanger et vendre ses doublons contre de l'encre, entre joueurs. Il arrive avec les comptes (connexion Discord)."
          />
        ) : (
          <SoonPage
            title="Amis"
            text="Voir la collection de tes amis, comparer vos cartes et le classement. Il arrive avec les comptes (connexion Discord)."
          />
        )}
      </main>

      <BottomNav page={page} onNavigate={setPage} collectionBadge={readyAlbums + readyLinks} />

      {pull && (
        <OpeningScreen
          key={pull.id}
          pull={pull}
          onClose={() => setPull(null)}
          onShowCollection={() => {
            setPull(null);
            setPage("archive");
          }}
        />
      )}

      {focus && (
        <FicheModal
          card={focus}
          save={save}
          onClose={() => setFocus(null)}
          onShred={(c) => shred([c.id])}
          onRequest={request}
          onToggleWanted={(c) => toggleWanted(c.id)}
          onPrestige={upgradePrestige}
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
