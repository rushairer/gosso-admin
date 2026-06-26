import React from 'react';

export function DefinitionList({ children }: { children: React.ReactNode }) {
  return <div className="definition-list">{children}</div>;
}

export function DefinitionRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="definition-row">
      <div className="definition-label">{label}</div>
      <div className="definition-value" style={mono ? { fontFamily: 'monospace' } : undefined}>
        {children}
      </div>
    </div>
  );
}
