# Architecture Decision Records (ADRs) — EnvisionStudio

This document records all key architectural decisions adopted for the EnvisionStudio Project Management Dashboard.

---

## ADR-001: Frontend Framework — React 18 with Vite and TypeScript

- **Status:** Accepted
- **Context:** The practical assessment requires a responsive, high-performance web dashboard with clean component hierarchy, maintainable state management, and type safety.
- **Decision:** Use React 18, Vite 5, and TypeScript in strict mode.
- **Alternatives Considered:**
  - *Next.js (App Router):* Overkill for a client dashboard; server component complexity distracts from core full-stack API demonstration.
  - *Create React App (CRA):* Deprecated, slow build times, outdated toolchain.
- **Trade-offs:** Single Page Application (SPA) requires client-side routing, but provides instant navigation and superior local development speed (HMR under 50ms).

---

## ADR-002: Backend Runtime & Transport — Node.js with Express and TypeScript

- **Status:** Accepted
- **Context:** Need a lightweight, universally understood HTTP backend with straightforward middleware pipeline and low cognitive overhead.
- **Decision:** Use Express 4 with TypeScript, compiled with `tsc`, and developed via `ts-node-dev`.
- **Alternatives Considered:**
  - *Fastify:* Slightly higher throughput, but less standardized in coding assessments.
  - *NestJS:* Premature abstraction; introduces heavy decorator magic and boilerplate not warranted for a 2-model application.
- **Trade-offs:** Express requires explicit middleware wiring for security and error handling, but results in transparent, readable code that junior developers can easily understand.

---

## ADR-003: Database and ORM — SQLite with Prisma ORM

- **Status:** Accepted
- **Context:** Requires a real persistent database with migrations and relational modeling. The solution must run reliably in local evaluation environments without requiring external Docker dependencies or managed cloud databases.
- **Decision:** Use SQLite stored in a file (`dev.db`) driven by Prisma ORM v5 with declarative schema migrations.
- **Alternatives Considered:**
  - *PostgreSQL:* Standard for multi-node production, but requires local setup, credentials, and network configuration from reviewers.
  - *Lowdb / JSON files:* Not a real database, lacks schema constraints and ACID guarantees.
- **Trade-offs:** SQLite is single-writer, which is ideal for single-instance applications and assessment reviews. Prisma abstracts the SQL layer, allowing trivial migration to PostgreSQL in the future by simply updating `provider = "postgresql"`.

---

## ADR-004: Relational Cascade Deletion for Project-Task Association

- **Status:** Accepted
- **Context:** Tasks are inherently scoped to projects. When a project is deleted, orphan tasks must not remain in the database.
- **Decision:** Enforce `onDelete: Cascade` at the database level on the `Task.projectId` foreign key relationship.
- **Alternatives Considered:**
  - *Set Null / Restrict:* Prevents deletion or leaves orphaned tasks with no parent project.
  - *Application-level manual deletion:* Prone to race conditions and failure if an operation is interrupted midway.
- **Trade-offs:** Deleting a project is an irreversible destructive action. To protect the user, the UI enforces a two-step confirmation modal explicitly displaying the count of tasks that will be deleted.

---

## ADR-005: Project-Scoped Task Endpoints & Cross-Project Protection

- **Status:** Accepted
- **Context:** Task manipulation must be scoped to the parent project to prevent cross-tenant or cross-project data corruption.
- **Decision:** Expose task operations at `/api/projects/:projectId/tasks/:taskId` and verify both project existence and that `task.projectId === projectId`. Reject mismatches with HTTP 400 (`CROSS_PROJECT_TASK_MISMATCH`).
- **Alternatives Considered:**
  - *Global task endpoints `/api/tasks/:id`:* Convenient but fails to enforce project boundaries, allowing tasks to be modified without verifying parent project context.
- **Trade-offs:** Slightly longer URL paths in the client, but guarantees strict relational boundaries and zero unauthorized cross-project modifications.

---

## ADR-006: Date-Only Deadline Representation (Zero Timezone Drift)

- **Status:** Accepted
- **Context:** Deadlines are business dates (e.g. `2026-08-15`), not timestamps. JavaScript Date objects assume local browser midnight when parsing date strings, causing one-day-off display bugs in timezones west of UTC.
- **Decision:** Store deadlines as ISO `YYYY-MM-DD` strings in the database, validate using `/^\d{4}-\d{2}-\d{2}$/`, and parse explicitly in UTC on the frontend (`Date.UTC(y, m-1, d)`).
- **Alternatives Considered:**
  - *UTC Timestamps (`DateTime`):* Introduces timezone conversion bugs on client rendering.
  - *Unix timestamp numbers:* Less readable in direct database queries and JSON payloads.
- **Trade-offs:** Sorting strings formatted as `YYYY-MM-DD` is lexicographically identical to chronological ordering, making string representation both simple and robust.

---

## ADR-007: Validation Boundary — Zod Runtime Validation

- **Status:** Accepted
- **Context:** All client input must be sanitized and verified before reaching database queries.
- **Decision:** Use Zod schemas for request bodies, route parameters, and query strings.
- **Alternatives Considered:**
  - *Joi / express-validator:* More verbose, less integrated with TypeScript static inference.
  - *Manual `if/else` checks:* Error-prone, inconsistent error output formatting.
- **Trade-offs:** Adds a small runtime library dependency, but provides shared schema validation and consistent `{ error: { message, code, fields } }` error contracts.

---

## ADR-008: Server State Management — TanStack React Query v5

- **Status:** Accepted
- **Context:** Frontend requires caching, background synchronization, and automatic loading/error/success state tracking without excessive `useEffect` boilerplate.
- **Decision:** Use TanStack React Query v5 with 30-second stale time and mutation-based cache invalidation.
- **Alternatives Considered:**
  - *Redux Toolkit:* Heavy boilerplate for server-side asynchronous data.
  - *Raw `useEffect` + `useState`:* Leads to race conditions, manual cancellation logic, and stale state bugs.
- **Trade-offs:** Small bundle size increase, but eliminates hundreds of lines of async state boilerplate and handles refetching automatically.

---

## ADR-009: Visual Design System — Restrained Dark Agency Aesthetic

- **Status:** Accepted
- **Context:** The prompt requires a polished, dark agency dashboard with readable contrast, consistent hierarchy, and no meaningless decorative fluff.
- **Decision:** Build a custom Tailwind palette with `#0f1117` base, `#1a1d27` cards, `#2a2d3a` borders, and an Indigo (`#6366f1`) primary accent with color-coded semantic status chips.
- **Alternatives Considered:**
  - *Heavy gradients and glowing neon borders:* Distracting, poor accessibility, unprofessional.
  - *Pre-built component libraries (MUI/AntD):* Heavy bundle size, difficult to customize to a dark agency aesthetic.
- **Trade-offs:** Writing custom components with Tailwind takes slightly more styling code, but gives 100% control over accessibility, responsive breakpoints, and aesthetic cohesion.
