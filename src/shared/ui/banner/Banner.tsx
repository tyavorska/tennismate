import type { ApiError } from '@/shared/api';
import { Button } from '../button/Button';
import styles from './Banner.module.css';

type BannerProps = {
  error: ApiError;
  onRetry: () => void;
};

/** A refresh failed but the content below is still valid, so this only says so and offers a retry. */
export function Banner({ error, onRetry }: BannerProps) {
  return (
    <div className={styles.banner} role="status">
      <p>{error.message}</p>
      <Button variant="ghost" onPress={onRetry}>
        Try again
      </Button>
    </div>
  );
}
