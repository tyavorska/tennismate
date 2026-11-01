import Link from 'next/link';
import { redirect } from 'next/navigation';
import { courts } from '@/entities/court';
import { firstNameOf, formatRating, initialsOf, rankMatches } from '@/entities/player';
import { getViewer, listPlayers } from '@/server/players';
import { ButtonLink, Card, Eyebrow } from '@/shared/ui';
import { MatchFinder } from '@/widgets/match-finder';
import { courtOffers, nextGames, stories, updateCards } from '../model/sampleUpdates';
import styles from './DashboardPage.module.css';

const todayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export async function DashboardPage() {
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/sign-in');

  const players = listPlayers();
  const matches = rankMatches(viewer, players);
  const readyCount = matches.filter((match) => match.player.readyToPlay).length;
  const readyNames = matches
    .filter((match) => match.player.readyToPlay)
    .slice(0, 3)
    .map((match) => firstNameOf(match.player.name));

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-heading">
        <div className={styles.heroText}>
          <p className={styles.greeting}>
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(viewer.name)}
            </span>
            <span className={styles.greetingText}>
              Hi {firstNameOf(viewer.name)} · NTRP {formatRating(viewer.rating)} ·{' '}
              {viewer.neighborhood}
            </span>
          </p>
          <p className={styles.meta}>
            <span className={styles.badge}>KRK</span>
            Kraków, Poland · 9 districts · {courts.length} courts
          </p>
          <h1 id="home-heading" className={styles.title}>
            Let&apos;s <span className={styles.highlight}>play.</span>
          </h1>
          <p className={styles.lead}>
            The tennis community in one place. Find a hitting partner at your level, see who&apos;s
            free near you today, post your own game and keep every booking in your calendar.
          </p>
          <div className={styles.ctas}>
            <ButtonLink href="#find-match-heading" className={styles.cta}>
              Find a player
            </ButtonLink>
          </div>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>
                <Eyebrow as="span" className={styles.statLabel}>
                  Players
                </Eyebrow>
              </dt>
              <dd>{players.length}</dd>
            </div>
            <div className={styles.stat}>
              <dt>
                <Eyebrow as="span" className={styles.statLabel}>
                  Free today
                </Eyebrow>
              </dt>
              <dd>{readyCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt>
                <Eyebrow as="span" className={styles.statLabel}>
                  Courts
                </Eyebrow>
              </dt>
              <dd>{courts.length}</dd>
            </div>
          </dl>
        </div>

        <aside className={styles.today} aria-labelledby="today-heading">
          <Eyebrow tone="onDark">Today</Eyebrow>
          <h2 id="today-heading" className={styles.todayDate}>
            {todayFormat.format(new Date())}
          </h2>
          <p className={styles.todayText}>
            {readyCount} players free today
            {readyNames.length > 0 ? `: ${readyNames.join(', ')} and others.` : '.'}
          </p>
          <ButtonLink href="#find-match-heading" className={styles.cta}>
            See who&apos;s free
          </ButtonLink>
          <p className={styles.skyline} aria-hidden="true">
            <span>Wawel</span>
            <span>Rynek Główny</span>
            <span>Wisła</span>
          </p>
        </aside>
      </section>

      <section className={styles.updates} aria-labelledby="updates-heading">
        <header className={styles.updatesHeader}>
          <Eyebrow>Updates</Eyebrow>
          <h2 id="updates-heading" className={styles.heading}>
            Tennis today
          </h2>
        </header>

        <div className={styles.updatesBody}>
          <div className={styles.updatesMain}>
            <ul className={styles.cards}>
              <Card as="li" className={styles.card}>
                <Eyebrow>Free today</Eyebrow>
                <h3 className={styles.cardTitle}>{readyCount} players free today</h3>
                <p className={styles.cardText}>
                  {readyNames.length > 0
                    ? `${readyNames.join(', ')} and others are free to play.`
                    : 'Nobody has said they are free yet.'}
                </p>
                <Link href="#find-match-heading" className={styles.cardAction}>
                  See who →
                </Link>
              </Card>
              {updateCards.map((card) => (
                <Card as="li" key={card.title} className={styles.card}>
                  <Eyebrow>{card.kind}</Eyebrow>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardText}>{card.text}</p>
                </Card>
              ))}
            </ul>

            <h3 className={styles.subheading}>Latest tennis stories</h3>
            <ul className={styles.stories}>
              {stories.map((story) => (
                <li key={story.title} className={styles.story}>
                  <Eyebrow className={styles.storyPlace}>{story.place}</Eyebrow>
                  <p className={styles.storyTitle}>{story.title}</p>
                  <p className={styles.storyPeople}>{story.people}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sidebar}>
            <Card as="section" className={styles.panel} aria-labelledby="next-games-heading">
              <Eyebrow as="h3" id="next-games-heading">
                Your next games
              </Eyebrow>
              <ul className={styles.games}>
                {nextGames.map((game) => (
                  <li key={game.opponent} className={styles.game}>
                    <span className={styles.date}>
                      <Eyebrow as="span" className={styles.dateWeekday}>
                        {game.weekday}
                      </Eyebrow>
                      <span className={styles.dateDay}>{game.day}</span>
                    </span>
                    <span className={styles.gameText}>
                      <strong>{game.opponent}</strong>
                      <span className={styles.cardText}>{game.details}</span>
                      <Eyebrow
                        as="span"
                        className={game.status.startsWith('✓') ? styles.statusOk : styles.status}
                      >
                        {game.status}
                      </Eyebrow>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card as="section" className={styles.panel} aria-labelledby="offers-heading">
              <Eyebrow as="h3" id="offers-heading">
                Offers from courts
              </Eyebrow>
              <ul className={styles.offers}>
                {courtOffers.map((offer) => (
                  <li key={offer.title} className={styles.offer}>
                    <p className={styles.offerHead}>
                      <span className={styles.initials}>{offer.initials}</span>
                      <span className={styles.gameText}>
                        <strong>{offer.title}</strong>
                        <span className={styles.cardText}>{offer.venue}</span>
                      </span>
                    </p>
                    <dl className={styles.rows}>
                      {offer.rows.map(([label, value]) => (
                        <div key={label} className={styles.row}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <Eyebrow>{offer.spots}</Eyebrow>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <div className={styles.finder}>
        <MatchFinder matches={matches} />
      </div>
    </div>
  );
}
