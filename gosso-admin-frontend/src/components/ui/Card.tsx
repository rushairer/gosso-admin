import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`glass-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  if (children) {
    return <div className={`card-header ${className}`}>{children}</div>;
  }

  return (
    <div className={`card-header ${className}`}>
      <div className="card-title-group">
        {title && <h3 className="card-title">{title}</h3>}
        {description && <p className="card-description">{description}</p>}
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return <div className={`card-content ${flush ? 'flush' : ''} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}
