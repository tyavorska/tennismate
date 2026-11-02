'use client';

import { useState, type ReactNode } from 'react';
import {
  formatRating,
  type NtrpRating,
  type OpenGame,
  type PlayerListing,
} from '@/entities/player';
import {
  filterGames,
  filterPlayers,
  FilterPanel,
  ladderRungs,
  placeRowsOf,
  sortPlayers,
  usePlayerFilters,
  type PlayerSort,
} from '@/features/filter-players';
import { LevelQuizDialog } from '@/features/level-quiz';
import {
  gameFromOffer,
  OfferGameDialog,
  type CourtOption,
  type OfferGameInput,
} from '@/features/offer-game';
import { toggleMember, useUrlFlag } from '@/shared/lib';
import {
  Button,
  CountBadge,
  Icon,
  SelectField,
  VisuallyHidden,
  type SelectOption,
} from '@/shared/ui';
import { useStrip } from '../model/useStrip';
import { OpenGameCard } from './OpenGameCard';
import { PlayerCard } from './PlayerCard';
import styles from './PlayerFinder.module.css';

type PlayerFinderProps = {
  players: readonly PlayerListing[];
  games: readonly OpenGame[];
  courts: readonly CourtOption[];
  viewerRating: NtrpRating;
  /** Sidebar rendered next to the lists, such as the inbox and next games. */
  aside: ReactNode;
};

const sortOptions: readonly SelectOption[] = [
  { id: 'fit', label: 'Best fit' },
  { id: 'distance', label: 'Closest' },
  { id: 'level', label: 'Highest level' },
];

function sortFromId(id: string): PlayerSort {
  if (id === 'distance' || id === 'level') return id;
  return 'fit';
}

type ListHeadingProps = {
  id: string;
  title: string;
  count: number;
  description: string;
  children: ReactNode;
};

function ListHeading({ id, title, count, description, children }: ListHeadingProps) {
  return (
    <div className={styles.heading}>
      <div className={styles.headingText}>
        <h2 id={id} className={styles.title}>
          {title} <CountBadge>{count}</CountBadge>
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.controls}>{children}</div>
    </div>
  );
}

type ArrowsProps = { label: string; onScroll: (direction: 1 | -1) => void };

function Arrows({ label, onScroll }: ArrowsProps) {
  return (
    <>
      <Button
        variant="outline"
        className={styles.arrow}
        onPress={() => onScroll(-1)}
        aria-label={`Previous ${label}`}
      >
        <Icon name="arrowLeft" />
      </Button>
      <Button
        variant="outline"
        className={styles.arrow}
        onPress={() => onScroll(1)}
        aria-label={`Next ${label}`}
      >
        <Icon name="arrowRight" />
      </Button>
    </>
  );
}

export function PlayerFinder({ players, games, courts, viewerRating, aside }: PlayerFinderProps) {
  const { filters, setFilters, clear } = usePlayerFilters();
  const [myRating, setMyRating] = useState(viewerRating);
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(new Set());
  const [joinedIds, setJoinedIds] = useState<ReadonlySet<string>>(new Set());
  const [myGames, setMyGames] = useState<readonly OpenGame[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<PlayerSort>('fit');
  // Both dialogs live in the URL (`?offer=1`, `?quiz=1`), so links and the back button can open and close them.
  const [isOffering, setIsOffering] = useUrlFlag('offer');
  const [isQuizzing, setIsQuizzing] = useUrlFlag('quiz');
  const [announcement, setAnnouncement] = useState('');
  const [playerStripRef, scrollPlayers] = useStrip();
  const [gameStripRef, scrollGames] = useStrip();

  const context = { viewerRating: myRating, savedIds, courts };
  const effectiveSort = filters.lists.has('closestToYou') ? 'distance' : sort;
  const matchedPlayers = sortPlayers(filterPlayers(players, filters, context), effectiveSort);
  const matchedGames = [...myGames, ...filterGames(games, filters, context)];

  function post(offer: OfferGameInput): void {
    const game = gameFromOffer(offer, courts, `mine-${myGames.length + 1}`);
    if (game === undefined) return;
    setMyGames([game, ...myGames]);
    setAnnouncement(`Your game at ${game.court} is now visible to players.`);
  }

  function removeGame(id: string): void {
    setMyGames(myGames.filter((game) => game.id !== id));
    setAnnouncement('Your game was removed.');
  }

  function toggleSaved(player: PlayerListing): void {
    const saved = !savedIds.has(player.id);
    setSavedIds(toggleMember(savedIds, player.id));
    setAnnouncement(saved ? `${player.name} saved.` : `${player.name} removed from saved players.`);
  }

  function toggleJoin(game: OpenGame): void {
    const joined = !joinedIds.has(game.id);
    setJoinedIds(toggleMember(joinedIds, game.id));
    setAnnouncement(
      joined ? `You joined the game at ${game.court}.` : `You left the game at ${game.court}.`,
    );
  }

  const playerCards = matchedPlayers.map((player) => (
    <PlayerCard
      key={player.id}
      player={player}
      isSaved={savedIds.has(player.id)}
      onToggleSave={() => toggleSaved(player)}
    />
  ));

  return (
    <>
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        onClear={clear}
        viewerRating={myRating}
        onViewerRatingChange={setMyRating}
        places={placeRowsOf(players, courts)}
        playerCount={matchedPlayers.length}
        gameCount={matchedGames.length}
        onTakeQuiz={() => setIsQuizzing(true)}
      />

      <div className={styles.discovery}>
        <div className={styles.lists}>
          {showAll ? (
            <section className={styles.list} aria-labelledby="players-heading">
              <Button variant="outline" className={styles.back} onPress={() => setShowAll(false)}>
                <Icon name="arrowLeft" /> All lists
              </Button>
              <ListHeading
                id="players-heading"
                title="Players"
                count={matchedPlayers.length}
                description="Matches the lists and filters above"
              >
                <SelectField
                  variant="pill"
                  inlineLabel
                  label="Sort"
                  options={sortOptions}
                  value={effectiveSort}
                  onChange={(id) => setSort(sortFromId(id))}
                />
              </ListHeading>
              <ul className={styles.grid}>{playerCards}</ul>
            </section>
          ) : (
            <>
              <section className={styles.list} aria-labelledby="players-heading">
                <ListHeading
                  id="players-heading"
                  title="Players"
                  count={matchedPlayers.length}
                  description="Matches the lists and filters above · best fit first"
                >
                  <Arrows label="players" onScroll={scrollPlayers} />
                  <Button
                    variant="outline"
                    className={styles.seeAll}
                    onPress={() => setShowAll(true)}
                  >
                    See all
                  </Button>
                </ListHeading>
                <ul className={styles.strip} ref={playerStripRef}>
                  {playerCards}
                </ul>
              </section>

              <section className={styles.list} aria-labelledby="games-heading">
                <ListHeading
                  id="games-heading"
                  title="Open games"
                  count={matchedGames.length}
                  description="Matches your filters · join with one tap"
                >
                  <Arrows label="games" onScroll={scrollGames} />
                  <Button
                    variant="primary"
                    className={styles.offer}
                    onPress={() => setIsOffering(true)}
                  >
                    <span className={styles.ball} aria-hidden="true" />
                    Offer a game
                  </Button>
                </ListHeading>
                <ul className={styles.strip} ref={gameStripRef}>
                  {matchedGames.map((game) => (
                    <OpenGameCard
                      key={game.id}
                      game={game}
                      isJoined={joinedIds.has(game.id)}
                      onToggleJoin={() => toggleJoin(game)}
                      onRemove={() => removeGame(game.id)}
                    />
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        {aside}
      </div>

      <OfferGameDialog
        isOpen={isOffering}
        onOpenChange={setIsOffering}
        viewerRating={myRating}
        courts={courts}
        ratings={ladderRungs}
        onPost={post}
      />

      <LevelQuizDialog
        isOpen={isQuizzing}
        onOpenChange={setIsQuizzing}
        countNear={(rating) =>
          players.filter((player) => Math.abs(player.rating - rating) <= 0.5).length
        }
        onUse={(rating) => {
          setMyRating(rating);
          setAnnouncement(`Level set to NTRP ${formatRating(rating)}.`);
        }}
      />

      <p role="status">
        <VisuallyHidden>{announcement}</VisuallyHidden>
      </p>
    </>
  );
}
