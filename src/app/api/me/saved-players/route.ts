import { NextResponse } from 'next/server';
import { handleAuthed } from '@/server/http';
import { listSavedPlayerIds } from '@/server/players';

export function GET(): Promise<NextResponse> {
  return handleAuthed('saved-players.list', (user) =>
    NextResponse.json<readonly string[]>(listSavedPlayerIds(user.id)),
  );
}
