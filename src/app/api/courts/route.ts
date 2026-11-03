import { NextResponse } from 'next/server';
import type { Court } from '@/entities/court';
import { listCourts } from '@/server/courts';
import { handleAuthed } from '@/server/http';
import { ensureProfile } from '@/server/profiles';

export function GET(): Promise<NextResponse> {
  return handleAuthed('courts.list', (user) =>
    NextResponse.json<readonly Court[]>(listCourts(ensureProfile(user).city.id)),
  );
}
