import { NextResponse } from 'next/server';
import type { Court } from '@/entities/court';
import { listCourts } from '@/server/courts';
import { handleAuthed } from '@/server/http';
import { requireProfile } from '@/server/profiles';

export function GET(): Promise<NextResponse> {
  return handleAuthed('courts.list', (user) =>
    NextResponse.json<readonly Court[]>(listCourts(requireProfile(user).city.id)),
  );
}
