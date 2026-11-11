import { NextResponse } from 'next/server';
import { z } from 'zod';
import { markRead } from '@/server/conversations';
import { handleAuthed, parseInput } from '@/server/http';

export async function PUT(
  _request: Request,
  context: RouteContext<'/api/conversations/[id]/read'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  return handleAuthed('conversations.read', (user) => {
    markRead(user, parseInput(z.uuid(), id));
    return new NextResponse(null, { status: 204 });
  });
}
