// ─── Shared Types ─────────────────────────────────────────────────────────────
// These mirror the Prisma models and API response shapes exactly.

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Project {
  id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null; // ISO date string "YYYY-MM-DD"
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithTaskCounts extends Project {
  taskCount: number;
  completedTaskCount: number;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  byStatus: Record<ProjectStatus, number>;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
}

// ─── API Request Types ────────────────────────────────────────────────────────

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ProjectStatus;
  deadline?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiSingleResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
}
