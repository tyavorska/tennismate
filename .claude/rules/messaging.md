---
paths:
  - 'src/entities/conversation/**'
  - 'src/features/inbox/**'
  - 'src/server/conversations/**'
  - 'src/server/realtime/**'
  - 'src/app/api/conversations/**'
  - 'src/app/providers/RealtimeProvider.tsx'
  - 'src/shared/hooks/useSocket.ts'
  - 'scripts/realtime.ts'
---

# Messaging

The design (rooms, acknowledgements, reconnect, Redis) is in the `realtime-messaging` skill. This
file says what is built and the decisions that hold the code together.

## What it does

- **Instant messages.** A message goes over the socket (`message:send`), is saved, then pushed
  (`message:new`) to every open tab of the recipient and to the sender's other tabs. The sender's
  tab gets it as the acknowledgement. Route Handlers serve only history: the conversation list, the
  messages of one conversation, and mark as read.
- **No duplicates.** Every send carries a `clientMessageId`. Sending it again returns the message
  already saved. The thread keeps the id of a failed send, so Retry never double-posts.
- **Unread.** Counted per conversation from a read position (`last_read_message_id`), never stored
  as a flag. Opening a conversation marks it read.
- **After a reconnect** the client asks for the messages after the last one it has
  (`?after=<id>`) and refreshes the list. It never trusts the socket buffer.
- **Online status.** The realtime process counts open sockets per player, so a player is online
  until the last tab closes. It is told only to people who share a conversation with them. It lives
  in memory, so REST cannot know it. The client keeps it in the query cache (`presenceQueries`).
- **Invites.** "Propose a court" sends a message that carries a court and a time. The latest invite
  in a conversation is its plan, shown above the thread for both players. An invite does not create
  a game or a booking.

## Decisions

- **Order by `rowid`, not by time and id.** Message ids are random and two messages can share a
  millisecond, so ordering by `(created_at, id)` would skip a message in unread counts and in
  `after=` cursors. Use the table's `rowid`, which grows with every insert.
- **One conversation per pair**, stored `user_a < user_b` with a `UNIQUE` constraint. It is created
  with the first message, never when a chat is opened. A chat with someone who has no conversation
  yet is addressed by their id.
- **Same city only.** The recipient must be in the sender's city, and a conversation whose other
  player has moved cities disappears from both lists. Both answer `notFound`.
- **A bad send answers on the acknowledgement**, as `{ ok: false, problem }` with a `Problem` from
  `shared/api`. It never throws into the socket. A send over the rate limit answers `rateLimited`.
- **Every payload is parsed with Zod on both sides.** Schemas live in
  `entities/conversation/model/events.ts`. The server drops a send without a callback.
- **The process authenticates the handshake** with the session cookie, through
  `findUserBySessionToken` (no `cookies()` outside Next). A player without a city cannot connect.
- **Two processes share one SQLite file**, so the connection sets `busy_timeout`. The realtime
  process runs under `scripts/tsconfig.realtime.json`, which maps `server-only` to an empty module.
  Do not run it with `--conditions=react-server`: it breaks TanStack Query.
- **The socket is created once per tab** in `app/providers/RealtimeProvider.tsx` and read through
  `useSocket` from `shared/hooks`. Events update the query cache with `setQueryData`. Never copy
  conversations into `useState`.
- **Presence is in memory**, so it does not survive a restart and works for one realtime process.
  A second instance needs the Redis adapter, with presence in Redis and a short TTL.

## Rules

- Never return an email or coordinates in a conversation. A partner is `id`, `name`, `initials`
  and a subtitle.
- A change to the messages tables goes in a new migration. Test it from the previous schema.
- Server tests cover the failure branches: a stranger, another city, a repeated send, a bad cursor.
- The socket integration test (`server/realtime/realtimeServer.test.ts`) must pass before merging
  a change to events or presence.
- UI tests use `TestRealtime` and `createTestSocket` from `@/shared/testing`, which answer sends
  without a server.
- Never show made-up players. See "No invented people" in `docs/roadmap.md`.
