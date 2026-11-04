import { Avatar } from '@/shared/ui';
import { HomeIcon } from './HomeIcons';
import styles from './HeroStage.module.css';

const freeTonight = [
  { name: 'Ola', initials: 'O', rating: '3.5', district: 'Kazimierz', km: '0.5' },
  { name: 'Zofia', initials: 'Z', rating: '4.0', district: 'Kazimierz', km: '0.5' },
] as const;

const tabPaths = [
  'M3 11l9-7 9 7v9H3z',
  'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z',
  'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  'M4 5h16v11H9l-5 4z',
] as const;

function Court() {
  return (
    <svg className={styles.court} viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
      <rect className={styles.courtSky} width="300" height="300" />
      <polygon className={styles.courtFloor} points="0,300 300,300 230,140 70,140" />
      <g className={styles.courtLines}>
        <polygon points="18,300 282,300 222,140 78,140" />
        <line x1="50" y1="300" x2="96" y2="140" />
        <line x1="250" y1="300" x2="204" y2="140" />
        <line x1="88" y1="200" x2="212" y2="200" />
        <line x1="150" y1="200" x2="150" y2="300" />
      </g>
      <rect className={styles.courtNet} x="40" y="170" width="220" height="4" />
    </svg>
  );
}

/** The app on a phone with floating notifications, drawn in code so each part can move. */
export function HeroStage() {
  return (
    <div
      className={styles.stage}
      role="img"
      aria-label="The Let. app on a phone, showing players who are free tonight"
    >
      <div className={styles.phone}>
        <div className={styles.notch} />
        <div className={styles.screen}>
          <div className={styles.top}>
            <span className={styles.wordmark}>
              let
              <span className={styles.wordmarkBall}>
                <HomeIcon name="ball" />
              </span>
            </span>
          </div>
          <p className={styles.screenTitle}>Free tonight</p>
          <div className={styles.cards}>
            {freeTonight.map((player) => (
              <div key={player.name} className={styles.card}>
                <div className={styles.pic}>
                  <Court />
                  <Avatar initials={player.initials} className={styles.cardAvatar} />
                  <span className={styles.rating}>NTRP {player.rating}</span>
                </div>
                <b className={styles.cardName}>{player.name}</b>
                <small className={styles.cardMeta}>
                  {player.district} · {player.km} km
                </small>
                <i className={styles.cardAction}>Let&apos;s play</i>
              </div>
            ))}
          </div>
          <div className={styles.invite}>
            <div className={styles.inviteTag}>Let&apos;s play · Court invite</div>
            <b className={styles.inviteWhen}>Sat 31 Oct · 10:00</b>
            <small className={styles.invitePlace}>Błonia Park Tennis</small>
            <div className={styles.inviteOk}>✓ Confirmed · split 3 × 24 zł</div>
          </div>
          <div className={styles.tabs}>
            {tabPaths.map((path, index) => (
              <svg
                key={path}
                className={index === 0 ? styles.tabActive : styles.tab}
                viewBox="0 0 24 24"
              >
                <path d={path} />
              </svg>
            ))}
          </div>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatInvite}`}>
        <Avatar initials="O" className={styles.floatAvatar} />
        <div>
          <b className={styles.floatTitle}>Ola · 3.5</b>
          Free at 19:00 tonight?
        </div>
      </div>
      <div className={`${styles.float} ${styles.floatPaid}`}>
        <Avatar initials="D" className={styles.floatAvatar} />
        <div>
          <b className={styles.floatTitle}>Dmytro paid 24 zł</b>
          Court split 3/3 ✓
        </div>
      </div>
      <span className={styles.ball}>
        <HomeIcon name="ball" />
      </span>
    </div>
  );
}
