import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleAuthed, parseInput } from '@/server/http';
import { savePlayer, unsavePlayer } from '@/server/players';

export async function PUT(
  _request: Request,
  context: RouteContext<'/api/me/saved-players/[id]'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('saved-players.save', (user) => {
    savePlayer(user, parseInput(z.uuid(), id));
    return new NextResponse(null, { status: 204 });
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<'/api/me/saved-players/[id]'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('saved-players.remove', (user) => {
    unsavePlayer(user, parseInput(z.uuid(), id));
    return new NextResponse(null, { status: 204 });
  });
}
