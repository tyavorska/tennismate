import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Message } from '@/entities/conversation';
import { listMessages } from '@/server/conversations';
import { handleAuthed, parseInput } from '@/server/http';

export async function GET(
  request: Request,
  context: RouteContext<'/api/conversations/[id]/messages'>,
): Promise<NextResponse> {
  const { id } = await context.params;
  const after = new URL(request.url).searchParams.get('after') ?? undefined;
  return handleAuthed('conversations.messages', (user) => {
    const messages = listMessages(user, parseInput(z.uuid(), id), {
      after: parseInput(z.uuid().optional(), after),
    });
    return NextResponse.json<readonly Message[]>(messages);
  });
}
