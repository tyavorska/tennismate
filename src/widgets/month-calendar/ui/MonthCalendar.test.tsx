import { render, screen, within } from '@testing-library/react';
import { sampleConversations } from '@/entities/conversation';
import { InboxProvider } from '@/features/inbox';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  calendarEventSchema,
  freePlayerSchema,
  isoDateSchema,
  type CalendarEvent,
  type FreePlayer,
  type IsoDate,
} from '../index';
import { MonthCalendar } from './MonthCalendar';

const today = isoDateSchema.parse('2026-11-02');

const events: readonly CalendarEvent[] = [
  calendarEventSchema.parse({
    id: 'g1',
    kind: 'game',
    date: '2026-11-02',
    time: '19:00',
    title: 'Piotr W.',
    court: 'Kazimierz Clay Club',
    confirmed: true,
  }),
  calendarEventSchema.parse({
    id: 'o1',
    kind: 'open',
    date: '2026-11-02',
    time: '20:00',
    host: 'Kuba S.',
    court: 'Park Jordana',
    format: 'Singles',
  }),
  calendarEventSchema.parse({
    id: 'g2',
    kind: 'game',
    date: '2026-11-11',
    time: '18:00',
    title: 'Ewa L.',
    court: 'Park Jordana',
    confirmed: false,
  }),
  calendarEventSchema.parse({
    id: 't1',
    kind: 'tournament',
    date: '2026-11-15',
    name: 'Kraków Autumn Open',
    venue: 'Cracovia Tennis Club',
  }),
];

const freePlayers: readonly FreePlayer[] = [
  freePlayerSchema.parse({
    id: 'marta-k',
    name: 'Marta K.',
    initials: 'MK',
    rating: 3.5,
    window: 'Free 18:00–21:00',
    district: 'Podgórze',
    weekdays: [0, 2],
  }),
  freePlayerSchema.parse({
    id: 'ola-n',
    name: 'Ola N.',
    initials: 'ON',
    rating: 3,
    window: 'Free 17:00–20:00',
    district: 'Nowa Huta',
    weekdays: [0],
  }),
];

function renderCalendar(initialDay?: IsoDate): ReturnType<typeof userEvent.setup> {
  render(
    <InboxProvider conversations={sampleConversations}>
      <MonthCalendar
        todayIso={today}
        events={events}
        freePlayers={freePlayers}
        initialDay={initialDay}
      />
    </InboxProvider>,
  );
  return userEvent.setup();
}

function day(name: RegExp) {
  return screen.getByRole('radio', { name });
}

describe('MonthCalendar', () => {
  describe('the month', () => {
    it('shows five weeks starting on the Monday of this week', () => {
      renderCalendar();

      expect(screen.getByRole('heading', { name: '2 Nov – 6 Dec 2026' })).toBeInTheDocument();
      expect(
        within(screen.getByRole('radiogroup', { name: 'Day' })).getAllByRole('radio'),
      ).toHaveLength(35);
    });

    it('names each day with its events so the colour bars on phones are not the only signal', () => {
      renderCalendar();

      expect(day(/^Mon, 2 Nov, today/)).toHaveAccessibleName(
        'Mon, 2 Nov, today: 19:00 Piotr W.; open game at 20:00; 2 players free',
      );
      expect(day(/^Wed, 11 Nov/)).toHaveAccessibleName(
        'Wed, 11 Nov: 18:00 Ewa L., waiting for reply; 1 player free',
      );
      expect(day(/^Sun, 15 Nov/)).toHaveAccessibleName(
        'Sun, 15 Nov: tournament Kraków Autumn Open',
      );
    });

    it('selects today first', () => {
      renderCalendar();

      expect(day(/^Mon, 2 Nov/)).toBeChecked();
    });

    it('moves by a week and back to today', async () => {
      const user = renderCalendar();

      await user.click(screen.getByRole('button', { name: 'Next week' }));
      expect(screen.getByRole('heading', { name: '9 Nov – 13 Dec 2026' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Previous week' }));
      await user.click(screen.getByRole('button', { name: 'Previous week' }));
      expect(screen.getByRole('heading', { name: '26 Oct – 29 Nov 2026' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Today' }));
      expect(screen.getByRole('heading', { name: '2 Nov – 6 Dec 2026' })).toBeInTheDocument();
    });
  });

  describe('opening on a given day', () => {
    it('selects the day it was opened with and shows its details', () => {
      renderCalendar(isoDateSchema.parse('2026-11-11'));

      expect(day(/^Wed, 11 Nov/)).toBeChecked();
      const panel = screen.getByRole('region', { name: 'Selected day' });
      expect(within(panel).getByRole('heading', { name: 'Wed, 11 Nov' })).toBeInTheDocument();
    });

    it('moves to the weeks that hold a day beyond the five shown', () => {
      renderCalendar(isoDateSchema.parse('2027-01-20'));

      expect(day(/^Wed, 20 Jan/)).toBeChecked();
    });
  });

  describe('the selected day', () => {
    it('starts with today: its bookings, open games and who is free', () => {
      renderCalendar();

      const panel = screen.getByRole('region', { name: 'Selected day' });
      expect(within(panel).getByRole('heading', { name: 'Mon, 2 Nov' })).toBeInTheDocument();
      expect(within(panel).getByText('Today')).toBeInTheDocument();
      expect(
        within(panel).getByText('1 booking · 2 players free · 1 open game'),
      ).toBeInTheDocument();
      expect(within(panel).getByText('19:00 · vs Piotr W.')).toBeInTheDocument();
      expect(within(panel).getByText('Confirmed')).toBeInTheDocument();
      expect(within(panel).getByText('Marta K. · 3.5')).toBeInTheDocument();
    });

    it('switches to another day on click', async () => {
      const user = renderCalendar();

      await user.click(day(/^Wed, 11 Nov/));

      const panel = screen.getByRole('region', { name: 'Selected day' });
      expect(within(panel).getByRole('heading', { name: 'Wed, 11 Nov' })).toBeInTheDocument();
      expect(within(panel).getByText('Waiting for reply', { exact: false })).toBeInTheDocument();
    });

    it('says so when nothing is booked and nobody is free', async () => {
      const user = renderCalendar();

      await user.click(day(/^Tue, 3 Nov/));

      const panel = screen.getByRole('region', { name: 'Selected day' });
      expect(within(panel).getByText('Nothing booked.')).toBeInTheDocument();
      expect(within(panel).getByText('No one has marked this day yet.')).toBeInTheDocument();
    });

    it('lists the next tournaments from the selected day', async () => {
      const user = renderCalendar();

      const panel = screen.getByRole('region', { name: 'Selected day' });
      expect(within(panel).getByText('Kraków Autumn Open')).toBeInTheDocument();

      await user.click(day(/^Mon, 16 Nov/));
      expect(within(panel).getByText('No tournaments planned.')).toBeInTheDocument();
    });

    it('lets you join an open game and leave it again', async () => {
      const user = renderCalendar();

      await user.click(screen.getByRole('button', { name: 'Join' }));
      expect(screen.getByRole('button', { name: 'Joined ✓' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await user.click(screen.getByRole('button', { name: 'Joined ✓' }));
      expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    });

    it('keeps a note per day and marks the day that has one', async () => {
      const user = renderCalendar();

      await user.type(screen.getByRole('textbox', { name: 'My note' }), 'Restring racket');
      expect(day(/^Mon, 2 Nov/)).toHaveAccessibleName(expect.stringContaining('note'));

      await user.click(day(/^Tue, 3 Nov/));
      expect(screen.getByRole('textbox', { name: 'My note' })).toHaveValue('');

      await user.click(day(/^Mon, 2 Nov/));
      expect(screen.getByRole('textbox', { name: 'My note' })).toHaveValue('Restring racket');
    });

    it('opens the chat with the invite form when you press "Let\'s play" on a free player', async () => {
      const user = renderCalendar();

      await user.click(screen.getByRole('button', { name: "Let's play with Marta K." }));

      const drawer = screen.getByRole('dialog', { name: 'Messages' });
      expect(within(drawer).getByRole('heading', { name: 'Marta K.' })).toBeInTheDocument();
      expect(within(drawer).getByRole('form', { name: 'Propose a court' })).toBeInTheDocument();
    });

    it('sends the invite into the chat and plans the game', async () => {
      const user = renderCalendar();
      await user.click(screen.getByRole('button', { name: "Let's play with Marta K." }));

      await user.click(screen.getByRole('button', { name: /Send "let's play" invite/ }));

      const drawer = screen.getByRole('dialog', { name: 'Messages' });
      expect(
        within(drawer).getByText("Let's play at Kazimierz Clay Club, Tomorrow 10:00?"),
      ).toBeInTheDocument();
      expect(within(drawer).getByText('Tomorrow 10:00 · Kazimierz Clay Club')).toBeInTheDocument();
      expect(
        within(drawer).queryByRole('form', { name: 'Propose a court' }),
      ).not.toBeInTheDocument();
    });

    it('links "I\'m free this day" to the offer form on the players page', () => {
      renderCalendar();

      expect(screen.getByRole('link', { name: "I'm free this day" })).toHaveAttribute(
        'href',
        '/players?offer=1',
      );
    });
  });
});
