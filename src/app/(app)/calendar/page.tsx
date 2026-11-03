import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { calendarQueries } from '@/entities/game';
import { getCurrentUser } from '@/server/auth';
import { listCalendarEvents } from '@/server/games';
import { getProfile } from '@/server/profiles';
import { todayInKrakow } from '@/shared/lib';
import { CalendarPage } from '@/views/calendar';
import { isoDateSchema, visibleRange, weekOffsetFor } from '@/widgets/month-calendar';

export const metadata: Metadata = { title: 'My calendar | Let.' };

const searchParamsSchema = z.object({ day: z.string().optional() });

export default async function Page(props: PageProps<'/calendar'>) {
  const user = await getCurrentUser();
  if (user === undefined) redirect('/sign-in');
  if (getProfile(user) === undefined) redirect('/choose-city');

  const { day } = searchParamsSchema.catch({}).parse(await props.searchParams);
  const today = todayInKrakow(new Date());
  const initialDay = isoDateSchema.safeParse(day);

  // The first five weeks the calendar shows are handed over, so it opens with its games in place.
  const { from, to } = visibleRange(
    today,
    initialDay.success ? weekOffsetFor(today, initialDay.data) : 0,
  );
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: calendarQueries.range(from, to).queryKey,
    queryFn: () => listCalendarEvents(user, from, to),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPage today={today} day={day} />
    </HydrationBoundary>
  );
}
