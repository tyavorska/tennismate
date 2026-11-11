import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { conversationMutationKeys } from '../api/conversationQueries';
import { registerConversationMutations } from './mutations';

function retryOf(queryClient: QueryClient, key: readonly string[]) {
  const retry = queryClient.getMutationDefaults(key)?.retry;
  if (typeof retry !== 'function') throw new Error('No retry rule registered');
  return retry;
}

describe('registerConversationMutations', () => {
  it.each([
    ['a send', conversationMutationKeys.send],
    ['an invite answer', conversationMutationKeys.respondToInvite],
  ])('retries %s twice on a network failure, then stops', (_name, key) => {
    const queryClient = new QueryClient();
    registerConversationMutations(queryClient);
    const retry = retryOf(queryClient, key);
    const error = new ApiError({ kind: 'network' });

    expect([0, 1, 2].map((failures) => retry(failures, error))).toEqual([true, true, false]);
  });

  it('does not retry a conflict or a missing item', () => {
    const queryClient = new QueryClient();
    registerConversationMutations(queryClient);
    const retry = retryOf(queryClient, conversationMutationKeys.send);

    expect(retry(0, new ApiError({ kind: 'conflict' }))).toBe(false);
    expect(retry(0, new ApiError({ kind: 'notFound' }))).toBe(false);
  });
});
