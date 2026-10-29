import React from 'react';
import { ProjectStatus, TaskStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-surface-border text-gray-300 border-surface-border';
  let dotStyle = 'bg-gray-400';

  switch (status) {
    case 'Active':
      badgeStyle = 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50';
      dotStyle = 'bg-indigo-400';
      break;
    case 'Completed':
      badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      dotStyle = 'bg-emerald-400';
      break;
    case 'On Hold':
      badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      dotStyle = 'bg-amber-400';
      break;
    case 'In Progress':
      badgeStyle = 'bg-sky-950/60 text-sky-300 border-sky-700/50';
      dotStyle = 'bg-sky-400';
      break;
    case 'Pending':
      badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
      dotStyle = 'bg-slate-400';
      break;
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${badgeStyle}`}
      aria-label={`Status: ${status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      <span>{status}</span>
    </span>
  );
};
