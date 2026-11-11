# Rules and context: inbox, messaging and game invites compared

The same area of the app (the chat) was built three times with different amounts of project
context. This note compares them, so we know what the rules and skills bought us and where they
were not enough.

Sources: `git log`, `git show --stat` and `git blame` on the three commits. Token use is not
measurable from the repo, so rule context is estimated from file sizes (bytes / 4).

## The three stages

| Stage | Commit    | Date       | What was built                                              |
| ----- | --------- | ---------- | ----------------------------------------------------------- |
| A     | `567aec1` | 2 Nov 2026 | Inbox and chat UI over sample data, kept in `useState`      |
| B     | `cac8b1a` | 11 Nov     | Instant messaging and online status with Socket.IO          |
| C     | `55cc723` | 11 Nov     | Game invites that both players confirm into their calendars |

Stage A is the "no rules" case, stage C the "with rules" case, and B sits between them.

## What context each stage had

| Stage | Context available                                                                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | One `CLAUDE.md` of about 270 lines: FSD, TanStack Query, Zod, accessibility, naming, TypeScript style. No backend, city, time or messaging rules. No realtime skill.                                                                      |
| B     | `CLAUDE.md`, 8 path-scoped rule files (backend, migrations, architecture, frontend, testing, accessibility, imports, styling), the `realtime-messaging` and `error-handling` skills. `messaging.md` was written at the end of this stage. |
| C     | Everything in B, plus `messaging.md` and the roadmap. The commit updates the rule.                                                                                                                                                        |

Rough size of the rule and skill text loaded while working on B: about 37 KB, or 9 to 10 thousand
tokens (`backend.md` is the largest part). `messaging.md` adds about 5.7 KB, or 1.4 thousand
tokens, for C. Run `/context` in a session for real numbers.

## Results

| Measure                        | A                                                                                                           | B                                                                          | C                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------- |
| Backend                        | None                                                                                                        | Migration, `server/conversations`, REST routes, separate Socket.IO process | Migration, invite lifecycle over the socket   |
| Where data lives               | Sample file copied into `useState`                                                                          | SQLite, read through the TanStack Query cache                              | Same, plus a `game_invites` table             |
| Size                           | About 1,058 lines in the inbox and conversation folders                                                     | +3,056 / -1,600 lines, 94 files                                            | +1,628 / -321 lines, 32 files                 |
| Test lines vs production lines | Page-level tests only (not separable from the other pages in that commit)                                   | 1,140 vs 1,561                                                             | 638 vs 878                                    |
| Failure-branch tests           | No                                                                                                          | Stranger, another city, repeated send, bad cursor, rate limit              | Stranger, another city, closed invite, repeat |
| Real socket integration test   | No                                                                                                          | Yes, two clients on a random port                                          | Extended                                      |
| How much of it survived later  | Data layer fully replaced (14 lines left in `entities/conversation`); about two thirds of the UI lines kept | About 70% of production lines still present after C                        | Built on B and extended it                    |

### What A got wrong, that the rules now prevent

- Times were formatted in the browser's time zone, not the city's.
- Unread was a boolean, and message ids were `m${count + 1}`.
- A thread started from a player was added to state but never saved.
- The draft was cleared before the send result was known.
- There was no server, so nothing could be shared between two players.

### What B and C reused from the rules

- City isolation in SQL: another city answers `notFound`.
- Zod at every boundary, including socket payloads.
- One query-key factory per entity, and events written into the cache with `setQueryData`.
- A migration test from the previous schema.
- A derived value is never stored: `expired` is read from the time, not saved.
- Route Handlers cannot reach the socket process, so answering an invite goes over the socket.
- A repeated action changes nothing (idempotent sends and answers).

## Where the rules were not enough

Found while building B, before `messaging.md` existed:

- Ordering by `(created_at, id)` with random ids skipped a message sent in the same millisecond.
  The tests caught it. The fix was to order by `rowid`.
- Running the realtime process with `--conditions=react-server` broke TanStack Query. The
  end-to-end run caught it. The fix was `scripts/tsconfig.realtime.json`.
- 15 lint errors for `unknown` and `as` on the first pass. The rule was clear, and ESLint enforced it.
- A test mock was bypassed because a shared test helper loaded `next/navigation` first.

These are now written down in `.claude/rules/messaging.md`, which is how stage C avoided them.

## The error-handling skill was not used in stage B

The `error-handling` skill (since removed) said to load it whenever code calls an API or adds a Route Handler. In
stage B it was not loaded: only the first part of `SKILL.md` was read, and its three references
were skipped. The error handling was built from the category table and from the patterns already
in the repo. An audit against the skill afterwards found these gaps:

- The sidebar inbox showed "No messages yet." when the list failed to load (an empty state in place
  of an error).
- A refused socket handshake (expired session) was ignored, so a later send failed with a
  misleading "We couldn't reach the server".
- Errors answered on the socket had no request id, and the log line had no request id, status or
  time.
- No notice when a refresh failed with data on screen.
- Error copy written in the JSX instead of coming from `errorPolicy`.
- Tests covered one failure kind. The missing ones were timeout, malformed answer, rate limit,
  failed first load, failed refresh and pressing Send twice.

What was already right: every send carries a `clientMessageId` (the idempotency key the skill asks
for), a failed send keeps its text, submit is disabled while pending, expected failures are domain
errors with the shared `Problem` shape, and nothing internal leaks to the client.

These were fixed afterwards (`ErrorState` and `Banner` added to `shared/ui`, handshake handling,
request ids, 24 new tests). A second pass added automatic retry for sends and invite answers, and
waiting out `rateLimited` with the seconds the server sends. Still open: a `Toast` for a failed
mark-as-read, and a global handler for expired sessions in `QueryProvider`.
That last one needs care: sign-in answers a wrong password with `unauthenticated`, so a blanket
redirect would loop.

Afterwards the skill's references, which described a design the code never followed, were deleted.
The hard rules moved into `backend.md` and `frontend.md`, which load by path, as the Claude Code
docs advise for "always do X" rules. The skill came back as a short review procedure (checklist and
test matrix), because a procedure is what the docs say a skill is for.

The lesson for the comparison: a rule or skill only helps if it is loaded. The skills that match
the work should be named in the area rule so they are not skipped.

## Caveats

- C also had B's finished code to build on, not only the rules.
- The tasks and prompts were different, so the sizes are not like for like.
- B's problems were found by its own checks (tests, lint, an end-to-end run), not by a review.
  `let-code-review` has not been run on any of the three stages.
- The C session was not observed. Its row is read from the commit.

## What to keep doing

1. Write the area rule at the end of a feature, with the decisions that were not obvious.
2. Update the rule in the same commit that changes the behavior (C did).
3. Put the hard rules in path-scoped rule files, which load by themselves. Keep a skill for the
   review procedure only.
4. Keep the rule next to the skill that holds the design: the skill says how, the rule says what
   is built and why.
5. Keep tests for the failure branches. They found the ordering flaw that the rules did not.

## Open questions

- Run `let-code-review` on A and B and compare the findings.
- Measure real context use per session with `/context` and record it here.
- Compare offer-game and join-game (built with the early rules) if a fourth data point is wanted.
