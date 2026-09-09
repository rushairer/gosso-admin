import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConsentListLoading } from './UserConsentsModal';

describe('ConsentListLoading', () => {
  it('preserves the consent row silhouette while loading', () => {
    const { container } = render(<ConsentListLoading label="Loading consents" />);

    expect(screen.getByRole('status', { name: 'Loading consents' })).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(12);
  });
});
