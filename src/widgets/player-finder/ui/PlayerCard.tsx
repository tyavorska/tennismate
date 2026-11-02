import { formatRating, formatsLabel, initialsOf, type PlayerListing } from '@/entities/player';
import { LetsPlayButton } from '@/features/inbox';
import { Icon, ToggleItem, VisuallyHidden } from '@/shared/ui';
import styles from './PlayerCard.module.css';

type PlayerCardProps = {
  player: PlayerListing;
  isSaved: boolean;
  onToggleSave: () => void;
};

export function PlayerCard({ player, isSaved, onToggleSave }: PlayerCardProps) {
  return (
    <li className={styles.card}>
      <div className={styles.pic}>
        <svg className={styles.bust} viewBox="0 0 226 226" aria-hidden="true" focusable="false">
          <circle cx="113" cy="100" r="38" />
          <circle cx="113" cy="225" r="75" />
        </svg>
        <span className={styles.level}>NTRP {formatRating(player.rating)}</span>
        {player.freeTonight && <span className={styles.tonight}>Free tonight</span>}
        <ToggleItem
          className={styles.save}
          isSelected={isSaved}
          onChange={onToggleSave}
          aria-label={`Save ${player.name}`}
        >
          <Icon name="bookmark" filled={isSaved} />
        </ToggleItem>
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{player.name}</h3>
          <span className={styles.age}>
            <VisuallyHidden>Age </VisuallyHidden>
            {player.age}
          </span>
        </div>
        <p className={styles.sub}>
          {player.online && (
            <span className={styles.online}>
              <VisuallyHidden>Online now</VisuallyHidden>
            </span>
          )}
          {player.district} · {player.distanceKm.toFixed(1)} km · {player.fitPercent}% fit
        </p>
        <ul className={styles.tags}>
          <li className={styles.styleTag}>{player.playStyle}</li>
          <li className={styles.tag}>{formatsLabel(player.formats)}</li>
        </ul>
        <div className={styles.actions}>
          <LetsPlayButton
            className={styles.invite}
            player={{
              id: player.id,
              name: player.name,
              initials: initialsOf(player.name),
              subtitle: `NTRP ${formatRating(player.rating)} · ${player.district}`,
            }}
          />
        </div>
      </div>
    </li>
  );
}
