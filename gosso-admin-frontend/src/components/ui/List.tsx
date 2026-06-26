import React from 'react';

export function ListStack({ children }: { children: React.ReactNode }) {
  return <div className="list-stack">{children}</div>;
}

export function ListRow({
  icon,
  title,
  meta,
  action,
  children,
}: {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="list-row">
      <div className="list-row-main">
        {icon && <span className="list-icon">{icon}</span>}
        {children || (
          <div>
            {title && <div className="list-title">{title}</div>}
            {meta && <div className="list-meta">{meta}</div>}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
