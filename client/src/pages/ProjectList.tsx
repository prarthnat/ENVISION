import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectsApi, getErrorMessage } from '../lib/api';
import { ProjectStatus, ProjectWithTaskCounts } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ProjectCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDateOnly, getDeadlineCountdown, isOverdue } from '../lib/date';

interface ProjectListProps {
  onNewProject: () => void;
  onEditProject: (project: ProjectWithTaskCounts) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onNewProject, onEditProject }) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const initialStatus: ProjectStatus | 'All' =
    statusParam === 'Active' || statusParam === 'Completed' || statusParam === 'On Hold'
      ? statusParam
      : 'All';
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'All'>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithTaskCounts | null>(null);

  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', 'list', selectedStatus],
    queryFn: () => projectsApi.getAll(selectedStatus === 'All' ? undefined : selectedStatus),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project deleted successfully');
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Filter projects by search input client-side
  const filteredProjects = projects?.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Projects</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your client deliverables, track sprint progress, and monitor project status.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-card border border-surface-border rounded-xl self-start overflow-x-auto max-w-full">
          {(['All', 'Active', 'Completed', 'On Hold'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setSelectedStatus(status);
                if (status === 'All') {
                  searchParams.delete('status');
                } else {
                  searchParams.set('status', status);
                }
                setSearchParams(searchParams, { replace: true });
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-raised'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-1 bg-surface-card border border-surface-border rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Table
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <svg
            className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      {error ? (
        <ErrorMessage
          title="Could not load projects"
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching projects found' : 'No projects in this view'}
          description={
            searchQuery
              ? `No projects matched your search for "${searchQuery}". Try a different keyword.`
              : selectedStatus === 'All'
              ? 'Start by creating your first client project.'
              : `There are currently no projects marked as "${selectedStatus}".`
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Create Project'}
          onAction={searchQuery ? () => setSearchQuery('') : onNewProject}
        />
      ) : (
        viewMode === 'table' ? (
        <div className="glass-card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProjects.map((project) => {
                const countdown = getDeadlineCountdown(project.deadline);
                const overdue = isOverdue(project.deadline) && project.status !== 'Completed';
                return (
                  <tr key={project.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${project.id}`} className="font-medium text-slate-100 hover:text-indigo-300">
                        {project.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-1">{project.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} size="sm" />
                    </td>
                    <td className={`px-4 py-3 ${overdue ? 'text-red-400' : 'text-slate-300'}`}>
                      <div>{formatDateOnly(project.deadline)}</div>
                      <div className="text-xs text-slate-400">{countdown.label}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {project.completedTaskCount}/{project.taskCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          className="text-xs text-indigo-300 hover:text-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const projectProgress =
              project.taskCount > 0
                ? Math.round((project.completedTaskCount / project.taskCount) * 100)
                : 0;
            const overdue = isOverdue(project.deadline) && project.status !== 'Completed';

            return (
              <div
                key={project.id}
                className="flex flex-col justify-between p-5 glass-card hover:border-slate-500 transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-semibold text-gray-100 hover:text-indigo-300 transition-colors line-clamp-1"
                    >
                      {project.title}
                    </Link>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Tasks Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-medium text-gray-300">
                        {project.completedTaskCount} of {project.taskCount} tasks ({projectProgress}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        style={{ width: `${projectProgress}%` }}
                        className="h-full bg-indigo-500 rounded-full transition-all"
                      />
                    </div>
                  </div>

                  {/* Deadline info */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-surface-border/60">
                    <span>Deadline</span>
                    <span className={`font-medium ${overdue ? 'text-red-400' : 'text-gray-300'}`}>
                      {overdue ? '⚠️ ' : ''}
                      {formatDateOnly(project.deadline)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 rounded-lg transition-colors"
                  >
                    View Tasks
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-surface-raised rounded-lg transition-colors"
                      title="Edit project"
                      aria-label={`Edit ${project.title}`}
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
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(project)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete project"
                      aria-label={`Delete ${project.title}`}
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
              </div>
            );
          })}
        </div>
      )
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <ConfirmModal
          isOpen={!!projectToDelete}
          title="Delete Project"
          message={`Are you sure you want to permanently delete "${projectToDelete.title}"?`}
          warningNote={`This project has ${projectToDelete.taskCount} task(s). Deleting it will permanently cascade-delete all associated tasks.`}
          confirmLabel="Delete Project"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(projectToDelete.id)}
          onCancel={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
};
