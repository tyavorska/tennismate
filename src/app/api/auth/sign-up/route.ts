import { NextResponse } from 'next/server';
import { credentialsSchema, type User } from '@/entities/user';
import { checkRateLimit, createSession, createUser, EmailTakenError } from '@/server/auth';
import { clientIp, fieldErrorsFrom, problem, readJsonBody, unexpectedProblem } from '@/server/http';

export async function POST(request: Request): Promise<NextResponse> {
  const input = credentialsSchema.safeParse(await readJsonBody(request));
  if (!input.success) {
    return problem('validation', { fieldErrors: fieldErrorsFrom(input.error) });
  }

  const limit = checkRateLimit(`sign-up:${clientIp(request)}`);
  if (!limit.allowed) {
    return problem('rateLimited', {
      message: 'Too many sign-up attempts. Try again in a minute.',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  try {
    const user = await createUser(input.data);
    await createSession(user.id);
    return NextResponse.json<User>(user, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return problem('conflict', {
        message: 'An account with this email already exists.',
        fieldErrors: { email: 'An account with this email already exists.' },
      });
    }
    return unexpectedProblem('sign-up', error instanceof Error ? error : String(error));
  }
}
