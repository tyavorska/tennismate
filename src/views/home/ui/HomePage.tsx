import Image from 'next/image';
import { redirect } from 'next/navigation';
import { ButtonLink, Card, Eyebrow, LogoLink } from '@/shared/ui';
import { getViewer } from '@/server/players';
import { HeroAuthCard } from './HeroAuthCard';
import styles from './HomePage.module.css';

const features = [
  {
    title: 'Players at your level',
    text: "Take the level quiz, filter by district and time, see who's free tonight.",
  },
  {
    title: 'Book and split courts',
    text: 'Courts near you. Pay only your share with BLIK or card.',
  },
  {
    title: 'Calendar and chat',
    text: "Invites, bookings and who's free each day, all in one calendar.",
  },
  {
    title: 'Community and ranking',
    text: 'Stories, groups, a city ranking with verified levels, tournaments and coaches.',
  },
] as const;

const devices = [
  { title: 'Web app', text: 'Works in any browser, add it to your home screen', live: true },
  { title: 'iPhone app', text: 'App Store · push notifications for invites', live: false },
  { title: 'Android app', text: 'Google Play · BLIK payments built in', live: false },
] as const;

const stats = [
  { value: '1,240', label: 'Players' },
  { value: '38', label: 'Courts' },
  { value: '9', label: 'Districts' },
  { value: '6', label: 'Coaches' },
] as const;

export async function HomePage() {
  // Signed-in players start on their dashboard.
  if ((await getViewer()) !== undefined) redirect('/home');

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
            <HeroAuthCard />
          </div>
        </div>
        <Image
          className={styles.heroImage}
          src="/images/hero.png"
          alt="The Let. app on a phone, showing players who are free tonight"
          width={560}
          height={558}
          priority
        />
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
              <span className={styles.dot} aria-hidden="true" />
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
        <ul className={`${styles.cards} ${styles.cardsDevices}`}>
          {devices.map((device) => (
            <Card as="li" key={device.title} className={styles.card}>
              <span className={device.live ? styles.tagLive : styles.tag}>
                {device.live ? 'Open now' : 'Coming soon'}
              </span>
              <h3 className={styles.cardTitle}>{device.title}</h3>
              <p className={styles.cardText}>{device.text}</p>
            </Card>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <LogoLink href="/" className={styles.footerLogo} />
        <p className={styles.footerText}>
          Made for tennis players. Concept demo. People, games and events are sample data.
        </p>
      </footer>

      <section className={styles.cta} aria-label="Join Let.">
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
        <ButtonLink href="/sign-up" className={styles.ctaLink}>
          Create your free account
        </ButtonLink>
      </section>
    </main>
  );
}
