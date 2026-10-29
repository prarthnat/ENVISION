import React from 'react';

export const MetricCardSkeleton: React.FC = () => (
  <div className="p-5 bg-surface-card border border-surface-border rounded-xl animate-pulse">
    <div className="h-4 w-24 bg-surface-muted rounded mb-3" />
    <div className="h-8 w-16 bg-surface-muted rounded mb-2" />
    <div className="h-3 w-32 bg-surface-muted rounded" />
  </div>
);

export const ProjectCardSkeleton: React.FC = () => (
  <div className="p-5 bg-surface-card border border-surface-border rounded-xl animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-5 w-40 bg-surface-muted rounded" />
      <div className="h-5 w-16 bg-surface-muted rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-3.5 w-full bg-surface-muted rounded" />
      <div className="h-3.5 w-3/4 bg-surface-muted rounded" />
    </div>
    <div className="pt-2 border-t border-surface-border flex items-center justify-between">
      <div className="h-3 w-24 bg-surface-muted rounded" />
      <div className="h-3 w-20 bg-surface-muted rounded" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <div className="p-4 border-b border-surface-border flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-4 h-4 bg-surface-muted rounded" />
      <div className="space-y-1.5 flex-1 max-w-md">
        <div className="h-4 w-48 bg-surface-muted rounded" />
        <div className="h-3 w-64 bg-surface-muted rounded" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="h-5 w-20 bg-surface-muted rounded-full" />
      <div className="h-7 w-16 bg-surface-muted rounded" />
    </div>
  </div>
);
