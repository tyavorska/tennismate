import { NextResponse } from 'next/server';
import { profileUpdateSchema, type Player } from '@/entities/player';
import { deleteAccountRequestSchema } from '@/entities/user';
import { checkRateLimit, deleteAccount, deleteSession, resetRateLimit } from '@/server/auth';
import { handleAuthed, parseBody, problem } from '@/server/http';
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

export function DELETE(request: Request): Promise<NextResponse> {
  return handleAuthed('account.delete', async (user) => {
    const { password } = await parseBody(request, deleteAccountRequestSchema);

    const rateLimitKey = `delete-account:${user.id}`;
    const limit = checkRateLimit(rateLimitKey);
    if (!limit.allowed) {
      return problem('rateLimited', {
        message: 'Too many attempts. Try again in a minute.',
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    if (!(await deleteAccount(user, password))) {
      return problem('validation', { fieldErrors: { password: 'Password is incorrect.' } });
    }

    resetRateLimit(rateLimitKey);
    await deleteSession();
    return new NextResponse(null, { status: 204 });
  });
}
