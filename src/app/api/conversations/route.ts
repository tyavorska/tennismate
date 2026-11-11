import { NextResponse } from 'next/server';
import type { Conversation } from '@/entities/conversation';
import { listConversations } from '@/server/conversations';
import { handleAuthed } from '@/server/http';

export function GET(): Promise<NextResponse> {
  return handleAuthed('conversations.list', (user) =>
    NextResponse.json<readonly Conversation[]>(listConversations(user)),
  );
}
