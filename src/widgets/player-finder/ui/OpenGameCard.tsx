import {
  formatRating,
  formatSpots,
  gameDayBadges,
  gameFormatLabels,
  type OpenGame,
} from '@/entities/player';
import { Avatar, Button } from '@/shared/ui';
import styles from './OpenGameCard.module.css';

type OpenGameCardProps = {
  game: OpenGame;
  isPending: boolean;
  onToggleJoin: () => void;
  onRemove: () => void;
};

export function OpenGameCard({ game, isPending, onToggleJoin, onRemove }: OpenGameCardProps) {
  const { isJoined, spotsOpen: spots } = game;
  const classes = [styles.card, game.isMine ? styles.mine : ''].filter(Boolean).join(' ');

  return (
    <li className={classes}>
      {game.isMine && <span className={styles.badge}>Your post</span>}

      <div className={styles.top}>
        <p className={styles.date}>
          <span className={styles.day}>{gameDayBadges[game.day]}</span>
          <span className={styles.time}>{game.time}</span>
        </p>
        <div className={styles.who}>
          <Avatar initials={game.hostInitials} />
          <p className={styles.whoText}>
            <strong>{game.hostName}</strong>
            <span>
              NTRP {formatRating(game.rating)} · {gameFormatLabels[game.format]}
            </span>
          </p>
        </div>
      </div>

      <div className={styles.where}>
        <h3 className={styles.court}>{game.court}</h3>
        <p className={styles.when}>
          {game.day} · {gameFormatLabels[game.format]}
        </p>
      </div>

      <div className={styles.foot}>
        <span className={styles.pill}>
          {game.isMine ? 'Visible to players' : formatSpots(spots)}
        </span>
        {game.isMine ? (
          <Button
            variant="outline"
            className={styles.action}
            isDisabled={isPending}
            onPress={onRemove}
          >
            Remove
          </Button>
        ) : (
          <Button
            variant={isJoined ? 'outline' : 'ball'}
            className={styles.action}
            aria-pressed={isJoined}
            isDisabled={isPending || (spots === 0 && !isJoined)}
            onPress={onToggleJoin}
          >
            {isJoined ? 'Joined' : 'Join game'}
          </Button>
        )}
      </div>
    </li>
  );
}
