import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type FeedbackType = 'error' | 'success' | 'warning' | 'info';

export function Feedback({ type, children }: { type: FeedbackType; children: React.ReactNode }) {
  const isError = type === 'error';
  return (
    <div className={`feedback feedback-${type}`} role={isError ? 'alert' : 'status'}>
      {type === 'error' || type === 'warning' ? (
        <AlertTriangle size={18} />
      ) : type === 'info' ? (
        <Info size={18} />
      ) : (
        <CheckCircle size={18} />
      )}
      <div>{children}</div>
    </div>
  );
}
