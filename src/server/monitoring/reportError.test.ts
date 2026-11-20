// @vitest-environment node
import { captureException } from '@sentry/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DomainError, unexpectedProblem } from '../http';
import { toProblem } from '../realtime/problem';

vi.mock('@sentry/node', () => ({ captureException: vi.fn(() => 'id'), init: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe('error reporting', () => {
  it('sends an unexpected route failure to Sentry with its request id', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = unexpectedProblem('games.create', new Error('SQLITE_BUSY'));
    const { requestId } = await response.json();

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'SQLITE_BUSY' }),
      { tags: { operation: 'games.create' }, extra: { requestId } },
    );
  });

  it('sends an unexpected socket failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    toProblem(new Error('boom'), 'message.send');

    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('does not send an expected domain error', () => {
    toProblem(new DomainError('conflict'), 'message.send');

    expect(captureException).not.toHaveBeenCalled();
  });
});
