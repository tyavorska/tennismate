import 'server-only';

/** Counts open connections per user, so a player with two tabs is online until both close. */
export function createPresence() {
  const connections = new Map<string, number>();

  return {
    /** Returns true when this connection made the player come online. */
    connect(userId: string): boolean {
      const count = connections.get(userId) ?? 0;
      connections.set(userId, count + 1);
      return count === 0;
    },
    /** Returns true when this was the player's last connection. */
    disconnect(userId: string): boolean {
      const count = connections.get(userId) ?? 0;
      if (count <= 1) {
        connections.delete(userId);
        return count === 1;
      }
      connections.set(userId, count - 1);
      return false;
    },
    isOnline: (userId: string): boolean => connections.has(userId),
    onlineAmong: (userIds: readonly string[]): string[] =>
      userIds.filter((userId) => connections.has(userId)),
  };
}

export type Presence = ReturnType<typeof createPresence>;
