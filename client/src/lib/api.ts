import axios, { AxiosError } from 'axios';
import {
  Project,
  ProjectWithTaskCounts,
  ProjectWithTasks,
  Task,
  DashboardSummary,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  ApiListResponse,
  ApiSingleResponse,
  ApiErrorResponse,
  ProjectStatus,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    if (axiosErr.response?.data?.error?.message) {
      const details = axiosErr.response.data.error.fields;
      if (details) {
        const fieldMsgs = Object.entries(details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        return `${axiosErr.response.data.error.message} (${fieldMsgs})`;
      }
      return axiosErr.response.data.error.message;
    }
    return axiosErr.message || 'An unexpected network error occurred.';
  }
  return error instanceof Error ? error.message : 'An unknown error occurred.';
}

export const projectsApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<ApiSingleResponse<DashboardSummary>>('/api/dashboard/stats');
    return res.data.data;
  },

  getAll: async (status?: ProjectStatus): Promise<ProjectWithTaskCounts[]> => {
    const params = status ? { status } : {};
    const res = await api.get<ApiListResponse<ProjectWithTaskCounts>>('/api/projects', { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<ProjectWithTasks> => {
    const res = await api.get<ApiSingleResponse<ProjectWithTasks>>(`/api/projects/${id}`);
    return res.data.data;
  },

  create: async (data: CreateProjectInput): Promise<Project> => {
    const res = await api.post<ApiSingleResponse<Project>>('/api/projects', data);
    return res.data.data;
  },

  update: async (id: number, data: UpdateProjectInput): Promise<Project> => {
    const res = await api.put<ApiSingleResponse<Project>>(`/api/projects/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },
};

export const tasksApi = {
  create: async (projectId: number, data: CreateTaskInput): Promise<Task> => {
    const res = await api.post<ApiSingleResponse<Task>>(`/api/projects/${projectId}/tasks`, data);
    return res.data.data;
  },

  update: async (projectId: number, taskId: number, data: UpdateTaskInput): Promise<Task> => {
    const res = await api.put<ApiSingleResponse<Task>>(
      `/api/projects/${projectId}/tasks/${taskId}`,
      data
    );
    return res.data.data;
  },

  delete: async (projectId: number, taskId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
  },
};

export default api;
