import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { instanceSettingsService } from '../../services';
import InstanceSettingsTab from './InstanceSettingsTab';

vi.mock('../../services', () => ({
  instanceSettingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

const settings = {
  product_name: 'Acme Identity',
  logo_url: '',
  favicon_url: '',
  login_title: '',
  login_description: '',
  login_background_url: '',
};

describe('InstanceSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(instanceSettingsService.getSettings).mockResolvedValue(settings);
    vi.mocked(instanceSettingsService.updateSettings).mockImplementation(async (next) => next);
  });

  it('loads settings and saves the updated brand form', async () => {
    render(
      <ToastProvider>
        <InstanceSettingsTab />
      </ToastProvider>
    );
    expect(await screen.findByDisplayValue('Acme Identity')).toBeInTheDocument();

    const productName = screen.getByDisplayValue('Acme Identity');
    await userEvent.clear(productName);
    await userEvent.type(productName, 'Acme SSO');
    await userEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() =>
      expect(instanceSettingsService.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ product_name: 'Acme SSO' })
      )
    );
  });
});
