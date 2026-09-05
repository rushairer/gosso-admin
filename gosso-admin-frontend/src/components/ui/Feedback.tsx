import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type FeedbackType = 'error' | 'success' | 'warning' | 'info';

export function Feedback({
  type,
  children,
  className = '',
}: {
  type: FeedbackType;
  children: React.ReactNode;
  className?: string;
}) {
  const isError = type === 'error';
  return (
    <div
      className={cn(
        'feedback',
        `feedback-${type}`,
        'flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors',
        type === 'error' && 'border-red-500/30 bg-red-950/30 text-red-200',
        type === 'success' && 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200',
        type === 'warning' && 'border-amber-500/30 bg-amber-950/30 text-amber-200',
        type === 'info' && 'border-sky-500/30 bg-sky-950/30 text-sky-200',
        className
      )}
      role={isError ? 'alert' : 'status'}
    >
      <span className="shrink-0">
        {type === 'error' || type === 'warning' ? (
          <AlertTriangle className="h-5 w-5" />
        ) : type === 'info' ? (
          <Info className="h-5 w-5" />
        ) : (
          <CheckCircle className="h-5 w-5" />
        )}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
