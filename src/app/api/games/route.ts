import { NextResponse } from 'next/server';
import { newGameSchema, type OpenGame } from '@/entities/player';
import { createGame, listOpenGames } from '@/server/games';
import { handleAuthed, parseBody } from '@/server/http';

export function GET(): Promise<NextResponse> {
  return handleAuthed('games.list', (user) =>
    NextResponse.json<readonly OpenGame[]>(listOpenGames(user)),
  );
}

export function POST(request: Request): Promise<NextResponse> {
  return handleAuthed('games.create', async (user) => {
    const input = await parseBody(request, newGameSchema);
    return NextResponse.json<OpenGame>(createGame(user, input), { status: 201 });
  });
}
