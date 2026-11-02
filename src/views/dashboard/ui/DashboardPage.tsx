import Link from 'next/link';
import { NextGameList, sampleNextGames } from '@/entities/game';
import { ButtonLink, Eyebrow, Icon, type IconName, VisuallyHidden } from '@/shared/ui';
import {
  courtOffers,
  freeToday,
  infoCards,
  openGamesTonight,
  stories,
} from '../model/sampleUpdates';
import { UpdateCard } from './UpdateCard';
import styles from './DashboardPage.module.css';

const quickActions = [
  { href: '/players', label: 'Find a player', icon: 'search' },
  { href: '/players?offer=1', label: "I'm free to play", icon: 'plus' },
  { href: '/players?quiz=1', label: "What's my level?", icon: 'help' },
] as const satisfies ReadonlyArray<{ href: string; label: string; icon: IconName }>;

function names(players: ReadonlyArray<{ readonly name: string }>): string {
  const [first, second, third] = players.map((player) => player.name);
  return `${first}, ${second}, ${third}`;
}

export function DashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <header className={styles.heading}>
            <Eyebrow>Updates</Eyebrow>
            <h1 className={styles.title}>Today in Kraków tennis</h1>
          </header>

          <section aria-labelledby="updates-heading">
            <h2 id="updates-heading">
              <VisuallyHidden>Latest updates</VisuallyHidden>
            </h2>
            <ul className={styles.cards}>
              <UpdateCard
                kind="Free today"
                title={`${freeToday.count} players free today`}
                text={`${names(freeToday.players)} and others near ${freeToday.neighborhood} are free to play.`}
                faces={freeToday.players}
                action={
                  <ButtonLink href="/players" variant="solid" className={styles.cta}>
                    See who
                  </ButtonLink>
                }
              />
              <UpdateCard
                kind="Open games"
                title={`${openGamesTonight.count} open games tonight`}
                text={`${openGamesTonight.host} · ${openGamesTonight.time} at ${openGamesTonight.court}. More on the Players page.`}
                faces={openGamesTonight.hosts}
                action={
                  <ButtonLink href="/players" variant="solid" className={styles.cta}>
                    Join a game
                  </ButtonLink>
                }
              />
              {infoCards.map((card) => (
                <UpdateCard
                  key={card.title}
                  kind={card.kind}
                  title={card.title}
                  text={card.text}
                  faces={'faces' in card ? card.faces : undefined}
                />
              ))}
            </ul>
          </section>

          <section aria-labelledby="stories-heading">
            <h2 id="stories-heading" className={styles.storiesLabel}>
              Latest Kraków Tennis Stories
            </h2>
            <ul className={styles.stories}>
              {stories.map((story) => (
                <li key={story.name} className={styles.story}>
                  {story.name}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="next-games-heading">
            <div className={styles.panelHead}>
              <h2 id="next-games-heading" className={styles.panelTitle}>
                Your next games
              </h2>
              <Link href="/calendar" className={styles.panelLink}>
                Calendar →
              </Link>
            </div>
            <NextGameList games={sampleNextGames} />
          </section>

          <section className={styles.panel} aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className={styles.panelTitle}>
              Quick actions
            </h2>
            <ul className={styles.actions}>
              {quickActions.map((action) => (
                <li key={action.label}>
                  <Link href={action.href} className={styles.action}>
                    <Icon name={action.icon} strokeWidth={2} className={styles.actionIcon} />
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="offers-heading">
            <h2 id="offers-heading" className={styles.panelTitle}>
              Offers from courts
            </h2>
            <ul className={styles.rows}>
              {courtOffers.map((offer) => (
                <li key={offer.title} className={styles.offer}>
                  <p className={styles.details}>
                    <strong>{offer.title}</strong>
                    <span>{offer.details}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
