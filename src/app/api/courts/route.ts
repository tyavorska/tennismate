import { NextResponse } from 'next/server';
import type { Court } from '@/entities/court';
import { listCourts } from '@/server/courts';
import { handleAuthed } from '@/server/http';

export function GET(): Promise<NextResponse> {
  return handleAuthed('courts.list', () => NextResponse.json<readonly Court[]>(listCourts()));
}
