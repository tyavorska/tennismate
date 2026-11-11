import type { QueryClient } from '@tanstack/react-query';
import { retryDelay as backoff, shouldRetry } from '@/shared/api';
import { conversationMutationKeys } from '../api/conversationQueries';

/** A message that cannot be sent makes the player wait, so it is tried 3 times, not 4. */
const maxRetries = 2;

type Options = Readonly<{
  /** For tests, so a retry does not wait. */
  retryDelay?: (attempt: number, error: Error) => number;
}>;

/**
 * Sends and invite answers are safe to repeat: a message carries its `clientMessageId` and an
 * answer given twice changes nothing. That is why, unlike other writes, they retry on their own.
 */
export function registerConversationMutations(
  queryClient: QueryClient,
  { retryDelay = backoff }: Options = {},
): void {
  const retry = (failureCount: number, error: Error): boolean =>
    shouldRetry(failureCount, error, maxRetries);
  queryClient.setMutationDefaults(conversationMutationKeys.send, { retry, retryDelay });
  queryClient.setMutationDefaults(conversationMutationKeys.respondToInvite, {
    retry,
    retryDelay,
  });
}
