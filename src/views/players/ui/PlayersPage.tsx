import type { Court } from '@/entities/court';
import type { NtrpRating, PlayerListing } from '@/entities/player';
import { PlayerFinder } from '@/widgets/player-finder';
import { PlayersAside } from './PlayersAside';
import styles from './PlayersPage.module.css';

type PlayersPageProps = {
  players: readonly PlayerListing[];
  courts: readonly Court[];
  viewerRating: NtrpRating;
};

export function PlayersPage({ players, courts, viewerRating }: PlayersPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Players</p>
          <h1 className={styles.title}>Find players in Kraków</h1>
        </div>
        <p className={styles.lead}>
          Search by level, district and time, browse curated lists, or offer yourself as a player.
        </p>
      </header>

      <PlayerFinder
        players={players}
        courts={courts}
        viewerRating={viewerRating}
        aside={<PlayersAside />}
      />
    </div>
  );
}
