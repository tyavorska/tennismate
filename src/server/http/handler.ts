import 'server-only';
import type { NextResponse } from 'next/server';
import type { z } from 'zod';
import type { User } from '@/entities/user';
import { getCurrentUser } from '../auth';
import { DomainError } from './errors';
import { fieldErrorsFrom, problem, readJsonBody, unexpectedProblem } from './problem';

/** Parses with Zod and throws a `validation` error with per-field text when the input is wrong. */
export function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.core.util.JSONType | undefined,
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new DomainError('validation', { fieldErrors: fieldErrorsFrom(parsed.error) });
  return parsed.data;
}

export async function parseBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  return parseInput(schema, await readJsonBody(request));
}

/**
 * Runs a Route Handler for the signed-in user. The proxy skips `/api`, so this is the only check:
 * no session answers 401, and a `DomainError` becomes its response.
 */
export async function handleAuthed(
  operation: string,
  run: (user: User) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (user === undefined) return problem('unauthenticated');
    return await run(user);
  } catch (error) {
    if (error instanceof DomainError) {
      return problem(error.kind, { message: error.publicMessage, fieldErrors: error.fieldErrors });
    }
    return unexpectedProblem(operation, error instanceof Error ? error : String(error));
  }
}
