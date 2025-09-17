# Candidate Instructions

Welcome! This task provides a deliberately messy fullstack app (React + Node/Express) with security issues, broken flows, and poor code quality. Your job is to improve it.

Timebox: About 2 hours. Prioritize impact over completeness.

## Objectives
- Improve code quality by applying clean code and SOLID principles pragmatically.
- Fix critical security and correctness issues.
- Untangle state and data flow on the frontend.
- Stabilize the most broken endpoints on the backend.

## What We’d Like You To Do (choose a focused subset)
- Security: Stop leaking secrets/tokens, make auth safer, remove dangerous eval, add basic input validation.
- Reliability: Fix obviously broken promises/async flows and error handling.
- Maintainability: Restructure worst parts (split large files, reduce global state, improve naming and cohesion).
- FE: Replace insecure localStorage usage for sensitive values, fix data fetching and broken forms, clean up component structure.
- BE: Add minimal request validation, correct status codes, remove injection risks, and centralize error handling.
- Cross-cutting: Introduce configuration via env variables; add a tiny test or two if you have time.

You won’t do all of these—pick the highest value items and explain your choices.

## Deliverables
- Code changes (or a written plan with partial changes if short on time).
- A short summary: what you changed and why, plus tradeoffs.
- A list of remaining issues and next steps.

## Acceptance Hints (not strict requirements)
- App runs (FE+BE) with fewer obvious errors.
- Sensitive data is not stored unsafely; dangerous eval removed or gated.
- Broken endpoints (notes, login/logout) behave reasonably with validation and error handling.
- Code is more readable: smaller functions/components, clearer names, reduced duplication.

## Getting Started
1. Backend
   - In a terminal:
     - `cd server`
     - `npm install`
     - `npm start`
   - Server attempts to run on `http://localhost:4000` (hardcoded in places).

2. Frontend
   - In another terminal:
     - `cd client`
     - `npm install`
     - `npm start`
   - The dev server runs on `http://localhost:5173`.

3. App URLs
   - FE: `http://localhost:5173/`
   - BE: `http://localhost:4000/`

## Hotspots To Notice (not exhaustive)
- FE: Insecure localStorage use; mixed JS/TS; promise never resolving; blocking UI; global state leaks; wrong endpoints; path traversal in upload; client-side eval; missing error boundaries.
- BE: Wide-open CORS; eval endpoint; global in-memory session store; SQL injection; path traversal in uploads; inconsistent status codes; blocking delays; flaky endpoint; hardcoded secrets/ports.

## Tips
- You won’t fix everything in 2 hours—explain priorities and tradeoffs.
- Consider adding a simple `.env` and moving magic values into config.
- Add light validation (e.g., joi/zod/express-validator) and centralized error handling if time permits.
- Prefer small, incremental improvements that compound.

Good luck, and have fun. Document decisions you make along the way.

---

See also: `App-Requirements.md` for intended features and flows to guide prioritization.

---

## Quick Start (Copy/Paste)

Windows cmd:

```cmd
cd server && npm install && npm start
```

Open a new terminal:

```cmd
cd client && npm install && npm start
```

Visit `http://localhost:5173/` (frontend) and ensure backend is live at `http://localhost:4000/`.

If `sqlite3` install fails on Windows, you can either use a Node LTS with prebuilt binaries or document a fallback plan (acceptable for this exercise).

## Your Task Guide (2 hours)

Suggested time split (flex as needed):
- 15–20 min: Triage and plan (identify top risks and quick wins)
- 50–60 min: Implement fixes (security + correctness + structure)
- 20–25 min: Hardening (validation, error handling, config, cleanup)
- 10 min: Sanity tests and smoke runs
- 5 min: Write the summary of changes and next steps

### Priorities (aim for highest impact first)
1) Security & Safety
- Remove or gate the `/eval` endpoint and client eval usage.
- Stop leaking secrets/tokens and remove password from `localStorage`; prefer HttpOnly cookie or at least a safer storage pattern.
- Validate request inputs on backend (notes, login, upload, search) and sanitize outputs.
- Fix file upload path traversal and restrict file operations.

2) Correctness & Reliability
- Fix broken async flows (e.g., promises that never resolve, flaky endpoint patterns).
- Correct data fetching paths and proxy usage; make notes add/fetch work consistently.
- Add proper HTTP status codes and basic error handling.

3) Maintainability & Structure
- Split large files, reduce global mutable state, improve naming and module structure.
- Create a minimal config (e.g., `.env`) for ports/secrets.
- Trim dead code and remove unnecessary side effects.

4) Stretch (if time allows)
- Add small tests (unit or integration) for 1–2 critical paths.
- Add lint/formatting scripts and fix obvious style issues.
- Replace ad-hoc fetches with a small API layer or React Query.

### Minimum Acceptable Improvements
- Dangerous eval removed or gated.
- Insecure storage of sensitive data reduced or eliminated.
- Notes list and add note behave sensibly; obvious broken fetches fixed.
- Input validation exists for at least the notes and login endpoints.
- Clear error handling for a couple of failure states.

### Deliverables (what to submit)
- Code changes (commit history is fine) or a written plan with partial changes.
- A short summary (1–2 paragraphs):
   - What you changed and why
   - Tradeoffs and limitations
   - Remaining issues + next steps

### Evaluation Rubric (guidance)
- Impactful Prioritization (30%): You picked high-value fixes first.
- Code Quality & Design (25%): Readability, smaller units, separation of concerns.
- Security & Reliability (25%): Removed risky patterns; validation; correct async.
- Functionality (15%): Core flows work (login, notes list/add, basic admin view).
- Communication (5%): Clear summary and rationale.

### Troubleshooting
- If the FE 404s API calls, confirm backend is on `4000` and the Vite proxy routes are correct.
- If uploads fail, check the server `uploads/` folder exists; the task includes it, but confirm path.
- If `sqlite3` fails to build, call it out and proceed with other fixes—document your approach.
