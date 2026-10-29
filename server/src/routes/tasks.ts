import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { applyCompletedFlag, updateTaskSchema } from '../lib/validators';
import { createError } from '../middleware/errorHandler';

const router = Router();

function parseId(param: string, next: NextFunction): number | null {
  const id = parseInt(param, 10);
  if (isNaN(id) || id <= 0) {
    next(createError('Invalid ID — must be a positive integer', 400, 'INVALID_ID'));
    return null;
  }
  return id;
}

function formatZodError(fields: import('zod').ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of fields.issues) {
    const path = issue.path.join('.');
    result[path || 'root'] = issue.message;
  }
  return result;
}

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const id = parseId(req.params.id, next);
  if (id === null) return;

  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError('Validation failed', 400, 'VALIDATION_ERROR', formatZodError(parsed.error))
      );
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return next(createError(`Task with id ${id} not found`, 404, 'TASK_NOT_FOUND'));
    }

    const task = await prisma.task.update({
      where: { id },
      data: applyCompletedFlag(parsed.data),
    });

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const id = parseId(req.params.id, next);
  if (id === null) return;

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return next(createError(`Task with id ${id} not found`, 404, 'TASK_NOT_FOUND'));
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
