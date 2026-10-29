# EnvisionStudio — Project Management Dashboard

Full-stack project and task dashboard for the EnvisionStudio Web Developer practical assessment. Data lives in a real database, the UI consumes REST APIs, and mock data is imported automatically on first boot.

**Permitted stack selected:** React + Node (Vite, Express, SQLite, Tailwind CSS). MongoDB/Mongoose is also allowed by the brief; SQLite was chosen so reviewers can run and deploy the app without a cloud database.

**Submission status:** The application and local verification are ready. A public deployment URL is still required by the assessment and is not configured in this repository; complete deployment and add the URL before submitting.

---

## Local installation

### Prerequisites

- Node.js 18 or 20
- npm 9+

### Environment variables

**Server (`server/.env`)**

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | API listen port | `3001` |
| `DATABASE_URL` | SQLite connection string (relative to `server/prisma/schema.prisma`) | `file:./dev.db` |
| `CORS_ORIGIN` | Allowed frontend origin (`*` or comma-separated) | `http://localhost:5173` |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |

`MONGODB_URI` is **not used**. The assessment permits MongoDB *or* SQLite. This submission uses SQLite so the database is a local file and first-load seeding does not depend on Atlas credentials.

**Client (`client/.env`)**

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Backend origin used by Axios | `http://localhost:3001` |

### Run locally

```bash
# Install both workspaces
npm install

# Configure and initialize the backend
cd server
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

# In a second terminal, from the repository root:
```bash
npm run dev --workspace=client
```

Open [http://localhost:5173](http://localhost:5173).

The seed script restores the exact 10 projects and 20 tasks from `server/data/mock-data.json`. It replaces existing records in the selected database, so use it to reset the assessment demo data:

```bash
# From the repository root
npx prisma db seed

# From server/
cd server && npx prisma db seed
```

The app also seeds automatically on first launch when the database is empty.

---

## Technology selection

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Assessment-permitted SPA stack with fast HMR and typed API clients. |
| Styling | Tailwind CSS | Agency dark theme (`#0F172A` / `#1E293B`) without a heavy UI kit. |
| Backend | Node.js + Express + TypeScript | Explicit REST handlers, validation, and middleware. |
| Database | SQLite + Prisma | Real persistent storage with cascade deletes. Zero Docker/Mongo setup for reviewers. |
| Client data | TanStack Query + Axios | Loading/error states, cache invalidation after mutations. |

MongoDB/Mongoose would map cleanly to the same models (`Project`, `Task` with `projectId` ref). SQLite was preferred for this submission because cascade deletes are enforced in the schema and the app boots with a single file database.

---

## API documentation

Base URL: `http://localhost:3001`

Success payloads use `{ data, total? }`. Errors use `{ error: { message, code, fields? } }`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health timestamp |
| `GET` | `/api/dashboard/stats` | `totalProjects`, `activeProjects`, `completedTasks`, `pendingTasks` (plus status breakdowns) |
| `GET` | `/api/projects` | List projects. Optional `?status=Active\|Completed\|On Hold` |
| `POST` | `/api/projects` | Create project `{ title, description?, status?, deadline? }` |
| `GET` | `/api/projects/:id` | Project detail with nested `tasks` |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project and cascade-delete tasks |
| `GET` | `/api/projects/:projectId/tasks` | Tasks for one project |
| `POST` | `/api/projects/:projectId/tasks` | Create task on a project |
| `PUT` | `/api/projects/:projectId/tasks/:taskId` | Update task with parent-project check |
| `DELETE` | `/api/projects/:projectId/tasks/:taskId` | Delete task with parent-project check |
| `PUT` | `/api/tasks/:id` | Update task (`status` or `completed: true/false`) |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/projects/summary` | Project and task counts grouped by status |

`deadline` is stored as `YYYY-MM-DD` (date-only) to avoid timezone drift.

---

## Features covered

- Project list with status filter, search, grid/table views, add/edit modal, delete confirmation
- Project detail with deadline countdown, task list, inline complete toggle, add/edit/delete tasks
- Dashboard cards: total projects, active projects, completed tasks, pending tasks
- Loading skeletons, toast notifications, mobile nav drawer
- Auto-seed from `server/data/mock-data.json` when the database is empty

---

## Challenges

1. **Date-only deadlines.** Native `Date` parsing shifts calendar days across timezones. Deadlines are stored as `YYYY-MM-DD` and formatted in UTC.
2. **First-load data.** Reviewers should not need a manual seed step. Startup seeds only when the database is empty so production data is not wiped on restart.
3. **Task ownership.** Global `/api/tasks/:id` routes exist as specified; project-scoped routes still reject cross-project updates.

---

## AI tools usage and validation

AI assistants (Cursor / prior Antigravity scaffolding) were used for:

- Mapping the assessment brief to routes, models, and UI views
- Boilerplate (Express middleware, Tailwind tokens, modal forms)
- Test and README drafts

Codex was also used during the final requirements audit, code review, and targeted fixes.

Every generated piece was reviewed and executed locally:

- `npm run test:server` — API integration tests (Supertest + Vitest)
- `npm run test:client` — date/countdown unit tests
- `npm run build` — TypeScript compile for client and server
- Manual UI checks: filter, CRUD, cascade delete confirmation, empty-database auto-seed

I can walk through any file in a review: models in `server/prisma/schema.prisma`, seed logic in `server/src/lib/seed.ts`, routes in `server/src/routes/`, and UI in `client/src/pages/`.

See also [`docs/AI_USAGE.md`](./docs/AI_USAGE.md).

AI tools were used as development assistants for planning, implementation drafts, and documentation. All submitted code was reviewed and verified by the author; AI output was not treated as a substitute for testing or understanding the implementation.

---

## Tests

```bash
npm test
# or
npm run test:server
npm run test:client
```
