'use client';

import { useState, type ReactNode } from 'react';
import { Label, TextArea, TextField } from 'react-aria-components';
import { LetsPlayButton } from '@/features/inbox';
import { toggleMember } from '@/shared/lib';
import { Avatar, Button, ButtonLink } from '@/shared/ui';
import {
  describeDay,
  eventsOn,
  formatDay,
  freeOn,
  plural,
  type CalendarEvent,
  type FreePlayer,
  type IsoDate,
} from '../model/calendar';
import styles from './DayPanel.module.css';

const freeListLimit = 4;

type DayPanelProps = {
  iso: IsoDate;
  todayIso: IsoDate;
  events: readonly CalendarEvent[];
  upcomingTournaments: readonly CalendarEvent[];
  freePlayers: readonly FreePlayer[];
  note: string;
  onNoteChange: (note: string) => void;
};

type BlockProps = {
  title: string;
  count?: number;
  children: ReactNode;
};

function Block({ title, count, children }: BlockProps) {
  return (
    <section className={styles.block} aria-label={title}>
      <h3 className={styles.blockHead}>
        <span>{title}</span>
        {count !== undefined && <span>{count}</span>}
      </h3>
      {children}
    </section>
  );
}

type RowProps = {
  initials?: string;
  title: string;
  subtitle: ReactNode;
  action?: ReactNode;
};

function Row({ initials, title, subtitle, action }: RowProps) {
  return (
    <li className={styles.row}>
      {initials === undefined ? (
        <span className={styles.ball} aria-hidden="true" />
      ) : (
        <Avatar initials={initials} className={styles.avatar} />
      )}
      <p className={styles.rowText}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </p>
      {action}
    </li>
  );
}

export function DayPanel({
  iso,
  todayIso,
  events,
  upcomingTournaments,
  freePlayers,
  note,
  onNoteChange,
}: DayPanelProps) {
  const [joinedIds, setJoinedIds] = useState<ReadonlySet<string>>(new Set());
  const dayEvents = eventsOn(events, iso);
  const bookings = dayEvents.filter((event) => event.kind === 'game');
  const openGames = dayEvents.filter((event) => event.kind === 'open');
  const free = freeOn(freePlayers, iso, todayIso);
  const isPast = iso < todayIso;

  return (
    <section className={styles.panel} aria-label="Selected day">
      <div className={styles.head}>
        <p className={styles.eyebrow}>{describeDay(iso, todayIso)}</p>
        <h2 className={styles.date}>{formatDay(iso)}</h2>
        <p className={styles.summary}>
          {plural(bookings.length, 'booking', 'bookings')} ·{' '}
          {plural(free.length, 'player', 'players')} free ·{' '}
          {plural(openGames.length, 'open game', 'open games')}
        </p>
      </div>

      <Block title="Your bookings">
        {bookings.length === 0 ? (
          <p className={styles.empty}>Nothing booked.</p>
        ) : (
          <ul className={styles.rows}>
            {bookings.map((game) =>
              game.kind === 'game' ? (
                <Row
                  key={game.id}
                  initials={game.title.slice(0, 2).toUpperCase()}
                  title={`${game.time} · vs ${game.title}`}
                  subtitle={
                    <>
                      {game.court} ·{' '}
                      {game.confirmed ? (
                        <span className={styles.confirmed}>Confirmed</span>
                      ) : (
                        'Waiting for reply'
                      )}
                    </>
                  }
                />
              ) : null,
            )}
          </ul>
        )}
      </Block>

      {openGames.length > 0 && (
        <Block title="Open games this day">
          <ul className={styles.rows}>
            {openGames.map((game) =>
              game.kind === 'open' ? (
                <Row
                  key={game.id}
                  initials={game.host.slice(0, 2).toUpperCase()}
                  title={`${game.time} · ${game.host}`}
                  subtitle={`${game.court} · ${game.format}`}
                  action={
                    <Button
                      variant="ball"
                      className={styles.join}
                      aria-pressed={joinedIds.has(game.id)}
                      onPress={() => setJoinedIds(toggleMember(joinedIds, game.id))}
                    >
                      {joinedIds.has(game.id) ? 'Joined ✓' : 'Join'}
                    </Button>
                  }
                />
              ) : null,
            )}
          </ul>
        </Block>
      )}

      <Block title="Free to play" count={free.length}>
        {isPast && <p className={styles.empty}>This day has passed.</p>}
        {!isPast && free.length === 0 && (
          <p className={styles.empty}>No one has marked this day yet.</p>
        )}
        {free.length > 0 && (
          <ul className={styles.rows}>
            {free.slice(0, freeListLimit).map((player) => (
              <Row
                key={player.id}
                initials={player.initials}
                title={`${player.name} · ${player.rating.toFixed(1)}`}
                subtitle={`${player.window} · ${player.district}`}
                action={
                  <LetsPlayButton
                    player={{
                      id: player.id,
                      name: player.name,
                      initials: player.initials,
                      subtitle: `NTRP ${player.rating.toFixed(1)} · ${player.district}`,
                    }}
                  />
                }
              />
            ))}
          </ul>
        )}
        {free.length > freeListLimit && (
          <p className={styles.empty}>+{free.length - freeListLimit} more</p>
        )}
      </Block>

      <TextField value={note} onChange={onNoteChange} className={styles.block}>
        <Label className={styles.blockHead}>My note</Label>
        <TextArea
          className={styles.note}
          placeholder="e.g. Ask Ola about Saturday, restring racket"
          rows={2}
        />
      </TextField>

      <Block title="Next tournaments">
        {upcomingTournaments.length === 0 ? (
          <p className={styles.empty}>No tournaments planned.</p>
        ) : (
          <ul className={styles.rows}>
            {upcomingTournaments.map((tournament) =>
              tournament.kind === 'tournament' ? (
                <Row
                  key={tournament.id}
                  title={tournament.name}
                  subtitle={`${formatDay(tournament.date)} · ${tournament.venue}`}
                />
              ) : null,
            )}
          </ul>
        )}
      </Block>

      {!isPast && (
        <div className={styles.actions}>
          <ButtonLink href="/players?offer=1" variant="ball" className={styles.free}>
            I&apos;m free this day
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
