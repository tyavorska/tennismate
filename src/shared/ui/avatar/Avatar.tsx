import styles from './Avatar.module.css';

type AvatarProps = {
  initials: string;
  /** Shows a green dot for a player who is online. */
  online?: boolean;
  className?: string;
};

/** Round initials badge. Decorative: the name always sits next to it. */
export function Avatar({ initials, online = false, className }: AvatarProps) {
  return (
    <span
      className={[styles.avatar, online ? styles.online : '', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
