import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function Feedback({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const isError = type === 'error';
  return (
    <div className={`feedback feedback-${type}`}>
      {isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
      <div>{children}</div>
    </div>
  );
}
