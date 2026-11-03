import { NextResponse } from 'next/server';
import { profileUpdateSchema, type Player } from '@/entities/player';
import { handleAuthed, parseBody } from '@/server/http';
import { requireProfile, updateProfile } from '@/server/profiles';

export function GET(): Promise<NextResponse> {
  return handleAuthed('profile.get', (user) => NextResponse.json<Player>(requireProfile(user)));
}

export function PATCH(request: Request): Promise<NextResponse> {
  return handleAuthed('profile.update', async (user) => {
    const update = await parseBody(request, profileUpdateSchema);
    return NextResponse.json<Player>(updateProfile(user, update));
  });
}
