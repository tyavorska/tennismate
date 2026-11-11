import type { ApiError } from '@/shared/api';
import { Button } from '../button/Button';
import styles from './ErrorState.module.css';

type ErrorStateProps = {
  /** What could not be loaded, such as "Messages did not load". */
  title: string;
  error: ApiError;
  onRetry: () => void;
};

/** Takes the place of content that could not be loaded and has nothing to show yet. */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  return (
    <section className={styles.state} role="alert">
      <h3 className={styles.title}>{title}</h3>
      <p>{error.message}</p>
      {error.requestId !== undefined && (
        <p className={styles.reference}>Reference: {error.requestId.slice(0, 8)}</p>
      )}
      <Button variant="outline" onPress={onRetry}>
        Try again
      </Button>
    </section>
  );
}
