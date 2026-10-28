import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiFetch } from './apiFetch';
import type { ApiError } from './errors';

const schema = z.object({ id: z.string() });

function respondWith(body: string, status: number, headers: Record<string, string> = {}): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status, headers })));
}

async function failure(): Promise<ApiError | undefined> {
  return apiFetch('/test', { schema }).then(
    () => undefined,
    (error: ApiError) => error,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('returns the parsed body on success', async () => {
    respondWith('{"id":"1"}', 200);
    await expect(apiFetch('/test', { schema })).resolves.toEqual({ id: '1' });
  });

  it('classifies a body that fails the schema as malformed', async () => {
    respondWith('{"name":"x"}', 200);
    expect((await failure())?.kind).toBe('malformed');
  });

  it('classifies a failed request as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect((await failure())?.kind).toBe('network');
  });

  it('uses the kind, message and field errors from a problem body', async () => {
    respondWith('{"kind":"conflict","message":"Taken","fieldErrors":{"email":"Taken"}}', 409);
    const error = await failure();
    expect(error).toMatchObject({ kind: 'conflict', message: 'Taken' });
    expect(error?.fieldErrors).toEqual({ email: 'Taken' });
  });

  it('falls back to the status code when the body is not a problem', async () => {
    respondWith('<html>Bad gateway</html>', 502);
    expect((await failure())?.kind).toBe('unavailable');
  });

  it('reads Retry-After when rate limited', async () => {
    respondWith('{"kind":"rateLimited"}', 429, { 'Retry-After': '30' });
    expect((await failure())?.retryAfterSeconds).toBe(30);
  });
});
