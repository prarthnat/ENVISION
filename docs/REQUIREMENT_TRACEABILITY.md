# Requirement Traceability Matrix — EnvisionStudio

Every functional, non-functional, and technical requirement mapped directly to source code, API routes, automated tests, and verification evidence.

---

| # | Requirement | Type | Implementation File(s) | API Route / Component | Test File | Verification Status | Evidence / Test Result |
|---|---|---|---|---|---|---|---|
| **R1** | Real backend API (no mock arrays or localStorage) | Technical | `server/src/app.ts`, `server/src/routes/*.ts` | All `/api/*` endpoints | `server/tests/api.test.ts` | **Verified** | Live HTTP Express server running on port 3001 |
| **R2** | Real persistent database (SQLite + Prisma) | Technical | `server/prisma/schema.prisma`, `server/prisma/dev.db` | SQLite engine via Prisma | `server/tests/api.test.ts` | **Verified** | Data persists in `dev.db`; migrations tracked in `prisma/migrations/` |
| **R3** | React + Vite + TypeScript frontend | Technical | `client/package.json`, `client/vite.config.ts`, `client/tsconfig.json` | React 18 SPA | `client/src/__tests__/date.test.ts` | **Verified** | `npm run build:client` completes with 0 errors |
| **R4** | Node.js + Express + TypeScript backend | Technical | `server/package.json`, `server/tsconfig.json` | Express 4 | `server/tests/api.test.ts` | **Verified** | `npm run build:server` compiles with `tsc` with 0 errors |
| **R5** | Project CRUD — Create | Functional | `server/src/routes/projects.ts`, `client/src/components/ProjectFormModal.tsx` | `POST /api/projects` | `server/tests/api.test.ts` | **Verified** | Test: `creates project with valid data and returns 201` |
| **R6** | Project CRUD — Read (List) | Functional | `server/src/routes/projects.ts`, `client/src/pages/ProjectList.tsx` | `GET /api/projects` | `server/tests/api.test.ts` | **Verified** | Test: `returns all projects with calculated task counts` |
| **R7** | Project CRUD — Read (Detail) | Functional | `server/src/routes/projects.ts`, `client/src/pages/ProjectDetail.tsx` | `GET /api/projects/:id` | `server/tests/api.test.ts` | **Verified** | Test: `returns project with tasks for existing project` |
| **R8** | Project CRUD — Update | Functional | `server/src/routes/projects.ts`, `client/src/components/ProjectFormModal.tsx` | `PUT /api/projects/:id` | `server/tests/api.test.ts` | **Verified** | Test: `updates existing project fields` |
| **R9** | Project CRUD — Delete | Functional | `server/src/routes/projects.ts`, `client/src/components/ConfirmModal.tsx` | `DELETE /api/projects/:id` | `server/tests/api.test.ts` | **Verified** | Test: `deletes project and cascades deletion to all child tasks` |
| **R10** | Task CRUD — Create (per project) | Functional | `server/src/routes/projects.ts`, `client/src/components/TaskFormModal.tsx` | `POST /api/projects/:projectId/tasks` | `server/tests/api.test.ts` | **Verified** | Test: `creates a task under existing project and returns 201` |
| **R11** | Task CRUD — Read (filtered by project) | Functional | `server/src/routes/projects.ts`, `client/src/pages/ProjectDetail.tsx` | `GET /api/projects/:projectId/tasks` | `server/tests/api.test.ts` | **Verified** | Test: `returns project with tasks for existing project` |
| **R12** | Task CRUD — Update | Functional | `server/src/routes/projects.ts`, `client/src/components/TaskFormModal.tsx` | `PUT /api/projects/:projectId/tasks/:taskId` | `server/tests/api.test.ts` | **Verified** | Test: `updates task using scoped route` |
| **R13** | Task CRUD — Delete | Functional | `server/src/routes/projects.ts`, `client/src/components/ConfirmModal.tsx` | `DELETE /api/projects/:projectId/tasks/:taskId` | `server/tests/api.test.ts` | **Verified** | Test: `deletes task using scoped route` |
| **R14** | Cross-Project Task Update Protection | Technical | `server/src/routes/projects.ts` | Route handler verifies `task.projectId === projectId` | `server/tests/api.test.ts` | **Verified** | Test: `prevents cross-project task update when task belongs to a different project` |
| **R15** | Dashboard summary endpoint & metrics | Functional | `server/src/routes/projects.ts`, `client/src/pages/Dashboard.tsx` | `GET /api/projects/summary` | `server/tests/api.test.ts` | **Verified** | Test: `returns aggregated summary counts correctly` |
| **R16** | Employer mock-data seeded idempotently | Functional | `server/prisma/seed.ts`, `server/data/mock-data.json` | `npm run seed` command | `server/prisma/seed.ts` | **Verified** | Seed script executed multiple times; exactly 10 projects, 20 tasks confirmed |
| **R17** | Loading states | UX | `client/src/components/LoadingSkeleton.tsx` | `MetricCardSkeleton`, `ProjectCardSkeleton`, `TableRowSkeleton` | Manual visual check | **Verified** | Skeletons render during async query fetching |
| **R18** | Empty states | UX | `client/src/components/EmptyState.tsx` | `EmptyState` component | Manual visual check | **Verified** | Displayed when filters yield 0 records or project has no tasks |
| **R19** | Error states & retry | UX | `client/src/components/ErrorMessage.tsx` | `ErrorMessage` component | Manual visual check | **Verified** | Network failure banner with "Try Again" trigger |
| **R20** | Form validation (client & server) | UX / Sec | `server/src/lib/validators.ts`, `client/src/components/*Modal.tsx` | Zod schemas + React state | `server/tests/api.test.ts` | **Verified** | Test: `returns 400 when title is missing` & invalid date rejection |
| **R21** | Responsive layout | UX | `client/tailwind.config.js`, `client/src/components/Navbar.tsx` | Tailwind breakpoints `sm`, `md`, `lg` | Manual browser check | **Verified** | Fluid layout tested at 375px (mobile), 768px (tablet), and 1280px (desktop) |
| **R22** | Confirmation for destructive actions | UX | `client/src/components/ConfirmModal.tsx` | Two-step modal | Manual visual check | **Verified** | Deleting project/task requires explicit confirmation; warns of cascade |
| **R23** | Dark agency dashboard design | UX | `client/src/index.css`, `client/tailwind.config.js` | Dark palette `#0f1117`, indigo accent | Manual visual check | **Verified** | High contrast, consistent typography and spacing, readable status chips |
| **R24** | Date-only deadline handling (no drift) | Technical | `client/src/lib/date.ts`, `server/src/lib/validators.ts` | UTC date formatter | `client/src/__tests__/date.test.ts` | **Verified** | Test: `formats YYYY-MM-DD date without timezone conversion` (3/3 passed) |
| **R25** | Health endpoint | Technical | `server/src/routes/health.ts` | `GET /health` | `server/tests/api.test.ts` | **Verified** | Test: `returns status 200 with service info` |
| **R26** | Security headers & request size limits | Security | `server/src/app.ts` | `helmet()`, `express.json({ limit: '10kb' })` | Code inspection | **Verified** | Helmet active; payload size restricted to 10kb |
| **R27** | CORS restriction | Security | `server/src/app.ts` | `cors({ origin: CORS_ORIGIN })` | Code inspection | **Verified** | CORS bound to environment variable allowlist |
| **R28** | No secrets in git | Security | `.gitignore` | `*.db`, `.env` gitignored | `git status` check | **Verified** | `.env` and `dev.db` omitted from git tracking |
| **R29** | Cascade deletion of dependent tasks | Technical | `server/prisma/schema.prisma` | `onDelete: Cascade` | `server/tests/api.test.ts` | **Verified** | Test: `deletes project and cascades deletion to all its child tasks` |
