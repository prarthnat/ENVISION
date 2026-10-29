import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import {
  applyCompletedFlag,
  createProjectSchema,
  updateProjectSchema,
  projectStatusFilterSchema,
  createTaskSchema,
  updateTaskSchema,
} from '../lib/validators';
import { createError } from '../middleware/errorHandler';

const router = Router();

/**
 * Helper: parse and validate an integer route param.
 * Throws a 400 AppError if invalid.
 */
function parseId(param: string, next: NextFunction): number | null {
  const id = parseInt(param, 10);
  if (isNaN(id) || id <= 0) {
    next(createError('Invalid ID — must be a positive integer', 400, 'INVALID_ID'));
    return null;
  }
  return id;
}

/**
 * Helper: format Zod errors into a fields map for the error contract.
 */
function formatZodError(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    fields[path || 'root'] = issue.message;
  }
  return fields;
}

// ─── GET /api/projects/summary ───────────────────────────────────────────────
// Must be defined BEFORE /:id to avoid "summary" being parsed as an id
router.get(
  '/summary',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [projects, tasks] = await Promise.all([
        prisma.project.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
      ]);

      const totalProjects = await prisma.project.count();
      const totalTasks = await prisma.task.count();

      const byStatus: Record<string, number> = {};
      for (const row of projects) {
        byStatus[row.status] = row._count.id;
      }

      const tasksByStatus: Record<string, number> = {};
      for (const row of tasks) {
        tasksByStatus[row.status] = row._count.id;
      }

      res.json({
        data: {
          totalProjects,
          byStatus,
          totalTasks,
          tasksByStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = projectStatusFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(
        createError('Invalid query parameters', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const where = parsed.data.status ? { status: parsed.data.status } : {};

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
    });

    const data = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      deadline: p.deadline,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      taskCount: p._count.tasks,
      completedTaskCount: p.tasks.filter((t) => t.status === 'Completed').length,
    }));

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const id = parseId(req.params.id, next);
  if (id === null) return;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!project) {
      return next(createError(`Project with id ${id} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/projects ───────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError('Validation failed', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const project = await prisma.project.create({ data: parsed.data });
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const id = parseId(req.params.id, next);
  if (id === null) return;

  try {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError('Validation failed', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return next(createError(`Project with id ${id} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
    });

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const id = parseId(req.params.id, next);
  if (id === null) return;

  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return next(createError(`Project with id ${id} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    // onDelete: Cascade in schema handles task deletion automatically
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/projects/:projectId/tasks ───────────────────────────────────────
router.get('/:projectId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  const projectId = parseId(req.params.projectId, next);
  if (projectId === null) return;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(createError(`Project with id ${projectId} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: tasks });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/projects/:projectId/tasks ──────────────────────────────────────
router.post('/:projectId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  const projectId = parseId(req.params.projectId, next);
  if (projectId === null) return;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(createError(`Project with id ${projectId} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError('Validation failed', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const task = await prisma.task.create({
      data: { ...parsed.data, projectId },
    });

    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/projects/:projectId/tasks/:taskId ──────────────────────────────
router.put('/:projectId/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  const projectId = parseId(req.params.projectId, next);
  if (projectId === null) return;

  const taskId = parseId(req.params.taskId, next);
  if (taskId === null) return;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(createError(`Project with id ${projectId} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return next(createError(`Task with id ${taskId} not found`, 404, 'TASK_NOT_FOUND'));
    }

    // Cross-project protection: verify task belongs to this project
    if (task.projectId !== projectId) {
      return next(
        createError(
          `Task ${taskId} does not belong to project ${projectId}`,
          400,
          'CROSS_PROJECT_TASK_MISMATCH'
        )
      );
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError('Validation failed', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: applyCompletedFlag(parsed.data),
    });

    res.json({ data: updatedTask });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/projects/:projectId/tasks/:taskId ───────────────────────────
router.delete('/:projectId/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  const projectId = parseId(req.params.projectId, next);
  if (projectId === null) return;

  const taskId = parseId(req.params.taskId, next);
  if (taskId === null) return;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(createError(`Project with id ${projectId} not found`, 404, 'PROJECT_NOT_FOUND'));
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return next(createError(`Task with id ${taskId} not found`, 404, 'TASK_NOT_FOUND'));
    }

    // Cross-project protection: verify task belongs to this project
    if (task.projectId !== projectId) {
      return next(
        createError(
          `Task ${taskId} does not belong to project ${projectId}`,
          400,
          'CROSS_PROJECT_TASK_MISMATCH'
        )
      );
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

