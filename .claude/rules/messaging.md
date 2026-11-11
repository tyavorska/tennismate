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
  (`?after=<id>`), refreshes the list and the calendar, and reloads any thread that holds a pending
  invite, because an answer given meanwhile changes an older message. It never trusts the socket buffer.
- **Online status.** The realtime process counts open sockets per player, so a player is online
  until the last tab closes. It is told only to people who share a conversation with them. It lives
  in memory, so REST cannot know it. The client keeps it in the query cache (`presenceQueries`).
- **Game invites.** "Propose a court" sends a message that carries a real court of the city, a day
  and a time. It shows in the thread as a card. The other player accepts or declines, the proposer
  can cancel. Accepting creates the game (the proposer hosts, the other player takes the one spot),
  so it appears in both calendars, and writes the reply "Accepted! See you on court" into the chat.
  The plan above the thread is the next accepted game of the pair.

## Decisions

- **Order by `rowid`, not by time and id.** Message ids are random and two messages can share a
  millisecond, so ordering by `(created_at, id)` would skip a message in unread counts and in
  `after=` cursors. Use the table's `rowid`, which grows with every insert.
- **One conversation per pair**, stored `user_a < user_b` with a `UNIQUE` constraint. It is created
  with the first message, never when a chat is opened. A chat with someone who has no conversation
  yet is addressed by their id.
- **The game exists only after acceptance.** A pending, declined or cancelled invite is a row in
  `game_invites` and nothing else, so no game list or calendar can show it. An accepted game is a
  normal `games` row that `game_invites.game_id` points at. That row is hidden from the open games
  and from other players, and `joinGame`, `leaveGame` and `deleteGame` answer `notFound` for it.
  Cancelling a confirmed game is not built yet.
- **Answering an invite goes over the socket** (`invite:respond`), like sending, because Route
  Handlers cannot reach the socket process. Both players receive `invite:updated` and the reply
  with `message:new`. An answer repeated changes nothing; answering a closed invite, or accepting
  after the start time, answers `conflict`. Only the invitee accepts or declines and only the
  proposer cancels (`forbidden` otherwise). A stranger or another city gets `notFound`.
- **`expired` is never stored.** A pending invite whose time has passed is read as expired.
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

## Errors

The general rules are in `backend.md` and `frontend.md` ("Errors"). Specific to chat:

- A send that fails keeps the text, and Retry reuses the `clientMessageId`.
- Sends and invite answers retry on their own (3 attempts, 1 s then 2 s, or the `retryAfterSeconds`
  of a rate limit), registered in `registerConversationMutations`, which `QueryProvider` calls. The
  thread says "Trying again…" meanwhile.
- A refused handshake sends the player to `/sign-in?returnTo=` (`RealtimeProvider`). Other
  connection errors are left to the socket to retry.
- Not built yet: a `Toast` for a failed mark-as-read, and a global redirect for a REST call
  answered 401 (a blanket one would loop, because sign-in answers a wrong password with
  `unauthenticated`).

## Rules

- Never return an email or coordinates in a conversation. A partner is `id`, `name`, `initials`
  and a subtitle.
- A change to the messages tables goes in a new migration. Test it from the previous schema.
- Server tests cover the failure branches: a stranger, another city, a repeated send, a bad cursor.
- UI tests cover each failure kind of a send, the retries (works on the second try, gives up after
  three, no retry for a missing item), a failed first load, a failed refresh, and pressing Send
  twice.
- The socket integration test (`server/realtime/realtimeServer.test.ts`) must pass before merging
  a change to events or presence.
- UI tests use `TestRealtime` and `createTestSocket` from `@/shared/testing`, which answer sends
  without a server.
- Never show made-up players. See "No invented people" in `docs/roadmap.md`.
