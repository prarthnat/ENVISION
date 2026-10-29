import React from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  warningNote,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useDialogAccessibility(isOpen, onCancel, isLoading);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      tabIndex={-1}
      ref={dialogRef}
    >
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-950/50 border border-red-800/40 text-red-400 rounded-lg flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3
              id="confirm-modal-title"
              className="text-lg font-semibold text-gray-100"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              {message}
            </p>
            {warningNote && (
              <div className="mt-3 p-3 bg-amber-950/40 border border-amber-800/30 rounded-lg text-xs text-amber-300">
                  <span aria-hidden="true">⚠️ </span>{warningNote}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            data-autofocus
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-surface-raised hover:bg-surface-border border border-surface-border rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
