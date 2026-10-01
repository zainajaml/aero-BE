# Browser journeys (Playwright)

The journeys drive the real frontend against a running backend.

1. In `../aero-zenith-flow-backend`: `docker compose -f docker-compose.dev.yml up -d --wait`,
   `npm run db:migrate`, `npm run dev`.
2. Here: `MAILPIT_URL=http://localhost:8026 npx playwright test` (starts `npm run dev` if needed).

Emails (verification, invitations) are read from Mailpit. Use an isolated database for
acceptance runs; never point these tests at production.
