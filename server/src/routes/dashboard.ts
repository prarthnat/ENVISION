import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Required assessment aggregates: total projects, active projects,
 * completed tasks, and pending tasks.
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalProjects, activeProjects, completedTasks, pendingTasks, inProgressTasks, onHoldProjects, completedProjects, totalTasks] =
      await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: 'Active' } }),
        prisma.task.count({ where: { status: 'Completed' } }),
        prisma.task.count({ where: { status: 'Pending' } }),
        prisma.task.count({ where: { status: 'In Progress' } }),
        prisma.project.count({ where: { status: 'On Hold' } }),
        prisma.project.count({ where: { status: 'Completed' } }),
        prisma.task.count(),
      ]);

    res.json({
      data: {
        totalProjects,
        activeProjects,
        completedTasks,
        pendingTasks,
        byStatus: {
          Active: activeProjects,
          Completed: completedProjects,
          'On Hold': onHoldProjects,
        },
        totalTasks,
        tasksByStatus: {
          Pending: pendingTasks,
          'In Progress': inProgressTasks,
          Completed: completedTasks,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
