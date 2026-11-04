# Roadmap and sample data

Read this before building any of the items below.

## Planned, not built yet

- **Clubs register and own their courts.** A club that is not in the database creates a court
  (`source = 'manual'`), and that alone opens a city, so a city does not need an import to open. A
  club that is already there (imported) **claims** the existing court instead of making a
  duplicate: search nearby by name and place, then verify (admin approval or email/phone). A
  claimed court changes `source` to `claimed`, so no import touches it again. Hours, prices,
  contacts and booking will live in a `clubs` table, which OSM cannot supply (Kraków: no
  websites, no opening hours).
- **Changing city** (profile settings) needs a confirm step that shows the impact first
  (`GET /api/me/city/impact`). `PUT /api/me/city` with `confirm: true` then, in one transaction,
  changes the city, **cancels** the games the player hosts, removes them from the games they joined,
  and writes `notifications` rows for everyone affected. The server answers `409 conflict` with the
  same summary when there are affected games and `confirm` is missing. Games are cancelled
  (`cancelled_at`), never deleted. Notifications are written in the same transaction and delivered
  to the messenger afterwards (outbox), so none are lost.
- Saved players in another city stay saved but are hidden.
- Open question: a limit on how often the city can change.
- Sign-up lists only open cities in a plain select. For the full European list it needs a search
  box (`GET /api/cities?q=`). Picking a city with no courts should save the email in
  `city_requests` and say we are not there yet, without creating an account.
- GeoNames names are English (`Warsaw`, not `Warszawa`). Decide how to show local names.
- Remove the hard-coded "Kraków" from the UI: the Players page heading, "All of Kraków" and the
  "New in Kraków" list in the filters, the level quiz text, and the calendar lead.

## What is still sample data

Replace these with the same pattern (table, `server/` module, Route Handler, query key) when they
are built. Until then they stay clearly marked as samples and must not be mixed into real data.

- Inbox and chat (`entities/conversation`, invite courts and slots) until the Socket.IO work.
- "Next games" (`entities/game`) and the dashboard cards. They disagree with the real calendar.
- "Who's free" faces on the calendar (needs an availability model).
- Change password, delete account, notification settings.
- The level quiz result only changes the filter locally. It does not save to the profile.
- `online` is always `false`. `freeTonight` and `wantsDoublesPartner` are stored flags until
  availability exists.
- Ranking, tournaments news, court offers, payments and bookings do not exist yet.
