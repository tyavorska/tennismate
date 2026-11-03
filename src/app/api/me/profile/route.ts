import { NextResponse } from 'next/server';
import { newProfileSchema, type Player } from '@/entities/player';
import { handleAuthed, parseBody } from '@/server/http';
import { createProfile } from '@/server/profiles';

/** Creates the profile of a signed-in account that has none yet, in the chosen city. */
export function POST(request: Request): Promise<NextResponse> {
  return handleAuthed('profile.create', async (user) => {
    const { cityId } = await parseBody(request, newProfileSchema);
    return NextResponse.json<Player>(createProfile(user, cityId), { status: 201 });
  });
}
