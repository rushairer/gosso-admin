import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from '../Home';

const { redirectToAuthorize } = vi.hoisted(() => ({
  redirectToAuthorize: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../auth', () => ({
  gossoClient: {
    getUserProfile: vi.fn(),
    isAdmin: vi.fn(() => false),
    isLoggedIn: vi.fn(() => false),
  },
  redirectToAuthorize,
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('management overview authentication', () => {
  it('returns root-entry authentication to the overview, not system management', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/'));
    expect(redirectToAuthorize).not.toHaveBeenCalledWith('/system-management');
  });
});
