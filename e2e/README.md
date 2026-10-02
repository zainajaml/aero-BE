# Browser journeys (Playwright)

The journeys drive the real frontend against a running backend. Emails (verification, invitations,
notifications) are read from Mailpit. Use an isolated database for acceptance runs; never point
these tests at production.

## Running

1. In `../aero-zenith-flow-backend`: `docker compose -f docker-compose.dev.yml up -d --wait`,
   `npm run db:migrate`, `npm run dev` (against the e2e database, e.g. `azf_e2e`).
2. Here: `MAILPIT_URL=http://localhost:8026 npx playwright test` (starts `npm run dev` if needed).
   To reuse a dev server that is already up, pass its URL:
   `E2E_BASE_URL=http://localhost:5190 MAILPIT_URL=http://localhost:8026 npx playwright test`.
   Run `npx playwright install chromium` once beforehand if the browser is missing.

| Variable       | Default                                                                 | Purpose                                    |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `E2E_BASE_URL` | `http://localhost:5173` (Playwright then starts the dev server)         | Frontend; it proxies `/api` to the backend |
| `MAILPIT_URL`  | `http://localhost:8026`                                                 | Mailpit API fed by the backend's SMTP      |
| `E2E_PSQL`     | `docker exec -i aero-zenith-flow-dev-postgres-1 psql -U azf -d azf_e2e` | psql command for the e2e database (stdin)  |

**Rate limits.** The backend allows 10 sign-ups per hour per IP, and every journey signs up its own
users from 127.0.0.1. `support/global-setup.ts` therefore clears `rate_limit_counters` on the e2e
database before each run (one run needs about 9 sign-ups). It refuses a command that does not
mention `e2e`; set `E2E_PSQL=` (empty) to skip the reset.

## Writing journeys

- Every test gets its own user, workspace and project from the `workspace` fixture in
  `support/fixtures.ts`: sign-up through `/api/auth/sign-up/email`, the verification link from
  Mailpit, then the onboarding API (`/api/v1/onboarding/workspace`, `/first-project`). The `page`
  is signed in as that account admin (`page.request` shares the browser's cookies).
- Setup that is not the subject of a test goes through the API: `createTicket`, `addMember`
  (invite plus accept with a password), `apiGet` / `apiPost` / `apiPatch`.
- Names carry `uniqueId()`, so tests never depend on each other's data and can run in parallel.
- Locate by role and accessible name (`getByRole`, `getByLabel`). If a control has no accessible
  name, fix the component rather than reaching for CSS selectors.
- No fixed sleeps: wait on UI state. Emails are sent after the API answers, so wait for them in
  Mailpit (`linkFromLatestEmail`), and poll pages that do not refresh on their own with
  `expect(...).toPass()`.

## Journeys

| Spec                            | Covers                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth-onboarding.spec.ts`       | UI sign-up, email verification, onboarding wizard, dashboard; sign-in and wrong password; anonymous guard                                       |
| `tickets.spec.ts`               | Create a ticket from the backlog, open it, rename and save, comment, log work time, reload and verify, open the `/ticket/<id>` deep link        |
| `sprint-board.spec.ts`          | Create a sprint, move a ticket into it with the selection bar, start it, drag the card Backlog to In Progress on the board, verify after reload |
| `team.spec.ts`                  | Admin invites a viewer from Admin > User Management; the invitee signs up from the Mailpit link, lands in the project, sees no edit controls    |
| `documents.spec.ts`             | Create a folder and a page in it, type content, save, reload and read it back                                                                   |
| `support-notifications.spec.ts` | Open a support issue from the widget and send a message; the notifications page lists a sent email; invitation visibility (known backend bug)   |
| `profile.spec.ts`               | Change name (the sidebar follows) and timezone, toggle a notification preference, verify after a reload and in a fresh session                  |

`support-notifications.spec.ts` marks "lists the invitations sent for the project" with
`test.fail()`: invitation emails log `project_ids`, while the project filter of
`GET /api/v1/notifications` reads `project_id`, so a project's invitations never show in its
notification log. Remove the marker once the backend is fixed; Playwright reports the test as soon
as it starts passing.
