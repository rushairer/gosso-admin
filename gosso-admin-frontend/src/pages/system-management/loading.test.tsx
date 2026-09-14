import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteSettingsLoading, SystemCollectionLoading, SystemStatusLoading } from './loading';

describe('system management loading states', () => {
  it('keeps collection geometry visible without exposing placeholder table semantics', () => {
    const { container } = render(
      <SystemCollectionLoading
        label="Loading clients"
        rows={2}
        showPagination
        columns={[
          { header: 'Name', skeletonClassName: 'h-4 w-40' },
          { header: 'Type', skeletonClassName: 'h-4 w-20' },
          { header: 'Actions', skeletonClassName: 'h-8 w-20', align: 'right' },
        ]}
      />
    );

    const loading = screen.getByRole('status', { name: 'Loading clients' });
    expect(loading).toHaveAttribute('data-layout', 'collection');
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading.querySelectorAll('[data-slot="table-head"]')).toHaveLength(3);
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(6);
  });

  it('preserves the settings form and preview silhouettes', () => {
    const { container } = render(<SiteSettingsLoading label="Loading settings" />);

    expect(screen.getByRole('status', { name: 'Loading settings' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(10);
  });

  it('preserves system statistic and definition surfaces', () => {
    const { container } = render(<SystemStatusLoading label="Loading system status" />);

    expect(screen.getByRole('status', { name: 'Loading system status' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(12);
  });
});
