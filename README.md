# Bike Connect

A full-stack web platform that unifies the three activities of the modern
cyclist: managing bikes, journaling their maintenance, and sharing the
experience through long-form writing. One identity, one domain model: rides,
the bikes that took them, and the stories written about them live in the same
place.

## Features

- **Blog** — rich-text posts (Tiptap), threaded comments with one reply level,
  likes, bookmarks, tags, and full-text search
- **Garage** — personal bike registry with per-bike components; any bike can be
  exposed as a read-only public page and discovered on the explore page
- **Maintenance** — per-component service logs; reminders are *computed* from
  the logs, mileage, and per-category thresholds rather than stored
- **Rides** — distance / duration / date logging that feeds per-bike mileage
- **Social** — follow authors and read a personal feed (keyset-paginated)
- **Auth** — Google OAuth 2.0 via Passport; JWT in an `httpOnly` cookie

## Stack

| Tier | Technology |
|------|------------|
| Client | React 19, Vite 6, react-router 7, Tiptap v3 |
| Server | Node 22, Express 5, TypeScript (strict, ESM), Passport, Multer |
| Data | PostgreSQL 16, Kysely (type-safe query builder), JSONB + tsvector |
| Shared | Zod schemas and constants consumed by both client and server |
| Testing | Vitest, Playwright (+ @axe-core/playwright), testcontainers |

## Repository layout

npm workspaces monorepo:

```
client/   React SPA (feature-based folders under src/features/)
server/   Express API (modules under src/modules/, repository → service → controller → routes)
shared/   Zod schemas, enums, constants — the single source of truth
```

## Getting started

Requirements: Node 22 (`.nvmrc`), Docker (for PostgreSQL).

```bash
npm install
cp .env.example .env          # fill in Google OAuth credentials
docker compose up -d          # PostgreSQL 16
npm run db:migrate            # apply migrations
npm run dev                   # client + server concurrently
```

## Scripts

```bash
npm run dev             # client and server in watch mode
npm run build           # shared → server → client
npm run lint            # ESLint across workspaces
npm run typecheck       # tsc across workspaces
npm test                # unit/integration tests (all workspaces)
npm run test:coverage   # coverage with threshold check
npm run db:migrate      # apply database migrations
```

Integration tests boot an ephemeral PostgreSQL 16 container through
testcontainers; end-to-end tests run under Playwright from `client/`.

## License

[MIT](LICENSE)
