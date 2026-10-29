import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, CreateProjectInput } from '../types';

interface ProjectFormModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  isLoading: boolean;
  onSubmit: (data: CreateProjectInput) => void;
  onClose: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  projectToEdit,
  isLoading,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setStatus(projectToEdit.status);
      setDeadline(projectToEdit.deadline || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('Active');
      setDeadline('');
    }
    setErrors({});
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Project title is required';
    } else if (title.length > 200) {
      errs.title = 'Title must be 200 characters or fewer';
    }

    if (description && description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer';
    }

    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      errs.deadline = 'Deadline must be formatted as YYYY-MM-DD';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      deadline: deadline || undefined,
    });
  };

  const isEditing = !!projectToEdit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 id="project-modal-title" className="text-lg font-semibold text-gray-100">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-md"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="project-title" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Project Title <span className="text-red-400">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mobile App for Fitness Tracking"
              className={`w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.title ? 'border-red-500' : 'border-surface-border'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-desc" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Description <span className="text-gray-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="project-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a high-level overview of the scope and deliverables..."
              className={`w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-surface-border'
              }`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* Grid: Status & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="project-status" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="project-deadline" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Deadline <span className="text-gray-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="project-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.deadline ? 'border-red-500' : 'border-surface-border'
                }`}
              />
              {errors.deadline && <p className="mt-1 text-xs text-red-400">{errors.deadline}</p>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-surface-raised hover:bg-surface-border border border-surface-border rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
