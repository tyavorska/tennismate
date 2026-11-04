import { redirect } from 'next/navigation';
import { ButtonLink, Card, Eyebrow, LogoLink } from '@/shared/ui';
import { getCurrentUser } from '@/server/auth';
import { listCities } from '@/server/cities';
import { HeroAuthCard } from './HeroAuthCard';
import { HeroStage } from './HeroStage';
import { HomeIcon, type HomeIconName } from './HomeIcons';
import styles from './HomePage.module.css';

const features = [
  {
    icon: 'search',
    title: 'Players at your level',
    text: "Take the level quiz, filter by district and time, see who's free tonight.",
  },
  {
    icon: 'ball',
    title: 'Book and split courts',
    text: '38 courts across Kraków. Pay only your share with BLIK or card.',
  },
  {
    icon: 'calendar',
    title: 'Calendar and chat',
    text: "Invites, bookings and who's free each day, all in one calendar.",
  },
  {
    icon: 'trophy',
    title: 'Community and ranking',
    text: 'Stories, groups, a city ranking with verified levels, tournaments and coaches.',
  },
] as const satisfies ReadonlyArray<{ icon: HomeIconName; title: string; text: string }>;

const devices = [
  {
    icon: 'laptop',
    title: 'Web app',
    text: 'Works in any browser, add it to your home screen',
    live: true,
  },
  {
    icon: 'phone',
    title: 'iPhone app',
    text: 'App Store · push notifications for invites',
    live: false,
  },
  {
    icon: 'phone',
    title: 'Android app',
    text: 'Google Play · BLIK payments built in',
    live: false,
  },
] as const satisfies ReadonlyArray<{
  icon: HomeIconName;
  title: string;
  text: string;
  live: boolean;
}>;

const stats = [
  { value: '1,240', label: 'Players' },
  { value: '38', label: 'Courts' },
  { value: '9', label: 'Districts' },
  { value: '6', label: 'Coaches' },
] as const;

export async function HomePage() {
  // Signed-in players start on their dashboard.
  if ((await getCurrentUser()) !== undefined) redirect('/players');

  return (
    <main>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <Eyebrow tone="onDark">Tennis community · Free to join</Eyebrow>
          <h1 id="hero-heading" className={styles.title}>
            <span>Let&apos;s</span>
            <span className={styles.accent}>play.</span>
            <span className={styles.ball} aria-hidden="true" />
          </h1>
          <p className={styles.lead}>
            Find a hitting partner at your level, book and split courts, follow the city ranking and
            join tournaments. On the web today, with iPhone and Android apps on the way.
          </p>
          <div className={styles.signUp}>
            <HeroAuthCard cities={listCities()} />
          </div>
        </div>
        <HeroStage />
      </section>

      <section className={styles.features} aria-labelledby="features-heading">
        <div className={styles.intro}>
          <Eyebrow>Everything in one app</Eyebrow>
          <h2 id="features-heading" className={styles.heading}>
            Your tennis club in your pocket
          </h2>
          <p className={styles.lead2}>
            One account works on the web, on iPhone and on Android. Your games, chats and bookings
            stay in sync.
          </p>
        </div>
        <ul className={styles.cards}>
          {features.map((feature) => (
            <Card as="li" key={feature.title} className={styles.card}>
              <HomeIcon name={feature.icon} />
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardText}>{feature.text}</p>
            </Card>
          ))}
        </ul>
      </section>

      <section className={styles.devices} aria-labelledby="devices-heading">
        <div className={styles.intro}>
          <Eyebrow>Web and mobile</Eyebrow>
          <h2 id="devices-heading" className={styles.heading}>
            Play from any device
          </h2>
        </div>
        <ul className={styles.devicesList}>
          {devices.map((device) => (
            <li key={device.title} className={styles.device}>
              <HomeIcon name={device.icon} />
              <div className={styles.deviceText}>
                <h3 className={styles.deviceTitle}>{device.title}</h3>
                <p className={styles.deviceNote}>{device.text}</p>
              </div>
              <span className={device.live ? styles.deviceTagLive : styles.deviceTag}>
                {device.live ? 'Open now' : 'Coming soon'}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.cta}>
          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </dl>
          <ButtonLink href="/#sign-up" className={styles.ctaLink}>
            Create your free account
          </ButtonLink>
        </div>
      </section>

      <footer className={styles.footer}>
        <LogoLink href="/" className={styles.footerLogo} />
        <p className={styles.footerText}>
          Made for tennis players. Concept demo. People, games and events are sample data.
        </p>
      </footer>
    </main>
  );
}
