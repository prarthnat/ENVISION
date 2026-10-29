# Codebase Implementation Guide — File-by-File Walkthrough

This guide provides a detailed, file-by-file walkthrough of the EnvisionStudio codebase designed for code reviews, onboarding junior engineers, and interview defense.

---

## 1. Server Architecture (`server/`)

### 1.1 `server/prisma/schema.prisma`
- **Responsibility:** Defines the database models, relations, constraints, and generator settings.
- **Why it exists:** Provides the single source of truth for the database schema and auto-generates the type-safe `@prisma/client`.
- **Key Models:**
  - `Project`: stores title, description, status (`Active`, `Completed`, `On Hold`), deadline string (`YYYY-MM-DD`), and timestamps.
  - `Task`: stores title, description, status (`Pending`, `In Progress`, `Completed`), and `projectId` foreign key.
- **Relational Integrity:**
  ```prisma
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  ```
  `onDelete: Cascade` instructs SQLite's foreign-key engine to clean up child tasks whenever the parent project is deleted.
- **Likely Interview Question:**
  *Q: Why did you store deadline as a String instead of DateTime in Prisma?*  
  *A: SQLite stores DateTime as UTC ISO strings. When JavaScript parses ISO timestamps, local browser timezones can shift midnight to the previous evening. Storing a strict `YYYY-MM-DD` string preserves the business date immutably across all timezones.*

---

### 1.2 `server/prisma/seed.ts`
- **Responsibility:** Ingests the 10 employer-provided projects and 20 tasks into the database idempotently.
- **Why it exists:** Allows reviewers and developers to set up a clean, realistic dataset in seconds (`npm run seed`).
- **Code Breakdown:**
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany();
    await tx.project.deleteMany();
    for (const project of projects) await tx.project.create({ data: project });
    for (const task of tasks) await tx.task.create({ data: task });
  });
  ```
  - Runs inside an atomic database transaction (`$transaction`). If any insertion fails, the entire transaction rolls back.
  - Deletes tasks before projects to avoid violating foreign key constraints during cleanup.
  - Faithfully preserves non-breaking characters (`U+2011`) present in the source mock data.

---

### 1.3 `server/src/lib/validators.ts`
- **Responsibility:** Defines runtime Zod validation schemas for request bodies, query filters, and route parameters.
- **Why it exists:** Enforces data hygiene and prevents invalid data from reaching the database layer.
- **Key Schemas:**
  - `createProjectSchema`: validates non-empty title (1–200 chars), optional description (max 2000 chars), status enum (`Active`, `Completed`, `On Hold`), and ISO date regex `^\d{4}-\d{2}-\d{2}$`.
  - `createTaskSchema`: validates non-empty title (1–300 chars), optional description, and task status enum (`Pending`, `In Progress`, `Completed`).
  - `projectStatusFilterSchema`: validates optional `status` query parameter.

---

### 1.4 `server/src/middleware/errorHandler.ts`
- **Responsibility:** Centralized error-handling middleware and standard error response formatting.
- **Why it exists:** Ensures the API always returns a consistent `{ error: { message, code?, fields? } }` contract with appropriate HTTP status codes (400, 404, 500).
- **Code Breakdown:**
  - In production (`NODE_ENV === 'production'`), internal server error messages (500) are replaced with a generic `"Internal server error"` to prevent leaking stack traces or database schema details.
  - In development, logs the full stack trace server-side for rapid debugging.
  - Includes a catch-all `notFoundHandler` for unregistered endpoints returning 404.

---

### 1.5 `server/src/routes/projects.ts`
- **Responsibility:** Implements project CRUD, dashboard summary, and scoped task operations.
- **Key Endpoints:**
  - `GET /api/projects/summary`: Aggregates project counts by status and task counts by status in parallel using `Promise.all` and Prisma's `groupBy`.
  - `GET /api/projects`: Fetches projects with an optional status filter. Includes task counts and completed task counts computed via Prisma's `_count` and projection to avoid N+1 queries.
  - `GET /api/projects/:id`: Retrieves full project details along with its child tasks ordered chronologically.
  - `POST /api/projects`: Creates a new project with Zod validation.
  - `PUT /api/projects/:id`: Updates an existing project.
  - `DELETE /api/projects/:id`: Deletes a project (cascading to all child tasks).
  - `POST /api/projects/:projectId/tasks`: Creates a task under the specified project after verifying project existence.
  - `PUT /api/projects/:projectId/tasks/:taskId`: Updates a task after verifying project existence AND confirming the task belongs to `projectId`.
  - `DELETE /api/projects/:projectId/tasks/:taskId`: Deletes a task after verifying parent project ownership.
- **Likely Interview Question:**
  *Q: How do you prevent cross-project task updates?*  
  *A: The handler queries both the project and the task. If `task.projectId !== projectId`, it immediately rejects the request with HTTP 400 and code `CROSS_PROJECT_TASK_MISMATCH` before any mutation occurs.*

---

### 1.6 `server/src/app.ts` & `server/src/index.ts`
- **Responsibility:** Express application configuration and HTTP server entry point.
- **Middleware Pipeline:**
  1. `helmet()`: sets secure HTTP headers (X-Content-Type-Options, Strict-Transport-Security, etc.).
  2. `cors()`: restricts incoming origins to the configured `CORS_ORIGIN` environment variable.
  3. `express.json({ limit: '10kb' })`: protects against oversized payload attacks.
  4. `morgan('dev')`: request logging in development.
  5. Route handlers: `/health`, `/api/projects`, `/api/tasks`.
  6. `notFoundHandler` and `errorHandler`.

---

## 2. Client Architecture (`client/`)

### 2.1 `client/src/lib/api.ts`
- **Responsibility:** Typed HTTP client built with Axios.
- **Why it exists:** Centralizes API requests, baseURL configuration (`import.meta.env.VITE_API_URL`), and standardizes error extraction into friendly toast messages.

---

### 2.2 `client/src/lib/date.ts`
- **Responsibility:** Timezone-safe date formatting and deadline status calculation.
- **Code Breakdown:**
  ```typescript
  export function formatDateOnly(dateStr: string | null | undefined): string {
    if (!dateStr) return 'No deadline';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  ```
  - Parses the year, month, and day strings into integers.
  - Instantiates `Date.UTC` to completely bypass the client computer's local timezone offset.
  - `isOverdue` compares against current ISO date string (`YYYY-MM-DD`).

---

### 2.3 UI Components (`client/src/components/`)
- `Navbar.tsx`: Sticky navigation with active route highlights and a primary "+ New Project" CTA.
- `StatusBadge.tsx`: Accessible, color-coded status chips with status dots (Indigo for Active, Emerald for Completed, Amber for On Hold, Sky for In Progress, Slate for Pending).
- `ConfirmModal.tsx`: Focus-trapped confirmation modal with escape-key handling and explicit cascade deletion warnings.
- `LoadingSkeleton.tsx`: Pulse-animated loading skeletons for KPI metric cards, project cards, and deliverable rows.
- `EmptyState.tsx`: Meaningful empty states with friendly icons and actionable buttons.
- `ErrorMessage.tsx`: Accessible alert container with retry capabilities.
- `ProjectFormModal.tsx`: Modal form for creating and editing projects with client-side validation and field-level error messages.
- `TaskFormModal.tsx`: Modal form for creating and editing tasks scoped to a specific project.

---

### 2.4 Pages (`client/src/pages/`)
- `Dashboard.tsx`:
  - Fetches summary statistics via TanStack Query (`GET /api/projects/summary`).
  - Renders 6 KPI cards (Total Projects, Active, Completed, On Hold, Total Tasks, Completion Rate).
  - Visualizes deliverable breakdown with a stacked progress bar and interactive legend.
  - Displays grid of priority and active projects with task progress indicators.
- `ProjectList.tsx`:
  - Status filter tabs (`All`, `Active`, `Completed`, `On Hold`) that synchronize with API query params.
  - Client-side search bar filtering projects by title and description.
  - Responsive cards with task progress, deadlines, edit triggers, and cascade delete confirmation.
- `ProjectDetail.tsx`:
  - Breadcrumb navigation (`Dashboard > Projects > Title`).
  - Project header with metadata badges, target deadline, and progress bar.
  - Deliverables checklist: allows one-click completion toggling via checkboxes or inline status dropdowns.
  - Scoped task creation, editing, and deletion modals.
