import type { Metadata } from 'next';
import { z } from 'zod';
import { CalendarPage } from '@/views/calendar';

export const metadata: Metadata = { title: 'My calendar | Let.' };

const krakowDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const searchParamsSchema = z.object({ day: z.string().optional() });

export default async function Page(props: PageProps<'/calendar'>) {
  const { day } = searchParamsSchema.catch({}).parse(await props.searchParams);

  return <CalendarPage today={krakowDate.format(new Date())} day={day} />;
}
