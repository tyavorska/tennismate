---
paths:
  - 'src/server/db/**'
---

# Migrations

- **The schema changes only through migrations** in `server/db/migrations/`, numbered `001_…`,
  `002_…` and listed in `migrations/index.ts`. `migrate` runs on every start, applies what is
  missing in order, and stores the version in `PRAGMA user_version`.
- **Never edit a migration that has been merged.** Add the next one. `001_baseline` is the schema
  from before migrations existed. Do not add to it.
- Each migration runs in its own transaction with foreign keys off, then `foreign_key_check` must
  be empty, or the whole migration is undone. To change a table, rebuild it: create the new table,
  copy the rows, drop the old one, rename. Keep ids when other tables point at them.
- Test every migration with `migrate.test.ts`: from an empty database, and from the previous schema
  with rows in it. Check that rows and links survive. Before running one on a real database, copy
  the file.
