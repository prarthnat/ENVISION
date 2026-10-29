import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('EnvisionStudio API Test Suite', () => {
  beforeAll(async () => {
    // Ensure clean state with standard seed
    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany();
      await tx.project.deleteMany();

      const p1 = await tx.project.create({
        data: {
          id: 1,
          title: 'Test Project 1',
          description: 'A test project description',
          status: 'Active',
          deadline: '2026-12-31',
        },
      });

      await tx.project.create({
        data: {
          id: 2,
          title: 'Test Project 2',
          description: 'Second test project',
          status: 'Completed',
          deadline: '2026-11-30',
        },
      });

      await tx.task.create({
        data: {
          id: 101,
          projectId: p1.id,
          title: 'Test Task 1',
          description: 'Task description',
          status: 'Pending',
        },
      });

      await tx.task.create({
        data: {
          id: 102,
          projectId: p1.id,
          title: 'Test Task 2',
          description: 'Completed task description',
          status: 'Completed',
        },
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─── Health Check ─────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('returns status 200 with service info', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('envision-studio-api');
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('returns total projects, active projects, completed tasks, and pending tasks', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.data.totalProjects).toBe(2);
      expect(res.body.data.activeProjects).toBe(1);
      expect(res.body.data.completedTasks).toBe(1);
      expect(res.body.data.pendingTasks).toBe(1);
    });
  });

  // ─── Project Summary ──────────────────────────────────────────────────────
  describe('GET /api/projects/summary', () => {
    it('returns aggregated summary counts correctly', async () => {
      const res = await request(app).get('/api/projects/summary');
      expect(res.status).toBe(200);
      expect(res.body.data.totalProjects).toBe(2);
      expect(res.body.data.totalTasks).toBe(2);
      expect(res.body.data.byStatus.Active).toBe(1);
      expect(res.body.data.byStatus.Completed).toBe(1);
      expect(res.body.data.tasksByStatus.Pending).toBe(1);
      expect(res.body.data.tasksByStatus.Completed).toBe(1);
    });
  });

  // ─── Projects CRUD ────────────────────────────────────────────────────────
  describe('GET /api/projects', () => {
    it('returns all projects with calculated task counts', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBe(2);

      const p1 = res.body.data.find((p: any) => p.id === 1);
      expect(p1).toBeDefined();
      expect(p1.taskCount).toBe(2);
      expect(p1.completedTaskCount).toBe(1);
    });

    it('filters projects by valid status', async () => {
      const res = await request(app).get('/api/projects?status=Active');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('Active');
    });

    it('returns 400 for invalid status query', async () => {
      const res = await request(app).get('/api/projects?status=InvalidStatus');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns project with tasks for existing project', async () => {
      const res = await request(app).get('/api/projects/1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.tasks.length).toBe(2);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await request(app).get('/api/projects/9999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('returns 400 for invalid project ID format', async () => {
      const res = await request(app).get('/api/projects/abc');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('POST /api/projects', () => {
    it('creates project with valid data and returns 201', async () => {
      const newProject = {
        title: 'Brand New Project',
        description: 'New description',
        status: 'Active',
        deadline: '2026-10-31',
      };
      const res = await request(app).post('/api/projects').send(newProject);
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(newProject.title);
      expect(res.body.data.deadline).toBe(newProject.deadline);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/projects').send({
        description: 'No title provided',
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields.title).toBeDefined();
    });

    it('returns 400 when deadline format is invalid', async () => {
      const res = await request(app).post('/api/projects').send({
        title: 'Project with invalid date',
        deadline: '31-12-2026', // wrong format
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields.deadline).toBeDefined();
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('updates existing project fields', async () => {
      const res = await request(app)
        .put('/api/projects/2')
        .send({ title: 'Updated Project 2 Title', status: 'On Hold' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Project 2 Title');
      expect(res.body.data.status).toBe('On Hold');
    });

    it('returns 404 for updating non-existent project', async () => {
      const res = await request(app)
        .put('/api/projects/9999')
        .send({ title: 'Ghost Project' });
      expect(res.status).toBe(404);
    });
  });

  // ─── Tasks CRUD ───────────────────────────────────────────────────────────
  describe('POST /api/projects/:projectId/tasks', () => {
    it('creates a task under existing project and returns 201', async () => {
      const res = await request(app).post('/api/projects/1/tasks').send({
        title: 'Newly Added Task',
        description: 'Description here',
        status: 'In Progress',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Newly Added Task');
      expect(res.body.data.projectId).toBe(1);
    });

    it('returns 404 when creating task for non-existent project', async () => {
      const res = await request(app).post('/api/projects/9999/tasks').send({
        title: 'Orphan Task',
      });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('returns 400 when task title is empty', async () => {
      const res = await request(app).post('/api/projects/1/tasks').send({
        title: '',
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Project-Scoped Task Updates and Cross-Project Protection', () => {
    it('updates task using scoped route PUT /api/projects/:projectId/tasks/:taskId', async () => {
      const res = await request(app)
        .put('/api/projects/1/tasks/101')
        .send({ status: 'Completed', title: 'Renamed Task 101' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Completed');
      expect(res.body.data.title).toBe('Renamed Task 101');
    });

    it('prevents cross-project task update when task belongs to a different project', async () => {
      // Task 101 belongs to Project 1, but we send request to Project 2's route
      const res = await request(app)
        .put('/api/projects/2/tasks/101')
        .send({ status: 'Completed' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CROSS_PROJECT_TASK_MISMATCH');
    });

    it('returns 404 when project does not exist for scoped task update', async () => {
      const res = await request(app)
        .put('/api/projects/9999/tasks/101')
        .send({ status: 'Completed' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('prevents cross-project task deletion', async () => {
      // Task 102 belongs to Project 1, cannot delete through Project 2
      const res = await request(app).delete('/api/projects/2/tasks/102');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CROSS_PROJECT_TASK_MISMATCH');
    });

    it('deletes task using scoped route DELETE /api/projects/:projectId/tasks/:taskId', async () => {
      const res = await request(app).delete('/api/projects/1/tasks/102');
      expect(res.status).toBe(204);

      const check = await prisma.task.findUnique({ where: { id: 102 } });
      expect(check).toBeNull();
    });
  });

  describe('Global task routes PUT/DELETE /api/tasks/:id', () => {
    it('updates a task by id and maps completed=true to Completed status', async () => {
      const res = await request(app)
        .put('/api/tasks/101')
        .send({ completed: true, title: 'Task 101 via global route' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Completed');
      expect(res.body.data.title).toBe('Task 101 via global route');
    });

    it('returns 404 when updating a missing task', async () => {
      const res = await request(app).put('/api/tasks/9999').send({ status: 'Pending' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });
  });

  describe('DELETE /api/projects/:id (Cascade Deletion)', () => {
    it('deletes project and cascades deletion to all its child tasks', async () => {
      // Project 1 has task 101
      const res = await request(app).delete('/api/projects/1');
      expect(res.status).toBe(204);

      // Verify project is deleted
      const proj = await prisma.project.findUnique({ where: { id: 1 } });
      expect(proj).toBeNull();

      // Verify tasks for project 1 were cascade deleted
      const tasks = await prisma.task.findMany({ where: { projectId: 1 } });
      expect(tasks.length).toBe(0);
    });
  });
});
