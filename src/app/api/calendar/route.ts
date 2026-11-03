import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CalendarEvent } from '@/entities/game';
import { listCalendarEvents } from '@/server/games';
import { handleAuthed, parseInput } from '@/server/http';
import { isoDateSchema } from '@/shared/lib';

const rangeSchema = z.object({ from: isoDateSchema, to: isoDateSchema });

export function GET(request: Request): Promise<NextResponse> {
  return handleAuthed('calendar.list', (user) => {
    const range = parseInput(rangeSchema, Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json<readonly CalendarEvent[]>(
      listCalendarEvents(user, range.from, range.to),
    );
  });
}
