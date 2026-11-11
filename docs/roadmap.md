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

- The court and time choices in the chat invite (`features/inbox/model/inviteOptions.ts`) are fixed lists, not real courts. An invite is a message that carries a court and a time, and the latest one is the conversation's plan. It does not create a game or a booking.
- Change password, delete account, notification settings.
- The level quiz result only changes the filter locally. It does not save to the profile.
- `online` on a player listing is always `false`; the online dot comes from the socket (`presenceQueries`).
- `freeTonight` and `wantsDoublesPartner` are stored flags until availability exists.
- Ranking, tournaments news, court offers, payments and bookings do not exist yet.

## No invented people

Never put made-up players in the UI. The "who's free" faces, "Next games" and the home dashboard were
removed for that reason. Bring them back only from real data: an availability model for who is free,
and bookings for next games. Demo players exist only in development, as real `users` rows
(`server/db/demoData.ts`).
