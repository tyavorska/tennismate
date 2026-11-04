---
paths:
  - 'src/server/imports/**'
  - 'scripts/**'
---

# City and court imports

Cities come from GeoNames and a city's first courts come from OpenStreetMap, both **imported once,
never read live and never synced on a schedule**. Clubs will register and edit their own courts, so
nothing may overwrite a court automatically.

- `npm run import:cities -- cities15000.txt` adds the European cities of a GeoNames dump
  (`europe.ts` lists the countries). It matches by `geonames_id`, keeps slugs, and takes the time
  zone from the dump.
- `npm run import:courts -- <slug>` makes **one** request to the public Overpass server for one
  city and **only adds places that are new**. It changes nothing already in the database. Run it
  for a city someone asked for, not for all cities. It never runs from a user's request. Tests use
  a saved answer (`imports/fixtures`), never the network.
- `--refresh` is the only way an import changes existing courts: it updates `osm` courts found
  again and hides `osm` courts that are gone. Use it on purpose, never with a partial answer
  (`--from-file` with a trimmed file hides everything else). It never touches a court whose
  `source` is not `osm`.
- Courts within 100 m become one place (`venues.ts`). Each place gets the nearest suburb point as
  its district, or the city name when there are none. A place with no name is called
  "Tennis courts, <district>", numbered when needed. A court's name is chosen once and kept.
- Courts are hidden (`removed_at`), never deleted, because games point at them. An empty answer
  changes nothing. Courts are matched through `court_osm_elements`, keyed per city, because the
  circles of neighbouring cities overlap and each city keeps its own copy of a shared court.
- OpenStreetMap data is ODbL and GeoNames data is CC BY 4.0. The app footer credits both, so
  keep it. A copied court stays under ODbL, so keep `source`: it separates OSM courts from the
  ones clubs entered, in case the data is ever shared.
- The scripts run with `tsx --conditions=react-server`, so `server-only` and the `@/` alias work.
  Import only from `@/server/imports` and `@/server/db`. `shared/lib` must stay free of
  React and Next imports for the same reason, so hooks live in `shared/hooks`.
