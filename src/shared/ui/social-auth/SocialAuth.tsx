import { Button } from '../button/Button';
import styles from './SocialAuth.module.css';

/** "Continue with Google / Apple" and the "or with email" divider that follows them. */
export function SocialAuth() {
  return (
    <>
      <div className={styles.providers}>
        <Button variant="outline" isDisabled>
          Continue with Google
        </Button>
        <Button variant="outline" isDisabled>
          Continue with Apple
        </Button>
      </div>
      <p className={styles.divider}>
        <span>or with email</span>
      </p>
    </>
  );
}
