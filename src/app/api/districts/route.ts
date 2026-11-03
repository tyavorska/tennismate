import { NextResponse } from 'next/server';
import { listDistricts } from '@/server/courts';
import { handleAuthed } from '@/server/http';
import { ensureProfile } from '@/server/profiles';

export function GET(): Promise<NextResponse> {
  return handleAuthed('districts.list', (user) =>
    NextResponse.json<readonly string[]>(listDistricts(ensureProfile(user).city.id)),
  );
}
