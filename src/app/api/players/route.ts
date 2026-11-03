import { NextResponse } from 'next/server';
import type { PlayerListing } from '@/entities/player';
import { handleAuthed } from '@/server/http';
import { listPlayers } from '@/server/players';

export function GET(): Promise<NextResponse> {
  return handleAuthed('players.list', (user) =>
    NextResponse.json<readonly PlayerListing[]>(listPlayers(user)),
  );
}
