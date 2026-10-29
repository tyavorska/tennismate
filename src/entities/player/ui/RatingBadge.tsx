import { VisuallyHidden } from '@/shared/ui';
import { formatRating } from '../lib/format';
import type { NtrpRating } from '../model/player';
import styles from './RatingBadge.module.css';

/** Hexagon with the player's NTRP rating. */
export function RatingBadge({ rating }: { rating: NtrpRating }) {
  return (
    <span className={styles.badge}>
      <VisuallyHidden>NTRP rating </VisuallyHidden>
      {formatRating(rating)}
    </span>
  );
}
