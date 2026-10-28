import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { errorPolicy, type ErrorKind, type Problem } from '@/shared/api';

type ProblemOptions = Readonly<{
  message?: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
  requestId?: string;
}>;

export function problem(kind: ErrorKind, options: ProblemOptions = {}): NextResponse<Problem> {
  const body: Problem = {
    kind,
    message: options.message,
    fieldErrors: options.fieldErrors,
    requestId: options.requestId ?? randomUUID(),
  };
  return NextResponse.json(body, {
    status: errorPolicy[kind].status,
    ...(options.retryAfterSeconds !== undefined && {
      headers: { 'Retry-After': String(options.retryAfterSeconds) },
    }),
  });
}

// First issue per field wins.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((fields, issue) => {
    const field = String(issue.path[0] ?? 'form');
    return field in fields ? fields : { ...fields, [field]: issue.message };
  }, {});
}

// Logs the detail and returns a generic message, so no internals reach the client.
export function unexpectedProblem(operation: string, error: Error | string): NextResponse<Problem> {
  const requestId = randomUUID();
  const detail = error instanceof Error ? error.message : error;
  console.error(JSON.stringify({ level: 'error', kind: 'server', operation, requestId, detail }));
  return problem('server', { requestId });
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

export async function readJsonBody(request: Request): Promise<z.core.util.JSONType | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
