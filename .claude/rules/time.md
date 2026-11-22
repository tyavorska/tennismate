---
paths:
  - 'src/**'
  - 'scripts/**'
  - 'Dockerfile'
  - 'docker-compose.yml'
  - 'vitest.config.mts'
---

# Time

Applies to the server and the client.

- **Every environment runs in UTC.** `TZ=UTC` is set in the Dockerfile and in `vitest.config.mts`.
  Set it in any new environment.
- **Instants are stored in UTC** as ISO strings ending in `Z` (`starts_at`, `created_at`), written
  with `toISOString()`. SQLite has no timestamp type, so the columns are `TEXT`. In PostgreSQL they
  become `TIMESTAMPTZ`. A plain date is stored as `YYYY-MM-DD`.
- **Instants cross the API and the socket as full ISO strings** (`2026-11-25T17:00:00.000Z`) and
  become local time just before display. The zone is the **city's** (`viewer.city.timezone`, from
  `cities.timezone`), on the server and in the browser. Hard-code a zone only in seed and test data.
  Game, calendar and invite payloads predate this: they carry a `date`, `time` and `day` that the
  server made in the city's zone. A new field carries the instant.
- **All date and time work goes through `@/shared/lib`** (`isoDate.ts`, `zonedTime.ts`), which is
  built on Temporal (`temporal-polyfill`). When a helper is missing, add it there and name it as
  Temporal does.
  - Validate with `isoDateSchema`, `calendarDateSchema` (unbranded) and `clockTimeSchema`. They
    reject `2026-02-31` and `99:99`, which `Date` would roll over to another day.
  - Date math: `addDays`, `daysBetween`, `weekdayIndex`, `nextWeekday`, `toPlainDate` (its `month`
    starts at 1).
  - Zone conversion: `zonedToUtc`, `toWallClock`, `todayIn`, `endOfDayUtc`. They follow daylight
    saving.
- **Outside those two files a `Date` only holds an instant**: `new Date()` for now, `new Date(iso)`
  for a stored value, `toISOString()`, and comparing `getTime()`.
- **Count in the unit you mean.** A day is 23 or 25 hours when the clocks change, so count days as
  calendar days in the city: `daysBetween(todayIn(joined, zone), todayIn(now, zone))`. Milliseconds
  are for fixed lengths only, such as a session lifetime or a rate-limit window.
- Functions that depend on the time take `now` as a parameter. Test the day the clocks change and a
  leap day.
