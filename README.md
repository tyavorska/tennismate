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

# 2. Create your local environment file and fill in the values
cp .env.example .env.local

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Script                 | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the development server                         |
| `npm run build`        | Create a production build                            |
| `npm run start`        | Serve the production build                           |
| `npm run lint`         | Run ESLint                                           |
| `npm run typecheck`    | Generate route types and run the TypeScript compiler |
| `npm run format`       | Format the whole repo with Prettier                  |
| `npm run format:check` | Check formatting without writing (for CI)            |

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
