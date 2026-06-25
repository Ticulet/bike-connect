# Onboarding — Bike Connect

Welcome! This guide takes you from "just cloned the repo" to "I know where things
live and how a change flows through the system." It is the companion to the
[README](./README.md) (which covers the quick start and the feature/stack
summary). Read the README first for the 5‑minute overview, then come back here
for the deep dive.

**Audience:** a developer making their first change to this codebase.

---

## Table of contents

1. [The product in one picture](#1-the-product-in-one-picture)
2. [The monorepo](#2-the-monorepo)
3. [Local development setup](#3-local-development-setup)
4. [How the backend is organized](#4-how-the-backend-is-organized)
5. [The database layer](#5-the-database-layer)
6. [The API surface](#6-the-api-surface)
7. [How the frontend is organized](#7-how-the-frontend-is-organized)
8. [The shared package](#8-the-shared-package)
9. [Conventions & standards](#9-conventions--standards)
10. [Authentication deep dive](#10-authentication-deep-dive)
11. [Images & uploads](#11-images--uploads)
12. [Testing strategy](#12-testing-strategy)
13. [Common recipes](#13-common-recipes)
14. [Gotchas that will bite you](#14-gotchas-that-will-bite-you)
15. [Where to find things](#15-where-to-find-things)

---

## 1. The product in one picture

Bike Connect unifies the three activities of a cyclist under **one identity and
one domain model**: the bikes you own, the rides they carry, the maintenance you
do on them, and the stories you write about all of it.

```mermaid
erDiagram
  users ||--o{ posts : authors
  users ||--o{ bikes : owns
  users ||--o{ comments : writes
  users ||--o{ likes : gives
  users ||--o{ bookmarks : saves
  users ||--o{ follows : "follower / following"
  posts ||--o{ comments : has
  posts ||--o{ likes : has
  posts ||--o{ bookmarks : "saved in"
  posts }o--o{ tags : "post_tags"
  bikes ||--o{ bike_components : "built from"
  bikes ||--o{ rides : logs
  bikes ||--o{ maintenance_logs : "serviced by"
  bike_components ||--o{ maintenance_logs : "serviced"
```

There are **12 tables**: `users`, `posts`, `tags`, `post_tags`, `comments`,
`likes`, `bookmarks`, `follows`, `bikes`, `bike_components`, `maintenance_logs`,
`rides`.

> **Reminders are not a table.** Maintenance reminders are *computed* on the fly
> from maintenance logs, ride mileage, and per‑category thresholds. If you go
> looking for a `reminders` table you won't find one — see
> `server/src/modules/reminders/`.

---

## 2. The monorepo

npm **workspaces** with three packages. There is no Lerna/Nx/Turbo — just plain
npm and TypeScript project references.

```
bike-connect/
├── client/   React 19 SPA (Vite). Feature-based folders under src/features/.
├── server/   Express 5 API. Layered modules under src/modules/.
├── shared/   Zod schemas, inferred types, and constants — the SINGLE SOURCE OF TRUTH.
├── scripts/  check-coverage.mjs (coverage gate), db-backup.sh
├── docs/     Project docs (incl. the thesis — leave alone unless asked)
└── docker-compose.yml   PostgreSQL 16 for local dev
```

Three rules that follow from this layout — internalize these early:

1. **`shared` is the contract.** Request/response shapes, enums, and validation
   limits live in `shared/src` and are imported by *both* client and server as
   `@bike-connect/shared`. Change a rule once, both sides get it.

2. **Build order matters: `shared → server → client`.** `shared` compiles to
   `shared/dist`, which the other two import. The root `npm run build` already
   does this in order. **If you change a shared schema, rebuild shared** (or run
   `npm run dev`, which keeps it fresh) or the server/client will typecheck
   against the *old* compiled types.

3. **ESM everywhere, with `.js` import extensions.** This is a pure‑ESM project
   (`"type": "module"`). Relative imports must end in `.js` even though the
   source file is `.ts`:
   ```ts
   import { bikesService } from './bikes.service.js';   // ✅ (file is bikes.service.ts)
   import { bikesService } from './bikes.service';      // ❌ runtime/resolution error
   ```

---

## 3. Local development setup

**Prerequisites:** Node 22 (see `.nvmrc`), Docker (for PostgreSQL).

```bash
nvm use                       # Node 22
npm install                   # installs all workspaces
cp .env.example .env          # then edit (see env vars below)
docker compose up -d          # PostgreSQL 16 on localhost:5432
npm run db:migrate            # apply migrations 001–003
npm run db:seed               # optional: demo data
npm run dev                   # client (:5173) + server (:3000) together
```

- Client dev server: **http://localhost:5173** (Vite, proxies `/api` to the server).
- API: **http://localhost:3000** — health check at `GET /api/health`.

### Environment variables

All env vars are declared and defaulted in **`server/src/config/env.ts`** (parsed
with Zod — that file is the authoritative list). The server loads a single `.env`
from the repo root so one file serves every workspace.

| Variable | Default (dev) | Notes |
|----------|---------------|-------|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3000` | API port |
| `DATABASE_URL` | `postgresql://bike_connect:bike_connect_dev@localhost:5432/bike_connect` | matches `docker-compose.yml` |
| `GOOGLE_CLIENT_ID` | placeholder | **required in production** |
| `GOOGLE_CLIENT_SECRET` | placeholder | **required in production** |
| `JWT_SECRET` | dev default (≥32 chars) | **required in production**, min 32 chars |
| `JWT_EXPIRY` | `7d` | duration string (`7d`, `1h`, …) |
| `CORS_ORIGIN` | `http://localhost:5173` | the client origin (CORS is credentialed) |
| `IMAGE_STORAGE` | `local` | `local` \| `cloudinary` |
| `CLOUDINARY_URL` | — | required only when `IMAGE_STORAGE=cloudinary` |
| `LOCAL_UPLOAD_DIR` | `./uploads` | served at `/uploads` when storage is local |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 min |
| `RATE_LIMIT_MAX` | `1000` | requests per window per IP, scoped to `/api` |

> **You can run everything without real Google credentials.** In non‑production
> the OAuth vars and `JWT_SECRET` have dev defaults, so the server boots. But
> *actual* Google sign‑in needs real credentials: create an OAuth client in
> Google Cloud, set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, and register the
> callback URL. Downloaded `client_secret_*.json` files are gitignored.

---

## 4. How the backend is organized

Express 5 + TypeScript (strict ESM) + Kysely. The app is assembled in
**`server/src/app.ts`** and started in **`server/src/index.ts`**.

### Middleware chain (order matters)

From `app.ts`, every request passes through:

```
helmet → cors(credentials) → rateLimit (/api only) → cookieParser
  → passport.initialize() → express.json({ limit: '100kb' })
  → GET /api/health → /api router → /uploads static (if local)
  → 404 (ApiError.notFound) → errorHandler
```

Notes worth remembering:
- The rate limiter is scoped to `/api` so static `/uploads` images don't burn the
  request budget.
- Auth is **stateless** (`session: false`) — a JWT in an `httpOnly` cookie, not a
  server session.
- The global JSON limit is a conservative `100kb`; routes that need more override
  it per‑route.

### Layered modules

Each domain lives in `server/src/modules/<name>/` and follows the same four‑layer
shape:

```
<name>.routes.ts        HTTP routes + which middleware guards them
<name>.controller.ts    reads req, calls the service, writes res (thin)
<name>.service.ts       business logic, authorization, orchestration
<name>.repository.ts    Kysely queries — the ONLY layer that touches the DB
```

Sub‑resources live inside their parent module's folder and mount as nested
routers. For example `components` lives in `modules/bikes/components.*.ts` and is
mounted at `/bikes/:id/components`.

A real route file (`modules/bikes/bikes.routes.ts`) shows the wiring:

```ts
bikesRouter.get('/',          requireAuth, bikesController.listMine);
bikesRouter.get('/explore',   optionalAuth, validate(exploreBikesQuerySchema, 'query'), bikesController.listExplore);
bikesRouter.get('/:id',       optionalAuth, bikesController.getById);
bikesRouter.post('/',         requireAuth, validate(createBikeSchema, 'body'), bikesController.create);
bikesRouter.patch('/:id',     requireAuth, validate(updateBikeSchema, 'body'), bikesController.update);
bikesRouter.delete('/:id',    requireAuth, bikesController.remove);

bikesRouter.use('/:id/components',  componentsRouter);   // nested sub-routers
bikesRouter.use('/:id/maintenance', maintenanceRouter);
bikesRouter.use('/:id/rides',       ridesRouter);
bikesRouter.use('/:id/reminders',   remindersRouter);
```

### Shared backend building blocks

- **`middleware/auth.ts`** — `requireAuth` (401 if no/invalid JWT cookie, sets
  `req.user`) and `optionalAuth` (sets `req.user` if a valid cookie is present,
  otherwise continues anonymously — used for routes that show more to logged‑in
  users).
- **`middleware/validate.ts`** — `validate(schema, 'body' | 'query' | 'params')`.
  Runs a Zod `safeParse`; on failure calls `next(ApiError.badRequest(...))` with
  the flattened error; on success replaces the request part with the parsed,
  typed data. (Express 5 makes `req.query` read‑only, hence the `defineProperty`.)
- **`middleware/error-handler.ts`** + **`lib/api-error.ts`** — throw/`next()` an
  `ApiError` anywhere; the central handler turns it into a JSON body
  `{ status, code, message, details }`. The client mirrors this shape (see §7).
- **`middleware/rate-limit.ts`** — the `globalLimiter`.
- **`lib/`** — `pagination.ts` (keyset/cursor helpers), `slug.ts` (slug
  generation), `ownership.ts` (authorization checks), `month-range.ts` (the
  "this month" window for ride stats).

### Request lifecycle (trace: create a bike)

```mermaid
sequenceDiagram
  participant C as Client (api-client)
  participant MW as Middleware
  participant R as bikesRouter
  participant Ctl as bikes.controller
  participant Svc as bikes.service
  participant Repo as bikes.repository
  participant DB as PostgreSQL
  C->>MW: POST /api/bikes  (JWT cookie + JSON body)
  MW->>R: helmet, cors, rateLimit, cookieParser, json
  R->>R: requireAuth → req.user
  R->>R: validate(createBikeSchema, 'body')
  R->>Ctl: bikesController.create
  Ctl->>Svc: createBike(userId, data)
  Svc->>Repo: create({ user_id, ... })
  Repo->>DB: INSERT ... RETURNING *
  DB-->>Repo: row
  Repo-->>Ctl: Bike
  Ctl-->>C: 201 JSON
  Note over C,MW: Any thrown ApiError → errorHandler → { status, code, message }
```

---

## 5. The database layer

- **Query builder:** [Kysely](https://kysely.dev) — typed SQL, no ORM. The typed
  client is created in `server/src/db/index.ts` (a `pg` `Pool`, max 10
  connections). The DB schema is described in TypeScript in
  `server/src/db/types.ts` (the `Database` interface Kysely is generic over).
- **Repositories are the only place that import `db`.** Services and controllers
  never write SQL.

### Migrations

Plain Kysely migrations in `server/src/db/migrations/`, run by
`server/src/db/migrate.ts`:

```
001_initial_schema.ts        core tables
002_stretch_features.ts      social + extras
003_performance_indexes.ts   indexes (incl. full-text search)
```

```bash
npm run db:migrate            # apply all pending
npm run db:migrate:create     # scaffold a new timestamped/numbered migration
npm run db:seed               # populate demo data (server/src/db/seed.ts)
```

### Patterns you'll meet

- **JSONB content.** Post bodies are stored as Tiptap/ProseMirror JSON in a JSONB
  column, not HTML.
- **Full‑text search.** Posts use a Postgres `tsvector` (see migration 003) behind
  `GET /api/posts/search`.
- **Keyset (cursor) pagination.** Lists like the feed page by an opaque cursor,
  not `OFFSET`. Use the helpers in `server/src/lib/pagination.ts`.
- **Optimistic locking on posts.** Post updates check `updated_at`. Postgres
  `timestamptz` has microsecond precision but `node-postgres` hands back a JS
  `Date` (millisecond) — the repository compares with
  `date_trunc('milliseconds', updated_at)` so a save isn't falsely rejected with
  a 409. Keep that in mind if you add optimistic locking elsewhere.

---

## 6. The API surface

Everything is under `/api`. Top‑level routers are mounted in
`server/src/routes/index.ts`; sub‑resources nest under their parent (the nested
routers use `mergeParams` to read `:postId` / `:id`).

| Mount | Module | Representative endpoints |
|-------|--------|--------------------------|
| `/api/auth` | auth | `GET /google` (start OAuth), `GET /me`, `POST /logout` |
| `/api/posts` | posts | `GET /`, `GET /me`, `GET /search`, `GET /:slug`, `GET /by-id/:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/api/posts/:postId/comments` | comments | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/api/posts/:postId/likes` | likes | `GET /`, `POST /toggle` |
| `/api/posts/:postId/bookmark` | bookmarks | `GET /`, `POST /toggle` |
| `/api/tags` | tags | `GET /`, `GET /:slug` |
| `/api/bikes` | bikes | `GET /`, `GET /explore`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/api/bikes/:id/components` | components | CRUD |
| `/api/bikes/:id/maintenance` | maintenance | `GET /`, `DELETE /:logId` (+ create/edit) |
| `/api/bikes/:id/rides` | rides | `GET /`, `GET /stats`, `POST /`, `PATCH /:rideId`, `DELETE /:rideId` |
| `/api/bikes/:id/reminders` | reminders | `GET /` (computed) |
| `/api/users` | users | `PATCH /me`, `GET /me/ride-stats`, `GET /:id`, `GET /:id/bikes`, `GET /:id/activity` |
| `/api/users/:id/follows` | follows | `GET /stats`, `POST /toggle`, `GET /followers`, `GET /following` |
| `/api/feed` | feed | `GET /` (keyset‑paginated) |
| `/api/images` | images | `POST /upload` |
| `/api/me/bookmarks` | bookmarks | `GET /`, `POST /toggle` |

Conventions:
- **`/me` and `/me/*`** denote "the current authenticated user."
- Routes that mutate or read private data are guarded by `requireAuth`; public
  read routes that show extra detail to a logged‑in viewer use `optionalAuth`.
- Errors are always the JSON shape `{ status, code, message, details? }`.

---

## 7. How the frontend is organized

React 19 + Vite 6 + react‑router 7, Tiptap v3 for rich text. No Redux — state is
React context + hooks + local component state.

### Feature folders

`client/src/features/<feature>/` mirrors the backend domains and typically holds:

```
api/         thin wrappers over the shared api-client (one file per resource)
components/  feature-specific components + their .css
pages/       route-level screens
hooks/       feature hooks (where present)
context/     feature context/providers (e.g. auth)
```

Features present: `auth`, `bikes`, `blog`, `feed`, `follows`, `maintenance`,
`reminders`, `rides`.

### Routing (`client/src/App.tsx`)

Three tiers, all inside a shared `<Layout>`:

- **Public:** `/`, `/posts`, `/posts/:slug`, `/users/:id`, `/bikes/:id`,
  `/explore/bikes`, `/login`.
- **Protected** (`<ProtectedRoute>`): `/feed`.
- **Protected + `<MeLayout>` shell:** the whole `/me/*` area — `/me`,
  `/me/posts*`, `/me/bikes*`, maintenance/ride create/edit, `/me/bookmarks`,
  `/me/settings`.
- Legacy URLs (`/dashboard`, `/my-posts`, …) `Navigate`‑redirect to their `/me/*`
  homes; `*` falls through to `NotFoundPage`.

### Talking to the API

**`client/src/lib/api-client.ts`** is the one fetch wrapper. It prefixes `/api`,
always sends `credentials: 'include'` (so the JWT cookie rides along), and on a
non‑OK response throws a typed **`ApiClientError`** carrying the server's
`{ status, code, details }`. Feature `api/` modules call it; components call the
feature `api/` modules — components never `fetch` directly.

### Other client building blocks

- **`features/auth`** — `AuthProvider` (context) + `useAuth()` hook expose
  `{ user, isAuthenticated, ... }`. `ProtectedRoute` redirects anonymous users to
  `/login`.
- **`components/ui/`** — the shared component kit (barrelled in `index.ts`):
  `Avatar`, `ConfirmDialog`, `Drawer`, `EmptyState`, `ImageUploader`,
  `PageHeader`, `Skeleton`, `Sparkline`, `StatStrip`, `Tabs`, and a toast system
  (`ToastProvider` / `useToast`). Reuse these before building new ones.
- **`components/layout/`** — `Header`, `Footer`, `Layout`, `MeLayout`,
  `MobileTabBar`, `BrandMark`, `ThemeToggle` + `useTheme`.
- **`lib/`** — `format.ts` (dates/numbers), `safe-url.ts` (`isSafeImageUrl`
  guards what can be rendered as an image `src`), `theme.ts` (light/dark logic).
- **`hooks/useMeStats.ts`** — aggregates the `/me` dashboard stats.

### Styling & theming

Plain CSS with design tokens — no CSS‑in‑JS, no Tailwind.

- `client/src/styles/tokens.css` — design tokens as CSS custom properties, with a
  `[data-theme="dark"]` block that overrides them for dark mode.
- `styles/` also holds `reset.css`, `typography.css`, `fonts.css`, `a11y.css`,
  `shell.css`; `styles/utilities/` holds reusable classes (`buttons.css`,
  `cards.css`, `forms.css`, `badges.css`, `section.css`).
- Component CSS sits next to the component, named in **BEM‑ish** style
  (`.bike-card__image`, `.post-form__cover-remove`).
- **Dark mode is flash‑free:** an inline script in `client/index.html` sets
  `data-theme` before first paint.

> Accessibility is a hard requirement (WCAG 2.1 AA): semantic HTML, labelled
> inputs, visible focus rings, and **verify colour contrast** when you touch
> colours. E2E runs axe‑core (see §12).

---

## 8. The shared package

`@bike-connect/shared` is the single source of truth for the client/server
contract. It exports a root barrel plus subpath exports for `./schemas/*` and
`./constants/*`.

- **`shared/src/schemas/`** — Zod schemas, one file per domain (`auth`, `bike`,
  `comment`, `common`, `component`, `maintenance`, `post`, `ride`, `search`,
  `tag`, `user`), each with a colocated `*.test.ts`. These power both server‑side
  `validate(...)` and client‑side typing.
- **`shared/src/types/index.ts`** — request/response types **inferred** from the
  schemas (`export type CreateBike = z.infer<typeof createBikeSchema>`), so types
  can never drift from validation.
- **`shared/src/constants/`** — `enums.ts` (`BIKE_TYPES`, `POST_CATEGORIES`,
  `POST_STATUSES`, `COMPONENT_CATEGORIES`, `MAINTENANCE_TYPES`, + their types) and
  `config.ts` (`PAGINATION`, `VALIDATION_LIMITS`, `ALLOWED_IMAGE_TYPES`,
  `IMAGE_MAX_SIZE_BYTES`).

---

## 9. Conventions & standards

TypeScript config is centralized in `tsconfig.base.json` and is **strict**:
`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
`isolatedModules`, ES2022 / ESNext modules, bundler resolution.

What that means day‑to‑day:
- **No `any`** (prefer `unknown` + narrowing). `as any` is tolerated only in test
  mocks.
- **Prefer inference**; annotate only when inference is insufficient.
- **`.js` extensions on all relative imports** (ESM). Use `import.meta.url`, never
  `__dirname`.
- **`async/await` with `try/catch`** for async work; no raw `.then()` chains.
- **Naming:** PascalCase for types/components, camelCase for values; descriptive
  names, no `I`‑prefixed interfaces, no cryptic abbreviations.
- Indexed access is `T | undefined` — handle the `undefined` (that's
  `noUncheckedIndexedAccess`).

Tests live in dedicated `test/` directories (and `client/e2e/`), **never** in
`__tests__`/`__mocks__` folders.

---

## 10. Authentication deep dive

```mermaid
sequenceDiagram
  participant U as User
  participant Client
  participant API
  participant Google
  U->>API: GET /api/auth/google
  API->>Google: OAuth redirect
  Google-->>API: callback (Passport google strategy)
  API->>API: find/create user, sign JWT
  API-->>Client: Set httpOnly cookie, redirect to app
  Client->>API: GET /api/auth/me (cookie)
  API-->>Client: current user → AuthProvider
```

- **Server:** `passport-google-oauth20` (config in
  `modules/auth/passport.config.ts`) handles the Google handshake; on success the
  user is upserted and a JWT is minted (`modules/auth/jwt.service.ts`) and set as
  an `httpOnly` cookie. `requireAuth`/`optionalAuth` read and verify that cookie
  on subsequent requests. `POST /api/auth/logout` clears it.
- **Client:** `AuthProvider` calls `GET /api/auth/me` on load to hydrate the
  session; `useAuth()` exposes it; `ProtectedRoute` gates `/feed` and `/me/*`.
- Auth is **stateless** — there is no server session store; the cookie is the
  whole story.

---

## 11. Images & uploads

A small storage abstraction lets the same upload endpoint work locally or on
Cloudinary (`server/src/modules/images/`):

```
storage/storage.interface.ts   the contract
storage/local.storage.ts       writes to LOCAL_UPLOAD_DIR, returns /uploads/<file>
storage/cloudinary.storage.ts  uploads to Cloudinary, returns a CDN URL
```

- `POST /api/images/upload` (Multer, `multipart/form-data`) returns
  `{ url: '<...>' }`. The active backend is chosen by `IMAGE_STORAGE`.
- With `IMAGE_STORAGE=local` (the dev default), files are served as static assets
  at **`/uploads`** (wired in `app.ts`).
- Allowed types / max size come from shared constants (`ALLOWED_IMAGE_TYPES`,
  `IMAGE_MAX_SIZE_BYTES`).
- On the client, the shared **`ImageUploader`** (`components/ui/`) posts to this
  endpoint and hands back the URL; post covers and bike photos both use it.

---

## 12. Testing strategy

| Layer | Tool | Where | Run |
|-------|------|-------|-----|
| Unit | Vitest 4 | each workspace's `test/` (+ colocated `*.test.ts` in `shared`) | `npm test` |
| Integration | Vitest + **testcontainers** (ephemeral PostgreSQL 16) | `server/test/` | `npm test -w server` |
| E2E + a11y | Playwright + `@axe-core/playwright` | `client/e2e/` | `npx playwright test` (from `client/`) |

- **Coverage target ≥ 95%** (aim 100%). The gate is `scripts/check-coverage.mjs`
  against `.coverage-threshold.json`, run by `npm run test:coverage` /
  `npm run test:ci`.
- Integration tests **boot a real Postgres in Docker** via testcontainers — no
  mocking the database. Mock only true externals.
- `server/test/factories/` builds test data.
- Run one workspace: `npm test -w server`. Watch mode: `npm run test:watch -w client`.

---

## 13. Common recipes

### Add a new API endpoint (end to end)

1. **Schema** (`shared/src/schemas/<domain>.schema.ts`): add/extend the Zod
   schema; export the inferred type from `shared/src/types/index.ts`. Add a test.
   Rebuild shared (or rely on `npm run dev`).
2. **Repository** (`<domain>.repository.ts`): add the Kysely query.
3. **Service** (`<domain>.service.ts`): business logic + ownership checks.
4. **Controller** (`<domain>.controller.ts`): read `req`, call the service, send
   the response.
5. **Route** (`<domain>.routes.ts`): wire it with guards, e.g.
   `router.post('/', requireAuth, validate(createXSchema, 'body'), controller.create);`
6. **Tests** for service + route; keep coverage ≥ 95%.

### Add a client page

1. Create the page under `client/src/features/<feature>/pages/`.
2. Add an `api/` wrapper that calls `apiClient` for any new endpoint.
3. Register the route in `client/src/App.tsx` (public, `<ProtectedRoute>`, or
   inside `<MeLayout>` for `/me/*`).
4. Reuse `components/ui/` building blocks and existing CSS tokens/utilities.

### Add a database column / table

1. `npm run db:migrate:create` and write `up`/`down`.
2. Update the `Database` interface in `server/src/db/types.ts`.
3. Thread it through repository → service → controller and the shared schema if
   it crosses the API boundary.
4. `npm run db:migrate`.

---

## 14. Gotchas that will bite you

- **Rebuild `shared` after schema changes.** Server/client typecheck against
  `shared/dist`. Stale dist = confusing "type X is missing field Y" errors.
  `npm run dev` keeps it fresh; otherwise `npm run build -w shared`.
- **`.js` import extensions are mandatory** (ESM). Omitting them fails at runtime.
- **`noUncheckedIndexedAccess`**: `arr[i]` is `T | undefined`. Guard it.
- **Express 5 `req.query` is read‑only** — that's why `validate` uses
  `Object.defineProperty`. Don't assign to `req.query` directly.
- **Optimistic‑lock timestamps**: Postgres microseconds vs JS Date milliseconds —
  compare with `date_trunc('milliseconds', ...)` (see §5).
- **CSS specificity**: an adjacent‑sibling rule like `.item + .item` (0,3,0)
  outranks `.item` (0,2,0). To override it you must match the same or higher
  specificity — overriding on the bare class won't win.
- **Lint is not wired up yet.** ESLint is in the `lint` scripts and the CI step,
  but it is **not installed and there's no config**, so `npm run lint` (and CI's
  lint step) currently fails. Type safety is enforced via `npm run typecheck`. If
  you set up ESLint, that closes a real gap.
- **CI triggers on `main`.** `.github/workflows/ci.yml` runs on push/PR to
  `main`; day‑to‑day local work here is on `master`. Mind the branch names.
- **Bike photos often have pure‑black backgrounds** — images render with
  `object-fit: contain` on a tinted matte so they don't disappear in dark mode.

---

## 15. Where to find things

| I want to… | Look in |
|------------|---------|
| Change a request/response shape or validation | `shared/src/schemas/` (+ `types/index.ts`) |
| Add/adjust an API endpoint | `server/src/modules/<name>/` |
| Touch SQL | the module's `*.repository.ts` only |
| Change middleware / app wiring | `server/src/app.ts`, `server/src/middleware/` |
| Add/alter a table | `server/src/db/migrations/` + `db/types.ts` |
| Configure env / secrets | `server/src/config/env.ts`, `.env` |
| Add a screen / route | `client/src/features/<feature>/pages/`, `client/src/App.tsx` |
| Reuse a UI component | `client/src/components/ui/` |
| Change design tokens / dark mode | `client/src/styles/tokens.css` |
| Understand auth | `server/src/modules/auth/`, `client/src/features/auth/` |
| Image upload behaviour | `server/src/modules/images/`, `client/src/components/ui/ImageUploader.tsx` |
| CI / coverage gate | `.github/workflows/ci.yml`, `scripts/check-coverage.mjs` |

Welcome aboard — start with a small recipe from §13 and trace it through the
layers; the architecture is consistent, so once one domain clicks, they all do.
