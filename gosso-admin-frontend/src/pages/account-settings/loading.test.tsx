import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MfaLoadingContent, PasskeysLoading, SessionsLoading } from './loading';

describe('account settings loading states', () => {
  it('renders an MFA content skeleton inside the existing section', () => {
    const { container } = render(<MfaLoadingContent label="Loading MFA" />);

    expect(screen.getByRole('status', { name: 'Loading MFA' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });

  it('preserves the passkey list silhouette', () => {
    const { container } = render(<PasskeysLoading label="Loading passkeys" rows={2} />);

    expect(screen.getByRole('status', { name: 'Loading passkeys' })).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(6);
  });

  it('preserves session table headers while rows are loading', () => {
    render(
      <SessionsLoading
        label="Loading sessions"
        rows={2}
        headers={[
          { label: 'Device' },
          { label: 'IP address' },
          { label: 'Last active' },
          { label: 'Actions', align: 'right' },
        ]}
      />
    );

    expect(screen.getByRole('status', { name: 'Loading sessions' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });
});
