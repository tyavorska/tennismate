import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { OpenGame } from '@/entities/player';
import { joinGame, leaveGame } from '@/server/games';
import { handleAuthed, parseInput } from '@/server/http';

export async function PUT(
  _request: Request,
  context: RouteContext<'/api/games/[id]/participation'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('games.join', (user) =>
    NextResponse.json<OpenGame>(joinGame(user, parseInput(z.uuid(), id))),
  );
}

export async function DELETE(
  _request: Request,
  context: RouteContext<'/api/games/[id]/participation'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('games.leave', (user) =>
    NextResponse.json<OpenGame>(leaveGame(user, parseInput(z.uuid(), id))),
  );
}
