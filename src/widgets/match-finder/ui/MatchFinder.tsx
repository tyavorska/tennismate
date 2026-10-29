'use client';

import { useState } from 'react';
import { PlayerCard, type PlayerMatch } from '@/entities/player';
import {
  defaultPlayerFilter,
  filterMatches,
  playerFilterLabels,
  PlayerFilterChips,
  type PlayerFilter,
} from '@/features/filter-players';
import styles from './MatchFinder.module.css';

type MatchFinderProps = {
  matches: readonly PlayerMatch[];
};

function resultSummary(shown: number, total: number, filter: PlayerFilter): string {
  if (filter === 'bestMatch') return `${total} players, best match first`;
  return `${shown} of ${total} players · ${playerFilterLabels[filter]}`;
}

export function MatchFinder({ matches }: MatchFinderProps) {
  const [filter, setFilter] = useState<PlayerFilter>(defaultPlayerFilter);
  const visibleMatches = filterMatches(matches, filter);

  return (
    <section className={styles.section} aria-labelledby="find-match-heading">
      <div className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Matched to your level, schedule and courts</p>
          <h2 id="find-match-heading" className={styles.title}>
            Find match
          </h2>
        </div>
        <PlayerFilterChips value={filter} onChange={setFilter} />
      </div>

      <p className={styles.summary} role="status">
        {resultSummary(visibleMatches.length, matches.length, filter)}
      </p>

      {visibleMatches.length === 0 ? (
        <p className={styles.empty}>
          No players fit this filter right now. Try another one or check back later.
        </p>
      ) : (
        <ul className={styles.grid}>
          {visibleMatches.map((match) => (
            <li key={match.player.id} className={styles.item}>
              <PlayerCard match={match} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
