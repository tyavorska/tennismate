import { PlayerFinder } from '@/widgets/player-finder';
import {
  sampleCourts,
  sampleGames,
  samplePlayers,
  sampleViewerRating,
} from '../model/samplePlayers';
import { PlayersAside } from './PlayersAside';
import styles from './PlayersPage.module.css';

export function PlayersPage() {
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
        players={samplePlayers}
        games={sampleGames}
        courts={sampleCourts}
        viewerRating={sampleViewerRating}
        aside={<PlayersAside />}
      />
    </div>
  );
}
