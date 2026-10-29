import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, CreateTaskInput } from '../types';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface TaskFormModalProps {
  isOpen: boolean;
  taskToEdit?: Task | null;
  projectTitle: string;
  isLoading: boolean;
  onSubmit: (data: CreateTaskInput) => void;
  onClose: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  taskToEdit,
  projectTitle,
  isLoading,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useDialogAccessibility(isOpen, onClose, isLoading);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
    } else {
      setTitle('');
      setDescription('');
      setStatus('Pending');
    }
    setErrors({});
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Task title is required';
    } else if (title.trim().length > 300) {
      errs.title = 'Title must be 300 characters or fewer';
    }

    if (description && description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer';
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
    });
  };

  const isEditing = !!taskToEdit;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      tabIndex={-1}
      ref={dialogRef}
    >
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 id="task-modal-title" className="text-lg font-semibold text-gray-100">
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
              Project: <span className="text-indigo-400">{projectTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
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
            <label htmlFor="task-title" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              aria-required="true"
              maxLength={300}
              data-autofocus
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage mockup in Figma"
              className={`w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.title ? 'border-red-500' : 'border-surface-border'
              }`}
            />
            {errors.title && <p id="task-title-error" className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Description <span className="text-gray-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="task-desc"
              rows={3}
              maxLength={2000}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'task-description-error' : undefined}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide actionable requirements or acceptance criteria..."
              className={`w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-surface-border'
              }`}
            />
            {errors.description && <p id="task-description-error" className="mt-1 text-xs text-red-400">{errors.description}</p>}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="task-status" className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Actions */}
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
                'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
