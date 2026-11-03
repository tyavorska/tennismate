'use client';

import { keepPreviousData, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState, type Key } from 'react';
import { calendarQueries } from '@/entities/game';
import { Button, Icon, ToggleGroup, ToggleItem } from '@/shared/ui';
import {
  buildDays,
  eventsOn,
  formatDay,
  freeOn,
  isoDateSchema,
  plural,
  rangeTitle,
  type CalendarDay,
  type CalendarEvent,
  type FreePlayer,
  type IsoDate,
  visibleRange,
  weekOffsetFor,
} from '../model/calendar';
import { DayPanel } from './DayPanel';
import styles from './MonthCalendar.module.css';

const weekdayHeads = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const legend = [
  { label: 'Your game', className: styles.swatchGame },
  { label: 'Waiting for reply', className: styles.swatchWaiting },
  { label: 'Tournament', className: styles.swatchTournament },
  { label: 'Open game', className: styles.swatchOpen },
] as const;
const faceTones = [styles.toneOne, styles.toneTwo, styles.toneThree] as const;
const facesShown = 3;

type MonthCalendarProps = {
  todayIso: IsoDate;
  freePlayers: readonly FreePlayer[];
  /** The day to select on arrival, such as when a game was opened from a list. Today when absent. */
  initialDay?: IsoDate;
};

function dayLabel(
  day: CalendarDay,
  events: readonly CalendarEvent[],
  free: number,
  hasNote: boolean,
): string {
  const parts = events.map((event) => {
    if (event.kind === 'game') {
      return `${event.time} ${event.title}${event.confirmed ? '' : ', waiting for reply'}`;
    }
    if (event.kind === 'tournament') return `tournament ${event.name}`;
    return `open game at ${event.time}`;
  });
  if (free > 0) parts.push(`${plural(free, 'player', 'players')} free`);
  if (hasNote) parts.push('note');
  const when = `${formatDay(day.iso)}${day.isToday ? ', today' : ''}`;
  return parts.length === 0 ? when : `${when}: ${parts.join('; ')}`;
}

function loadedEventsOf(
  ranges: ReadonlyArray<readonly [QueryKey, readonly CalendarEvent[] | undefined]>,
): readonly CalendarEvent[] {
  const byId = new Map(
    ranges.flatMap(([, events]) => events ?? []).map((event) => [event.id, event]),
  );
  return [...byId.values()];
}

type EventChipsProps = { events: readonly CalendarEvent[]; hasNote: boolean };

function EventChips({ events, hasNote }: EventChipsProps) {
  const openGames = events.filter((event) => event.kind === 'open');
  return (
    <>
      {events.map((event) => {
        if (event.kind === 'game') {
          return (
            <span key={event.id} className={event.confirmed ? styles.chipGame : styles.chipWaiting}>
              {event.time} {event.title}
            </span>
          );
        }
        if (event.kind === 'tournament') {
          return (
            <span key={event.id} className={styles.chipTournament}>
              {event.name}
            </span>
          );
        }
        return null;
      })}
      {openGames.length > 0 && (
        <span className={styles.chipOpen}>
          {plural(openGames.length, 'open game', 'open games')}
        </span>
      )}
      {hasNote && <span className={styles.chipNote}>✎ note</span>}
    </>
  );
}

export function MonthCalendar({ todayIso, freePlayers, initialDay }: MonthCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(() =>
    initialDay === undefined ? 0 : weekOffsetFor(todayIso, initialDay),
  );
  const [selectedIso, setSelectedIso] = useState(initialDay ?? todayIso);
  const [notes, setNotes] = useState<Readonly<Record<string, string>>>({});
  const days = buildDays(todayIso, weekOffset);
  const { from, to } = visibleRange(todayIso, weekOffset);
  const queryClient = useQueryClient();
  // Keeps showing the weeks already loaded while the next ones arrive.
  const eventsQuery = useQuery({
    ...calendarQueries.range(from, to),
    placeholderData: keepPreviousData,
  });
  // The weeks overlap, so when new ones fail to load the days already fetched can still be shown.
  const loadedEvents = loadedEventsOf(
    queryClient.getQueriesData<readonly CalendarEvent[]>(calendarQueries.all()),
  );
  const events = eventsQuery.data ?? loadedEvents;

  function select(keys: Set<Key>): void {
    const [key] = keys;
    const parsed = isoDateSchema.safeParse(key);
    if (parsed.success) setSelectedIso(parsed.data);
  }

  function goToToday(): void {
    setWeekOffset(0);
    setSelectedIso(todayIso);
  }

  const upcomingTournaments = events
    .filter((event) => event.kind === 'tournament' && event.date >= selectedIso)
    .slice(0, 2);

  return (
    <div className={styles.layout}>
      <section className={styles.calendar} aria-label="Calendar">
        <div className={styles.bar}>
          <h2 className={styles.title}>{rangeTitle(days)}</h2>
          <div className={styles.nav}>
            <Button
              variant="outline"
              className={styles.arrow}
              aria-label="Previous week"
              onPress={() => setWeekOffset(weekOffset - 1)}
            >
              <Icon name="arrowLeft" strokeWidth={2.4} />
            </Button>
            <Button variant="outline" className={styles.today} onPress={goToToday}>
              Today
            </Button>
            <Button
              variant="outline"
              className={styles.arrow}
              aria-label="Next week"
              onPress={() => setWeekOffset(weekOffset + 1)}
            >
              <Icon name="arrowRight" strokeWidth={2.4} />
            </Button>
          </div>
        </div>

        {eventsQuery.isError && (
          <p className={styles.notice} role="status">
            {loadedEvents.length === 0
              ? "We couldn't load your games."
              : "We couldn't refresh your games. These may be out of date."}
            <Button variant="outline" onPress={() => void eventsQuery.refetch()}>
              Try again
            </Button>
          </p>
        )}

        <div className={styles.weekdays} aria-hidden="true">
          {weekdayHeads.map((name) => (
            <span key={name} className={styles.weekday}>
              <span className={styles.weekdayFull}>{name}</span>
              <span className={styles.weekdayShort}>{name.slice(0, 1)}</span>
            </span>
          ))}
        </div>

        <ToggleGroup
          className={styles.grid}
          aria-label="Day"
          aria-busy={eventsQuery.isFetching}
          selectedKeys={[selectedIso]}
          onSelectionChange={select}
        >
          {days.map((day) => {
            const dayEvents = eventsOn(events, day.iso);
            const free = freeOn(freePlayers, day.iso, todayIso);
            const hasNote = (notes[day.iso] ?? '').trim() !== '';
            const classes = [
              styles.day,
              day.isPast ? styles.past : '',
              day.isToday ? styles.isToday : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <ToggleItem
                key={day.iso}
                id={day.iso}
                className={classes}
                aria-label={dayLabel(day, dayEvents, free.length, hasNote)}
              >
                <span className={styles.number}>
                  <span className={styles.numeral}>{day.dayOfMonth}</span>
                  {(day.dayOfMonth === 1 || day.iso === days[0]?.iso) && (
                    <small className={styles.monthName}>{day.month}</small>
                  )}
                </span>
                <EventChips events={dayEvents} hasNote={hasNote} />
                {free.length > 0 && (
                  <span className={styles.free}>
                    <span className={styles.faces}>
                      {free.slice(0, facesShown).map((player, index) => (
                        <span
                          key={player.id}
                          className={`${styles.face} ${faceTones[index % faceTones.length]}`}
                        />
                      ))}
                    </span>
                    {free.length > facesShown && (
                      <span className={styles.more}>+{free.length - facesShown}</span>
                    )}
                  </span>
                )}
              </ToggleItem>
            );
          })}
        </ToggleGroup>

        <ul className={styles.legend}>
          {legend.map((item) => (
            <li key={item.label} className={styles.legendItem}>
              <span className={`${styles.swatch} ${item.className}`} aria-hidden="true" />
              {item.label}
            </li>
          ))}
          <li>Faces = free to play</li>
        </ul>
      </section>

      <DayPanel
        iso={selectedIso}
        todayIso={todayIso}
        events={events}
        upcomingTournaments={upcomingTournaments}
        freePlayers={freePlayers}
        note={notes[selectedIso] ?? ''}
        onNoteChange={(note) => setNotes({ ...notes, [selectedIso]: note })}
      />
    </div>
  );
}
