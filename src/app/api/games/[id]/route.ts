import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteGame } from '@/server/games';
import { handleAuthed, parseInput } from '@/server/http';

export async function DELETE(
  _request: Request,
  context: RouteContext<'/api/games/[id]'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('games.delete', (user) => {
    deleteGame(user, parseInput(z.uuid(), id));
    return new NextResponse(null, { status: 204 });
  });
}
