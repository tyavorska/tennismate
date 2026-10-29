import { redirect } from 'next/navigation';
import { firstNameOf, formatRating, rankMatches } from '@/entities/player';
import { getViewer, listPlayers } from '@/server/players';
import { MatchFinder } from '@/widgets/match-finder';
import styles from './DashboardPage.module.css';

/** Decorative half court drawn in the hero's corner. */
function CourtLines() {
  return (
    <svg className={styles.court} viewBox="0 0 400 300" aria-hidden="true">
      <rect x="20" y="20" width="360" height="260" />
      <line x1="20" y1="60" x2="380" y2="60" />
      <line x1="20" y1="240" x2="380" y2="240" />
      <line x1="200" y1="60" x2="200" y2="240" />
      <line x1="120" y1="60" x2="120" y2="240" />
      <circle className={styles.courtBall} cx="300" cy="150" r="18" />
    </svg>
  );
}

export async function DashboardPage() {
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/sign-in');

  const matches = rankMatches(viewer, listPlayers());
  const topScore = matches[0]?.score ?? 0;
  const readyCount = matches.filter((match) => match.player.readyToPlay).length;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-heading">
        <CourtLines />
        <div className={styles.heroText}>
          <p className={styles.kicker}>Welcome back, {firstNameOf(viewer.name)}</p>
          <h1 id="home-heading" className={styles.title}>
            Your next <span className={styles.highlight}>match</span> is waiting
          </h1>
          <p className={styles.lead}>
            We ranked players near you by level, play times and home courts. Pick a partner and get
            on court.
          </p>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Your rating</dt>
            <dd>{formatRating(viewer.rating)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Top match</dt>
            <dd>{topScore}%</dd>
          </div>
          <div className={styles.stat}>
            <dt>Ready to play</dt>
            <dd>{readyCount}</dd>
          </div>
        </dl>
      </section>

      <MatchFinder matches={matches} />
    </div>
  );
}
