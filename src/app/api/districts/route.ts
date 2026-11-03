import { NextResponse } from 'next/server';
import { listDistricts } from '@/server/courts';
import { handleAuthed } from '@/server/http';

export function GET(): Promise<NextResponse> {
  return handleAuthed('districts.list', () =>
    NextResponse.json<readonly string[]>(listDistricts()),
  );
}
