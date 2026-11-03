import { NextResponse } from 'next/server';
import { signUpRequestSchema, type User } from '@/entities/user';
import { checkRateLimit, createSession, createUser, EmailTakenError } from '@/server/auth';
import { requireCity } from '@/server/cities';
import {
  clientIp,
  DomainError,
  fieldErrorsFrom,
  problem,
  readJsonBody,
  unexpectedProblem,
} from '@/server/http';
import { createProfile } from '@/server/profiles';

export async function POST(request: Request): Promise<NextResponse> {
  const input = signUpRequestSchema.safeParse(await readJsonBody(request));
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
    // Checked first, so a wrong city never leaves an account behind.
    requireCity(input.data.cityId);
    const user = await createUser(input.data);
    createProfile(user, input.data.cityId);
    await createSession(user.id);
    return NextResponse.json<User>(user, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return problem('conflict', {
        message: 'An account with this email already exists.',
        fieldErrors: { email: 'An account with this email already exists.' },
      });
    }
    if (error instanceof DomainError) {
      return problem(error.kind, { message: error.publicMessage, fieldErrors: error.fieldErrors });
    }
    return unexpectedProblem('sign-up', error instanceof Error ? error : String(error));
  }
}
