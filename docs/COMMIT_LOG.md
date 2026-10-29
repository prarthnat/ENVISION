# Commit Log & Audit Trail — EnvisionStudio

This project is tracked in Git on `main`. The full history is available with `git log --oneline`; this document records the current review scope rather than duplicating Git history.

## Current audit changes

- Corrected the SQLite path in the server environment example and README.
- Isolated API tests in a disposable SQLite database created from the checked-in migrations.
- Tightened project/task ID and calendar-date validation.
- Updated task mutations to use the project-scoped API routes.
- Added keyboard focus management and accessible error descriptions to dialogs.
- Replaced the Vite favicon and corrected stale documentation claims.

## Verification

- `npm test`: 28 server integration tests and 4 client date tests pass.
- `npm run build`: production build passes.
- Seed data matches the supplied mock file: 10 projects and 20 tasks.
- Browser checks covered desktop/mobile rendering, status filters, table view, scoped task updates, dialog focus and Escape handling, and temporary project/task create-edit-delete flows.
