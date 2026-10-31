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
import { CARDS, type Card } from "./game/cards";
import { ProfilePage } from "./components/ProfilePage";
import { canFuse, LINKS, type Link } from "./game/links";
import { ALBUMS, specialSeries } from "./game/series";
import { useSave } from "./game/store";
import { AlbumsPage } from "./components/AlbumsPage";
import { AffairePage } from "./components/AffairePage";

/** Positions des lucioles du fond (en %), et leur décalage d'animation. */
const FIREFLIES = [
  [22, 18, 0],
  [75, 22, 2],
  [24, 40, 4],
  [74, 43, 1],
  [31, 49, 3],
  [69, 50, 5],
  [8, 50, 2.5],
  [92, 47, 0.5],
  [38, 14, 6],
  [64, 15, 3.5],
  [51, 49, 1.5],
  [4, 62, 4.5],
  [86, 70, 2],
  [14, 82, 5.5],
  [58, 76, 0.8],
  [40, 92, 3.2],
];

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

  const ownedCount = CARDS.filter((c) => save.owned[c.id]).length;

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
        onHome={() => setPage("home")}
        onInk={() => setPage("archive")}
      />

      <div className="fireflies" aria-hidden>
        {FIREFLIES.map(([x, y, d], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
        ))}
      </div>

      <main className="main">
        {isCollection(page) && (
          <CollectionTabs
            page={page}
            onNavigate={setPage}
            readyAlbums={readyAlbums}
            readyLinks={readyLinks}
            owned={ownedCount}
            total={CARDS.length}
            progress={ownedCount / CARDS.length}
          />
        )}
        {page === "home" ? (
          <HomePage
            save={save}
            nextIn={nextIn}
            readyAlbums={readyAlbums}
            readyLinks={readyLinks}
            onOpen={(n) => open(n)}
            onOpenSpecial={() => open(1, true)}
            onShowAffaire={() => setPage("affaire")}
            onShowAlbums={() => setPage("albums")}
            onShowLinks={() => setPage("links")}
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
        ) : page === "profile" ? (
          <ProfilePage save={save} />
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
          xp={save.xp}
          boosters={save.boosters}
          onAgain={(n) => open(n)}
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
