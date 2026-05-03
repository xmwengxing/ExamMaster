# AGENTS.md

## Architecture

- **Monolith** — single package, fullstack: React 19 + Vite 6 frontend, Express 5 API backend, PostgreSQL 14.
- **Entrypoints**: Frontend `index.tsx` → `App.tsx` (tab-based SPA routing). Backend `server.js` (exports `app` for tests, only calls `.listen()` when `NODE_ENV !== 'test'`).
- **State**: `store.ts` is a custom React hook (not Zustand/Redux). API calls go through `/api` proxy.
- **Path alias**: `@/` → repo root (configured in both `tsconfig.json` and `vite.config.ts`).
- **Mixed JS/TS**: both `.js` and `.ts`/`.tsx` files coexist. New code should use TypeScript.
- **Styling**: Tailwind CSS 3 + Ant Design 5, used side-by-side.

## Commands

```bash
npm run dev              # Vite dev server on :5180, proxies /api → :3080
npm run start:server     # Express backend on :3080
npm run build            # Production build → dist/
npm test                 # Run vitest (requires running PostgreSQL!)
npm run test:watch       # Vitest watch mode
npm run test:coverage    # With v8 coverage (≥70% threshold)
npm run setup            # Interactive CLI setup wizard
npm run admin:reset      # Reset admin password
npm run db:migrate       # Run DB migrations
npm run db:seed          # Import seed data
npm run docker:up        # docker compose up -d
npm run docker:down      # docker compose down
```

**There is no `npm run lint` or `npm run typecheck` script.** ESLint and Prettier are installed but not wired into package.json scripts.

## Testing quirks

- **Tests hit a real PostgreSQL database**, despite what `tests/README.md` suggests. The test setup (`tests/setup.js`) connects to `localhost:5434`, database `edumaster`. You need a running PostgreSQL instance accessible at that port for tests to pass.
- `server.js` conditionally avoids `app.listen()` when `NODE_ENV='test'`, then exports `app` so supertest can drive it.
- Integration tests live in `tests/integration/`, unit tests in `tests/unit/`. Mock helpers are in `tests/helpers/`.

## Environment / config

- **`.env` is gitignored**, copy from `.env.example`.
- **DB_HOST must change by environment**: `localhost` for local dev, `postgres` inside Docker (container hostname).
- Docker maps PostgreSQL to host port `54320` (not the default 5432) to avoid conflicts.
- `GEMINI_API_KEY` is injected at **build time** via Vite's `define` — it's NOT read at runtime from `.env` on the client. `DEEPSEEK_API_KEY` is server-side only.
- AI features are optional — they work without an API key, just won't return AI-enhanced results.

## Docker

- `docker compose up -d` starts 3 services: postgres (14-alpine), api (Node), nginx (alpine).
- API container mounts server code as **read-only volumes** in dev — edit locally, nodemon-like restart needed manually or rebuild.
- Frontend static files are served by nginx from `dist/` at port `9080`.
- Default admin credentials: `admin` / `admin`.

## Frontend routing & permissions

- All navigation is tab-based via `activeTab` state in `App.tsx`. No React Router.
- Permission model: three-tier (individual > group > resource). Student-visible banks are filtered by `allowedBankIds` from group assignments.
- Practice sessions are persisted and `App.tsx` implements a "resume practice" dialog on re-entry.
