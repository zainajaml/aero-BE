# aero-zenith-flow-frontend

React 19 + Vite single-page app for Space Scope. It talks only to the `aero-zenith-flow-backend`
API.

## Local development

```bash
cp .env.example .env
npm ci
npm run dev          # http://localhost:5173 — /api is proxied to the backend on :4000
```

Start the backend first (see its README). Sessions are HttpOnly cookies set by the backend; the dev
proxy keeps everything same-origin, as the production reverse proxy / same-site domains do.

## API contract

`openapi/openapi.json` is a pinned copy of the backend contract and `src/shared/api/schema.gen.ts`
is generated from it. To pick up backend API changes: `npm run api:sync` (copies the published spec
from the sibling backend checkout and regenerates types), review the diff, and commit both files.
Builds never read the backend repository.

## Layout

- `src/app` — bootstrap, router, query client.
- `src/routes` — thin TanStack Router file routes.
- `src/features/<domain>` — `api/` (typed calls through the shared client), `hooks/`, `components/`, `views/`.
- `src/shared` — API client with interceptors, UI primitives (shadcn), utilities.

## Checks

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` (Vitest unit tests for pure
modules), `npm run build`, `npm run deps:cycles`, `npm run deps:unused` (knip). CI runs all of them
(`.github/workflows/ci.yml`). Browser journeys: see `e2e/README.md`.

## MCP sign-in

MCP clients (Claude and others) authorize against the backend's OAuth server. The backend sends the
browser to `/login?…&sig=…` when there is no session (the login form then continues the
authorization) and to `/oauth/consent?…` for approval. Both pages pass the signed query back
unchanged as `oauth_query`.

## Docker

```bash
docker build -t aero-zenith-flow-frontend:local .            # --build-arg VITE_API_URL=https://api.example.com for a split origin
docker run -p 8080:80 -e API_UPSTREAM=http://api:4000 aero-zenith-flow-frontend:local
```

nginx serves `dist` with an SPA fallback (`index.html` is never cached, `/assets/*` is cached for a
year) and proxies `/api`, `/mcp` and `/.well-known/oauth-*` to `API_UPSTREAM` (default
`http://api:4000`), so the app and API share one origin. `/healthz` answers `ok`.
