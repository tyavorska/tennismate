import type { z } from 'zod';
import { ApiError, problemSchema, type ErrorKind } from './errors';

const timeoutMs = 10_000;

const kindByStatus: Readonly<Record<number, ErrorKind>> = {
  400: 'validation',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validation',
  429: 'rateLimited',
  502: 'unavailable',
  503: 'unavailable',
  504: 'unavailable',
};

function kindForStatus(status: number): ErrorKind {
  return kindByStatus[status] ?? (status >= 500 ? 'server' : 'unexpected');
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

async function readJson(response: Response): Promise<z.core.util.JSONType | undefined> {
  const text = await response.text().catch(() => {
    throw new ApiError({ kind: 'network' });
  });
  try {
    return text === '' ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  const problem = problemSchema.safeParse(await readJson(response));
  const fallback = { kind: kindForStatus(response.status) };
  return new ApiError(problem.success ? problem.data : fallback, retryAfter(response));
}

type ApiFetchOptions<TSchema extends z.ZodType> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: z.core.util.JSONType;
  schema: TSchema;
};

/** Always rejects with an ApiError. */
export async function apiFetch<TSchema extends z.ZodType>(
  url: string,
  { method = 'GET', body, schema }: ApiFetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      ...(body !== undefined && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      signal: AbortSignal.timeout(timeoutMs),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError({ kind: 'network' });
  }

  if (!response.ok) throw await errorFromResponse(response);

  const parsed = schema.safeParse(await readJson(response));
  if (!parsed.success) throw new ApiError({ kind: 'malformed' });
  return parsed.data;
}
