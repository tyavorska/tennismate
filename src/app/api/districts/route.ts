import { NextResponse } from 'next/server';
import { listDistricts } from '@/server/courts';
import { handleAuthed } from '@/server/http';
import { requireProfile } from '@/server/profiles';

export function GET(): Promise<NextResponse> {
  return handleAuthed('districts.list', (user) =>
    NextResponse.json<readonly string[]>(listDistricts(requireProfile(user).city.id)),
  );
}
