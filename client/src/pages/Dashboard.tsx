import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCardSkeleton, ProjectCardSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { formatDateOnly, getDeadlineCountdown, isOverdue } from '../lib/date';

interface DashboardProps {
  onNewProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewProject }) => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['projects', 'summary'],
    queryFn: projectsApi.getSummary,
  });

  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectsApi.getAll(),
  });

  const isLoading = isSummaryLoading || isProjectsLoading;
  const hasError = summaryError || projectsError;

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage
          title="Failed to load dashboard data"
          message="Could not connect to the backend server. Make sure the backend server is running on port 3001."
          onRetry={() => {
            refetchSummary();
            refetchProjects();
          }}
        />
      </div>
    );
  }

  const totalTasks = summary?.totalTasks || 0;
  const completedTasks = summary?.completedTasks ?? summary?.tasksByStatus?.Completed ?? 0;
  const pendingTasks = summary?.pendingTasks ?? summary?.tasksByStatus?.Pending ?? 0;
  const activeProjects = summary?.activeProjects ?? summary?.byStatus?.Active ?? 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const prioritizedProjects = [...(projects ?? [])].sort((a, b) => {
    const statusPriority = { Active: 0, 'On Hold': 1, Completed: 2 };
    const statusOrder = statusPriority[a.status] - statusPriority[b.status];
    if (statusOrder !== 0) return statusOrder;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agency Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time overview of client projects, deliverables, and team milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-surface-card hover:bg-surface-raised border border-surface-border rounded-lg transition-colors"
          >
            View All Projects
          </Link>
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Project</span>
          </button>
        </div>
      </div>

      <section aria-label="Key Performance Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <div className="glass-card p-5">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects</span>
                <div className="mt-2 text-3xl font-bold text-white">{summary?.totalProjects ?? 0}</div>
                <div className="mt-1 text-xs text-slate-400">All agency engagements</div>
              </div>
              <div className="glass-card p-5">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Active Projects</span>
                <div className="mt-2 text-3xl font-bold text-indigo-300">{activeProjects}</div>
                <div className="mt-1 text-xs text-slate-400">Currently in delivery</div>
              </div>
              <div className="glass-card p-5">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Completed Tasks</span>
                <div className="mt-2 text-3xl font-bold text-emerald-300">{completedTasks}</div>
                <div className="mt-1 text-xs text-slate-400">Closed deliverables</div>
              </div>
              <div className="glass-card p-5">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Pending Tasks</span>
                <div className="mt-2 text-3xl font-bold text-amber-300">{pendingTasks}</div>
                <div className="mt-1 text-xs text-slate-400">Waiting to start</div>
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-label="Quick Actions" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={onNewProject}
          className="glass-card p-5 text-left hover:border-indigo-500/50 transition-colors"
        >
          <p className="text-sm font-semibold text-white">Create a project</p>
          <p className="mt-1 text-xs text-slate-400">Add title, status, and deadline in one form.</p>
        </button>
        <Link to="/projects" className="glass-card p-5 hover:border-indigo-500/50 transition-colors">
          <p className="text-sm font-semibold text-white">Browse all projects</p>
          <p className="mt-1 text-xs text-slate-400">Filter by Active, Completed, or On Hold.</p>
        </Link>
        <Link to="/projects?status=Active" className="glass-card p-5 hover:border-indigo-500/50 transition-colors">
          <p className="text-sm font-semibold text-white">Review active work</p>
          <p className="mt-1 text-xs text-slate-400">{completionPercentage}% of tasks are complete.</p>
        </Link>
      </section>

      {/* Task Status Breakdown Bar */}
      {summary && (
        <section aria-label="Task Status Breakdown" className="p-5 bg-surface-card border border-surface-border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200">Deliverable Pipeline</h2>
            <span className="text-xs text-gray-400">{totalTasks} total tasks assigned</span>
          </div>
          {/* Stacked Progress Bar */}
          <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden flex">
            {completedTasks > 0 && (
              <div
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Completed: ${completedTasks}`}
              />
            )}
            {(summary.tasksByStatus?.['In Progress'] || 0) > 0 && (
              <div
                style={{ width: `${((summary.tasksByStatus?.['In Progress'] || 0) / totalTasks) * 100}%` }}
                className="bg-sky-500 h-full transition-all duration-500"
                title={`In Progress: ${summary.tasksByStatus?.['In Progress']}`}
              />
            )}
            {(summary.tasksByStatus?.Pending || 0) > 0 && (
              <div
                style={{ width: `${((summary.tasksByStatus?.Pending || 0) / totalTasks) * 100}%` }}
                className="bg-slate-600 h-full transition-all duration-500"
                title={`Pending: ${summary.tasksByStatus?.Pending}`}
              />
            )}
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Completed ({summary.tasksByStatus?.Completed || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>In Progress ({summary.tasksByStatus?.['In Progress'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span>Pending ({summary.tasksByStatus?.Pending || 0})</span>
            </div>
          </div>
        </section>
      )}

      {/* Recent Projects Grid */}
      <section aria-label="Recent Projects">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Priority Projects</h2>
          <Link to="/projects" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
            Browse all ({projects?.length || 0}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Get started by creating your first project or run the seed command."
            actionLabel="Create Project"
            onAction={onNewProject}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prioritizedProjects.slice(0, 6).map((project) => {
              const projectProgress =
                project.taskCount > 0
                  ? Math.round((project.completedTaskCount / project.taskCount) * 100)
                  : 0;
              const overdue = isOverdue(project.deadline) && project.status !== 'Completed';

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block p-5 bg-surface-card hover:bg-surface-raised border border-surface-border hover:border-surface-muted rounded-xl transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Task progress bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Tasks</span>
                      <span className="font-medium text-gray-300">
                        {project.completedTaskCount} / {project.taskCount}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        style={{ width: `${projectProgress}%` }}
                        className="h-full bg-indigo-500 rounded-full transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{formatDateOnly(project.deadline)}</span>
                    <span className={`font-medium ${overdue ? 'text-red-400' : 'text-slate-300'}`}>
                      {getDeadlineCountdown(project.deadline).label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
