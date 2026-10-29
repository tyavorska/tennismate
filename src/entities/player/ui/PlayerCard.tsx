import { useId } from 'react';
import { VisuallyHidden } from '@/shared/ui';
import { formatDistance, formatGamesPlayed, formatLastActive, formatRating } from '../lib/format';
import type { PlayerMatch } from '../model/match';
import { initialsOf, levelOf, playTimeLabels } from '../model/player';
import { RatingBadge } from './RatingBadge';
import styles from './PlayerCard.module.css';

function WaveIcon() {
  return (
    <svg className={styles.tagIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 11.5V6.5a1.5 1.5 0 0 1 3 0V11M10 10.5V4.5a1.5 1.5 0 0 1 3 0v6M13 10.5v-5a1.5 1.5 0 0 1 3 0v6M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L4 15.2a1.6 1.6 0 0 1 2.4-2.1L8 14.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className={styles.tagIcon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className={styles.tagIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className={styles.score}>
      <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
        <circle className={styles.ringTrack} cx="24" cy="24" r="20" />
        <circle
          className={styles.ringValue}
          cx="24"
          cy="24"
          r="20"
          pathLength="100"
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <span className={styles.scoreValue}>
        {score}%<span className={styles.scoreLabel}> match</span>
      </span>
    </div>
  );
}

type PlayerCardProps = {
  match: PlayerMatch;
};

export function PlayerCard({ match }: PlayerCardProps) {
  const { player, score, distanceMiles, sharedPlayTimes, sharedCourts } = match;
  const nameId = useId();
  const otherPlayTimes = player.playTimes.filter((time) => !sharedPlayTimes.includes(time));
  const otherCourts = player.homeCourts.filter((court) => !sharedCourts.includes(court));

  return (
    <article className={styles.card} aria-labelledby={nameId}>
      <div className={styles.top}>
        <span className={styles.avatar} aria-hidden="true">
          {initialsOf(player.name)}
        </span>
        <ScoreRing score={score} />
      </div>

      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h3 id={nameId} className={styles.name}>
            {player.name}
          </h3>
          <RatingBadge rating={player.rating} />
        </div>
        <p className={styles.meta}>
          <span>{formatLastActive(player.lastActiveDaysAgo)}</span>
          <span>{formatGamesPlayed(player.gamesPlayed)}</span>
          <span>
            {player.neighborhood}, {formatDistance(distanceMiles)}
          </span>
        </p>
      </div>

      {player.readyToPlay && (
        <p className={styles.ready}>
          <WaveIcon />
          Ready to play
        </p>
      )}

      {player.about !== '' && <p className={styles.about}>{player.about}</p>}

      <ul className={styles.tags} aria-label={`About ${player.name}'s game`}>
        <li className={`${styles.tag} ${styles.level}`}>
          {levelOf(player.rating)} {formatRating(player.rating)}
        </li>
        {sharedPlayTimes.map((time) => (
          <li key={time} className={`${styles.tag} ${styles.shared}`}>
            <ClockIcon />
            Shared: {playTimeLabels[time]}
          </li>
        ))}
        {otherPlayTimes.map((time) => (
          <li key={time} className={styles.tag}>
            <ClockIcon />
            {playTimeLabels[time]}
          </li>
        ))}
        {sharedCourts.map((court) => (
          <li key={court} className={`${styles.tag} ${styles.shared}`}>
            <PinIcon />
            Shared: {court}
          </li>
        ))}
        {otherCourts.map((court) => (
          <li key={court} className={styles.tag}>
            <PinIcon />
            <VisuallyHidden>Court: </VisuallyHidden>
            {court}
          </li>
        ))}
      </ul>
    </article>
  );
}
