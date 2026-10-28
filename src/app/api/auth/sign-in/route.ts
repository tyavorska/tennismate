import { NextResponse } from 'next/server';
import { signInCredentialsSchema, type User } from '@/entities/user';
import { authenticate, checkRateLimit, createSession, resetRateLimit } from '@/server/auth';
import { clientIp, fieldErrorsFrom, problem, readJsonBody, unexpectedProblem } from '@/server/http';

export async function POST(request: Request): Promise<NextResponse> {
  const input = signInCredentialsSchema.safeParse(await readJsonBody(request));
  if (!input.success) {
    return problem('validation', { fieldErrors: fieldErrorsFrom(input.error) });
  }

  const rateLimitKey = `sign-in:${clientIp(request)}:${input.data.email}`;
  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    return problem('rateLimited', {
      message: 'Too many sign-in attempts. Try again in a minute.',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  try {
    const user = await authenticate(input.data);
    if (user === undefined) {
      // Same answer for an unknown email and a wrong password, so accounts cannot be probed.
      return problem('unauthenticated', { message: 'Email or password is incorrect.' });
    }

    await createSession(user.id);
    resetRateLimit(rateLimitKey);
    return NextResponse.json<User>(user);
  } catch (error) {
    return unexpectedProblem('sign-in', error instanceof Error ? error : String(error));
  }
}
