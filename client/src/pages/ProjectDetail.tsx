import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectsApi, tasksApi, getErrorMessage } from '../lib/api';
import { Task, TaskStatus, CreateTaskInput, UpdateProjectInput } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TableRowSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { formatDateOnly, getDeadlineCountdown, isOverdue } from '../lib/date';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id || '', 10);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);

  // Fetch Project Detail with Tasks
  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !isNaN(projectId) && projectId > 0,
  });

  // Project update mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: UpdateProjectInput) => projectsApi.update(projectId, data),
    onSuccess: () => {
      toast.success('Project updated successfully');
      setIsEditProjectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Project delete mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast.success('Project and associated tasks deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Task create mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(projectId, data),
    onSuccess: () => {
      toast.success('Task added successfully');
      setIsTaskModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: Partial<CreateTaskInput> }) =>
      tasksApi.update(projectId, taskId, data),
    onSuccess: () => {
      toast.success('Task updated');
      setIsTaskModalOpen(false);
      setTaskToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Task delete mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(projectId, taskId),
    onSuccess: () => {
      toast.success('Task removed');
      setTaskToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isNaN(projectId) || projectId <= 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage
          title="Invalid Project ID"
          message="The project ID in the URL is invalid."
        />
        <div className="mt-4">
          <Link to="/projects" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage
          title="Failed to load project"
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
        <div className="mt-4">
          <Link to="/projects" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="p-6 bg-surface-card border border-surface-border rounded-xl animate-pulse space-y-4">
          <div className="h-6 w-64 bg-surface-muted rounded" />
          <div className="h-4 w-96 bg-surface-muted rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const overdue = isOverdue(project.deadline) && project.status !== 'Completed';
  const countdown = getDeadlineCountdown(project.deadline);

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      data: { status: newStatus },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400">
        <Link to="/" className="hover:text-gray-200 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/projects" className="hover:text-gray-200 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium truncate max-w-xs">{project.title}</span>
      </nav>

      {/* Project Overview Card */}
      <section className="p-6 bg-surface-card border border-surface-border rounded-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {/* Project Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsEditProjectOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-surface-raised hover:bg-surface-border border border-surface-border rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              <span>Edit Project</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteProjectOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Project Metadata Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-border">
          <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-lg">
            <span className="text-xs text-slate-400">Target Deadline</span>
            <div className={`mt-1 text-sm font-semibold ${overdue ? 'text-red-400' : 'text-slate-100'}`}>
              {formatDateOnly(project.deadline)}
            </div>
            <div className={`mt-1 text-xs ${countdown.overdue && project.status !== 'Completed' ? 'text-red-400' : 'text-indigo-300'}`}>
              {countdown.label}
            </div>
          </div>

          {/* Progress */}
          <div className="p-3 bg-surface-raised border border-surface-border rounded-lg">
            <span className="text-xs text-gray-400">Deliverables Completed</span>
            <div className="mt-1 text-sm font-semibold text-gray-100">
              {completedTasks} / {tasks.length} tasks ({progressPercent}%)
            </div>
          </div>

          {/* Created Date */}
          <div className="p-3 bg-surface-raised border border-surface-border rounded-lg">
            <span className="text-xs text-gray-400">Record Created</span>
            <div className="mt-1 text-sm font-semibold text-gray-100">
              {formatDateOnly(project.createdAt.slice(0, 10))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Tasks Section */}
      <section aria-labelledby="tasks-section-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="tasks-section-title" className="text-lg font-bold text-white tracking-tight">
              Project Tasks & Deliverables
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Break down the project into actionable steps and update task completion in real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Task</span>
          </button>
        </div>

        {/* Task List / Table */}
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks in this project"
            description="Add tasks to plan work, set priorities, and track progress toward deliverables."
            actionLabel="Add First Task"
            onAction={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden divide-y divide-surface-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-raised/50 transition-colors"
              >
                {/* Left: Task details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Status Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        task,
                        task.status === 'Completed' ? 'Pending' : 'Completed'
                      )
                    }
                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      task.status === 'Completed'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-surface-border hover:border-gray-400 bg-surface-raised'
                    }`}
                    title={
                      task.status === 'Completed'
                        ? 'Mark task as Pending'
                        : 'Mark task as Completed'
                    }
                    aria-label={`Toggle completion for ${task.title}`}
                  >
                    {task.status === 'Completed' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Title & Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium transition-colors ${
                          task.status === 'Completed'
                            ? 'line-through text-gray-500'
                            : 'text-gray-100'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status selector dropdown & actions */}
                <div className="flex items-center gap-3 sm:flex-shrink-0 self-end sm:self-center">
                  {/* Inline Status Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                    aria-label={`Status for task: ${task.title}`}
                    className="px-2.5 py-1 text-xs bg-surface-raised border border-surface-border rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  {/* Edit Task */}
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surface-raised rounded-lg transition-colors"
                    title="Edit task"
                    aria-label={`Edit ${task.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>

                  {/* Delete Task */}
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Delete task"
                    aria-label={`Delete ${task.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          taskToEdit={taskToEdit}
          projectTitle={project.title}
          isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          onSubmit={(data) => {
            if (taskToEdit) {
              updateTaskMutation.mutate({ taskId: taskToEdit.id, data });
            } else {
              createTaskMutation.mutate(data);
            }
          }}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
        />
      )}

      {/* Project Edit Modal */}
      {isEditProjectOpen && (
        <ProjectFormModal
          isOpen={isEditProjectOpen}
          projectToEdit={project}
          isLoading={updateProjectMutation.isPending}
          onSubmit={(data) => updateProjectMutation.mutate(data)}
          onClose={() => setIsEditProjectOpen(false)}
        />
      )}

      {/* Delete Task Confirm Modal */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={!!taskToDelete}
          title="Delete Task"
          message={`Are you sure you want to remove the task "${taskToDelete.title}"?`}
          confirmLabel="Delete Task"
          isLoading={deleteTaskMutation.isPending}
          onConfirm={() => deleteTaskMutation.mutate(taskToDelete.id)}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {/* Delete Project Confirm Modal */}
      {isDeleteProjectOpen && (
        <ConfirmModal
          isOpen={isDeleteProjectOpen}
          title="Delete Entire Project"
          message={`Are you sure you want to permanently delete "${project.title}"?`}
          warningNote={`All ${tasks.length} task(s) under this project will also be deleted immediately.`}
          confirmLabel="Delete Project & Tasks"
          isLoading={deleteProjectMutation.isPending}
          onConfirm={() => deleteProjectMutation.mutate()}
          onCancel={() => setIsDeleteProjectOpen(false)}
        />
      )}
    </div>
  );
};
