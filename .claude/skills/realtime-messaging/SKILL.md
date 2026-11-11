---
name: realtime-messaging
description: Socket.IO design for TennisMate chat. Use when building or changing messaging, conversations, inbox, chat, unread counts, read receipts, presence (online), the realtime server (npm run realtime) or the socket client provider.
---

# Realtime messaging: Socket.IO

Messaging uses Socket.IO. Route Handlers cannot hold a WebSocket open, so the design is:

- **Separate Node process.** Run the Socket.IO server as its own process (`npm run realtime`) that
  imports the same `server/` modules as the web app. It cannot run on a serverless host. Deploy it
  where long-lived connections work.
- **REST for history, sockets for live events.** Conversations, message history (cursor
  pagination), unread counts and mark-as-read are Route Handlers. The socket only delivers new
  messages, read receipts and presence.
- **Persist first, then emit.** A message is written to the database, then emitted. The sender
  gets an acknowledgement. The client sends a `clientMessageId` that is unique per conversation, so
  a resend after a dropped connection never creates a duplicate.
- **Authenticate the handshake** with the same session cookie. Look the token hash up with the
  `server/auth` code in an `io.use` middleware, and refuse the connection without a valid session.
  Check on every event that the user is a member of the conversation.
- **Errors and retries** follow the "Errors" rules in `.claude/rules/backend.md` and `frontend.md`.
- **Validate every event payload with Zod.** Event schemas live in `entities/conversation/model`,
  next to the message and conversation schemas, so server and client share them.
- **Rooms.** One room per user (`user:<id>`), so every open tab of the recipient gets the message.
  Do not rely on one socket per user.
- **Unread** is `last_read_message_id` per conversation member. Do not keep a boolean.
- **Reconnect.** After a reconnect the client fetches what it missed from
  `GET /api/conversations/:id/messages?after=<id>`. Never rely only on the socket buffer.
- **Client.** One socket per tab, created in a provider in `app/providers`. Incoming events update
  the TanStack Query cache with `setQueryData`. They do not create a second copy of the data in
  state. A failed send keeps the text in the input and shows the error.
- **More than one instance** needs the Redis adapter (`@socket.io/redis-adapter`) so a message
  reaches a recipient connected to another instance. Presence (`online`) is then kept in Redis with
  a short TTL.
- **Conversations are unique per pair of users** (`user_a < user_b` with a `UNIQUE` constraint).
  Create one on the first message, not when a chat is opened.
