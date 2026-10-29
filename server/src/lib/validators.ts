import { z } from 'zod';

export const PROJECT_STATUSES = ['Active', 'Completed', 'On Hold'] as const;
export const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Date-only regex: YYYY-MM-DD
const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createProjectSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  status: z.enum(PROJECT_STATUSES).optional().default('Active'),
  deadline: z
    .string()
    .regex(dateOnlyRegex, 'Deadline must be in YYYY-MM-DD format')
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(300, 'Title cannot exceed 300 characters'),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  status: z.enum(TASK_STATUSES).optional().default('Pending'),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/** Map a boolean `completed` flag onto the task status enum. */
export function applyCompletedFlag(data: UpdateTaskInput): Omit<UpdateTaskInput, 'completed'> {
  const { completed, ...rest } = data;
  if (completed === true) {
    return { ...rest, status: 'Completed' };
  }
  if (completed === false && rest.status === undefined) {
    return { ...rest, status: 'Pending' };
  }
  return rest;
}

export const projectStatusFilterSchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
});
