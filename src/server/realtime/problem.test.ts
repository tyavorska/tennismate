// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '../http';
import { toProblem } from './problem';

afterEach(() => vi.restoreAllMocks());

describe('toProblem', () => {
  it('passes a domain error through without logging it', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const problem = toProblem(
      new DomainError('conflict', { message: 'This invite is closed.' }),
      'x',
    );

    expect(problem).toMatchObject({ kind: 'conflict', message: 'This invite is closed.' });
    expect(log).not.toHaveBeenCalled();
  });

  it('hides an unexpected error behind a request id and logs the detail once', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const problem = toProblem(new Error('SQLITE_BUSY: database is locked'), 'message.send');

    expect(problem.kind).toBe('server');
    expect(problem.message).toBeUndefined();
    expect(JSON.stringify(problem)).not.toContain('SQLITE');
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(line).toMatchObject({
      level: 'error',
      kind: 'server',
      operation: 'message.send',
      status: 500,
      requestId: problem.requestId,
      detail: 'SQLITE_BUSY: database is locked',
    });
  });

  it('gives each failure its own request id', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(toProblem('a', 'x').requestId).not.toBe(toProblem('a', 'x').requestId);
  });
});
