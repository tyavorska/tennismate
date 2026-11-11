# TennisMate

TennisMate is a web app for tennis players to find playing partners and organize matches.

Built with [Next.js](https://nextjs.org) (App Router), React 19, and TypeScript. The codebase follows
[Feature-Sliced Design](https://feature-sliced.design). See [CLAUDE.md](./CLAUDE.md) for the full set
of conventions.

## Prerequisites

- Node.js 24 (LTS). With `nvm`, run `nvm use` to pick up the version in `.nvmrc`.
- npm (bundled with Node)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file (the defaults work for local development)
cp .env.example .env.local

# 3. Start the web app
npm run dev

# 4. In a second terminal, start the realtime server (chat and online status)
npm run realtime
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The web app runs without the
realtime server, but messaging and online status stay offline until it is running.

The SQLite database is created at `DATABASE_PATH` on first use.

### Loading cities and courts

Players, games and courts are scoped to a city, so the database needs cities before sign-up works.

```bash
# Add the European cities from a GeoNames dump
curl -O https://download.geonames.org/export/dump/cities15000.zip && unzip cities15000.zip
npm run import:cities -- cities15000.txt

# Bring in the courts of one city from OpenStreetMap (one request to the public Overpass server)
npm run import:courts -- krakow
```

`import:courts` takes a city slug. `--from-file <answer.json>` reuses a saved Overpass answer, and
`--refresh` also updates OpenStreetMap courts and hides those that are gone.

## Scripts

| Script                  | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the development server                         |
| `npm run realtime`      | Start the Socket.IO server (chat, online status)     |
| `npm run realtime:dev`  | Same, and restart on file changes                    |
| `npm run build`         | Create a production build                            |
| `npm run start`         | Serve the production build                           |
| `npm run lint`          | Run ESLint and Stylelint                             |
| `npm run typecheck`     | Generate route types and run the TypeScript compiler |
| `npm test`              | Run the tests once                                   |
| `npm run test:watch`    | Run the tests in watch mode                          |
| `npm run format`        | Format the whole repo with Prettier                  |
| `npm run format:check`  | Check formatting without writing (for CI)            |
| `npm run import:cities` | Import cities from a GeoNames dump                   |
| `npm run import:courts` | Import one city's courts from OpenStreetMap          |
| `npm run eval:review`   | Run the `let-code-review` skill evals                |

## Project structure

```
src/
├── app/        # Next.js App Router: routes, layouts, global styles
├── views/      # Route-level page compositions (the FSD "pages" layer)
├── widgets/    # Self-contained UI blocks composed from features and entities
├── features/   # User interactions and business actions
├── entities/   # Business objects: types, queries, base UI
├── shared/     # Reusable code with no business knowledge
└── server/     # Backend-only code, never imported by client code
```
