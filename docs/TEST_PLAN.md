# Quality Assurance Test Plan — EnvisionStudio

## 1. Overview & Testing Pyramid

The testing strategy validates the entire application across three primary layers:
1. **Unit Tests (Client):** Validates pure helper functions (date formatting, timezone safety, overdue calculations).
2. **Integration Tests (Server):** Validates all Express HTTP endpoints, Zod validation, error contracts, relational cascade deletions, and cross-project security using Vitest and Supertest.
3. **Manual End-to-End Smoke Tests:** Verifies responsive UI flows, focus management, confirmation modals, and real-time state synchronization.

---

## 2. Automated Test Suites & Commands

### 2.1 Server Integration Tests
- **Framework:** Vitest + Supertest
- **Location:** `server/tests/api.test.ts`
- **Execution Command:**
  ```bash
  cd server && npm test
  # or from project root:
  npm run test:server
  ```
- **Test Scenarios Covered (22 tests):**
  - **Health Check:** `GET /health` returns 200 with service metadata.
  - **Dashboard Summary:** `GET /api/projects/summary` accurately aggregates total counts and status groupings.
  - **Project List:** `GET /api/projects` returns records with computed `taskCount` and `completedTaskCount`.
  - **Project Filtering:** `GET /api/projects?status=Active` filters accurately; invalid status returns 400.
  - **Project Detail:** `GET /api/projects/:id` returns project with nested tasks; non-existent ID returns 404; non-integer returns 400.
  - **Project Creation:** `POST /api/projects` creates valid record with 201; missing title or invalid date returns 400.
  - **Project Update:** `PUT /api/projects/:id` updates fields; non-existent ID returns 404.
  - **Scoped Task Creation:** `POST /api/projects/:projectId/tasks` adds task under project; non-existent project returns 404; empty title returns 400.
  - **Scoped Task Update:** `PUT /api/projects/:projectId/tasks/:taskId` updates task.
  - **Cross-Project Protection:** `PUT /api/projects/2/tasks/101` returns 400 (`CROSS_PROJECT_TASK_MISMATCH`) because task 101 belongs to project 1.
  - **Scoped Task Deletion:** `DELETE /api/projects/:projectId/tasks/:taskId` deletes task; cross-project deletion attempt returns 400.
  - **Cascade Deletion:** `DELETE /api/projects/:id` removes project and verifies all child tasks are cascade-deleted in SQLite.

### 2.2 Client Unit Tests
- **Framework:** Vitest
- **Location:** `client/src/__tests__/date.test.ts`
- **Execution Command:**
  ```bash
  cd client && npm test
  # or from project root:
  npm run test:client
  ```
- **Test Scenarios Covered (3 tests):**
  - Verifies date-only formatting (`YYYY-MM-DD` -> `Mon DD, YYYY` in UTC) without local timezone offsets.
  - Verifies graceful handling of `null` and `undefined` deadlines (`"No deadline"`).
  - Verifies `isOverdue` returns true for past dates and false for future dates or null deadlines.

---

## 3. Manual Smoke Test Checklist

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| 1 | Run `npm run seed` in `server` | 10 projects and 20 tasks inserted into `server/prisma/dev.db` | [x] |
| 2 | Start server (`npm run dev:server`) | Listens on `http://localhost:3001` | [x] |
| 3 | Start client (`npm run dev:client`) | Opens on `http://localhost:5173` | [x] |
| 4 | Open Dashboard (`/`) | 6 KPI cards show total projects (10), active (6), completed (2), on hold (2), tasks (20), progress (30%) | [x] |
| 5 | Click "+ New Project" button in Navbar | Accessible modal opens with autofocus on title | [x] |
| 6 | Submit empty project form | Inline validation error: "Project title is required" | [x] |
| 7 | Create valid project | Modal closes, toast notification appears, dashboard and project list update automatically | [x] |
| 8 | Navigate to `/projects` | All 10 seeded projects render with status chips, task counts, and deadlines | [x] |
| 9 | Click "Completed" filter tab | Only projects with status "Completed" are displayed | [x] |
| 10 | Type "mobile" into search input | Only matching projects ("Mobile App for Fitness Tracking") are shown | [x] |
| 11 | Click "View Tasks" on a project | Navigates to `/projects/:id`; displays project metadata and child deliverables | [x] |
| 12 | Click checkbox next to a pending task | Checkbox immediately checks, strikethrough applies, status switches to "Completed", progress bar advances | [x] |
| 13 | Click "+ Add Task" button | Task modal opens; submit valid task; task appears immediately in deliverable list | [x] |
| 14 | Click "Delete" on project detail page | Confirmation modal warns that child tasks will be cascade-deleted | [x] |
| 15 | Confirm project deletion | Project and child tasks are deleted, toast appears, user is redirected to `/projects` | [x] |
| 16 | View at 375px mobile viewport | Navigation collapses cleanly, metric cards stack to 2 columns, forms remain fully usable | [x] |
