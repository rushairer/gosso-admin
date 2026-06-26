import React from 'react';

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="data-table-wrap">
      <table className="admin-table">{children}</table>
    </div>
  );
}
