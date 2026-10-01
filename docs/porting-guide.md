# Porting guide (temporary, removed at handover)

Source app (read-only): `/home/zain-ajmal/www/aero-zenith-flow/src` — Lovable/TanStack Start + Supabase.
Target: this repo (Vite + React 19 + TanStack Router file routes + TanStack Query). Backend contract:
`openapi/openapi.json` → generated types in `src/shared/api/schema.gen.ts` (refresh with `npm run api:sync`
only if told to; the backend repo is `../aero-zenith-flow-backend`, read its `src/modules/**/**.routes.ts`
to understand each endpoint's rules).

## Rules

1. **Keep the UI identical** (markup, classes, copy, interactions). Do not redesign.
2. **No Supabase, no server functions, no `fetch` in features.** All data goes through
   `src/features/<feature>/api/<feature>.api.ts` functions built on `api` + `unwrap` from
   `@/shared/api/client` (see `src/features/projects/api/projects.api.ts`). Errors are `ApiError`
   (`@/shared/api/errors`, use `errorMessage(e)` for toasts). Multipart uploads: see
   `src/features/users/api/profile.api.ts` (`replaceMyAvatar`).
3. **API types are camelCase** (`accountId`, `projectType`, `archivedAt` …). Convert every snake_case
   field from the source. Use the generated `components["schemas"][...]` types; do not hand-write DTOs
   that duplicate them.
4. **Business rules live in the backend now.** Do not recompute what an endpoint returns (e.g. RAG rows,
   utilisation, ticket codes, positions, stage history, estimate totals, audit logs). Remove all
   `logAudit(...)` calls and client-side notification calls (`notify*`): the backend does both.
   Multi-step client writes become the single endpoint that exists for them.
5. **Structure:** route files in `src/routes/**` are thin (route options + render a view). Views,
   components and hooks go under `src/features/<feature>/{views,components,hooks,lib}`. Split files over
   ~400 lines by responsibility (e.g. the 3k-line ticket dialog → header/description/comments/
   work-logs/estimates/attachments components + hooks). Shared primitives: `@/shared/ui/*`,
   `@/shared/lib/*`. Do not import another feature's internals except its public pieces listed below.
6. **Query keys**: one key factory per feature (`hooks/<feature>-queries.ts`), keys include ids; on
   mutations invalidate the relevant keys (see `features/projects/hooks/project-queries.ts`).
7. **Permissions in UI** stay as cosmetic hints using `useAuth()` (`features/auth/auth-context`),
   `useCanWrite`/`useIsViewer` (`features/auth/hooks/use-can-write`), `useProjects()`
   (`features/projects/project-context`). The server is authoritative; show its error message on 403/409.
8. Imports: run `scripts/port-imports.sh <files>` after copying a source file — it rewrites known paths.

## Already available

- Auth: `useAuth()` → `{ user (Me), roles, globalRoles, projectRoles, adminAccountIds, hasRole, hasAnyRole, signOut, refreshRoles }`.
- Projects: `useProjects()` → `{ projects, allProjects, archivedProjects, visibleProjects, accounts, accountFilterId, activeProject, activeProjectId, setActiveProjectId, isAllProjects, refetch }`; API in `features/projects/api/projects.api.ts` (projects, accounts, stats, people, rate card).
- Timezone: `useTimezone()` from `@/features/users/lib/timezone`.
- Avatars: `UserAvatar` (`features/users/components/user-avatar`), names via `displayName()` (`features/users/lib/names`).
- Private files: `useSignedUrl(area, key)` (`@/shared/hooks/use-signed-url`), areas `avatars|attachments|document-images|documents|support`.
- Rich text: `features/rich-text/*` (comment editor, rich text editor, mentions, `#` document tags, inline image upload/sign, `doc-image://` normalisation, document viewer bus).
- Shared helpers: `@/shared/lib/{format,date-validation,role-labels,job-titles,ticket-description,email-normalize,invite-expiry,cta,utils}`, `@/shared/ui/*` (shadcn, glass, icons, media-image, confirm-delete, timezone-switcher, stepper-num-input, password-input, close-button).

## Done for a page

`npm run typecheck`, `npm run lint`, `npx vite build` pass; no `supabase`, `@/integrations`, `@/lib/`
or `@/components/` imports remain in your files; the page renders against the running backend.
