# App Requirements (Deliberately Over-Specified)

Context: This is a tiny “notes + admin” app with a login, personal notes, upload, search, metrics, and an admin users view. The existing implementation is intentionally bad. These are the intended features and behaviors the app should support after cleanup.

## Product Vision (In Scope)
- A signed-in user can:
  - Sign in with email + password.
  - View their own profile (basic info).
  - View their notes list and add new notes.
  - Upload a file and get back a server path.
  - Use a simple search feature.
- An admin can:
  - View a list of users for audit.
  - View basic server metrics.

## Actors
- Anonymous visitor
- Authenticated user
- Admin user (subset of authenticated users with `role=admin`)

## High-Level Flows
1. Login
   - User submits email/password.
   - On success, a session is established; client stores a credential and shows authenticated area.
   - On failure, an error message is shown.

2. Profile
   - Shows current user info.
   - Handles error states if session is invalid or expired.

3. Notes
   - Fetch list of notes for the current user.
   - Add a new note and update the list.

4. Upload
   - Select a file and upload it.
   - Show upload result (path or link).

5. Search
   - Enter a query and get back results.

6. Admin
   - View users list.
   - View server metrics.

## Backend Endpoints (as implemented, but should be hardened)
- POST `/login` { email, password } -> { ok, token, user }
- POST `/logout` (auth) -> { ok }
- GET `/me` (auth) -> { ok, user }
- GET `/notes?userId=<id>` (auth) -> { ok, data: Note[] }
- POST `/notes` (auth) { text } -> { ok, id }
- POST `/upload` multipart/form-data -> { ok, path }
- POST `/eval` { code } -> { ok, result } (should be removed in final)
- GET `/flaky` -> { ok, when }
- GET `/admin/users` -> { ok, users }
- POST `/admin/audit` { ... } -> { ok }
- GET `/admin/audit` -> audit entries
- GET `/metrics` -> text metrics
- GET `/search?q=...` -> { ok, results } or file content when `q=file:<path>`

Data Model (minimal):
- User: { id: number, name: string, email: string, password: string, role: 'admin'|'user' }
- Note: { id: number, userId: number, text: string }
- Session: In-memory mapping userId -> { userId, email, role, token }

## Frontend Views
- Login (public)
- Dashboard (authenticated)
  - Home tab: Notes list, Add note, Eval playground (to be removed)
  - Admin tab: Users list, Metrics
  - Profile tab: Profile info

## Non-Functional Requirements
- Security: Do not store secrets insecurely; no eval; input validation; avoid injection; safe file handling; auth checks for protected routes.
- Reliability: Async flows and promises resolve correctly; meaningful error states; no global mutable state races.
- Maintainability: Reasonable project structure; names and modules reflect intent; remove dead code; add small tests if possible.
- Performance: Avoid blocking calls; avoid unnecessary re-renders; basic caching or memoization where relevant.

## Out of Scope (for 2 hours)
- Full test coverage; production-grade auth; full accessibility; full i18n; complex role management.

## Acceptance Hints (Post-Refactor)
- A mid-level engineer can run FE+BE and perform login, view/add notes, upload a file, run a simple search, and (as admin) see users/metrics.
- Security and code quality are notably improved versus the starting point.
- Dangerous endpoints (like `/eval`) are removed or gated.
- Documented tradeoffs and next steps.
