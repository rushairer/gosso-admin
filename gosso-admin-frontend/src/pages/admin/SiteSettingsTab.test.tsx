import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { siteSettingsService } from '../../services';
import SiteSettingsTab from './SiteSettingsTab';

vi.mock('../../services', () => ({
  siteSettingsService: {
    getSiteSettings: vi.fn(),
    updateSiteSettings: vi.fn(),
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

describe('SiteSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(siteSettingsService.getSiteSettings).mockResolvedValue(settings);
    vi.mocked(siteSettingsService.updateSiteSettings).mockImplementation(async (next) => next);
  });

  it('loads settings and saves the updated brand form', async () => {
    render(
      <ToastProvider>
        <SiteSettingsTab />
      </ToastProvider>
    );
    expect(await screen.findByDisplayValue('Acme Identity')).toBeInTheDocument();

    const productName = screen.getByDisplayValue('Acme Identity');
    await userEvent.clear(productName);
    await userEvent.type(productName, 'Acme SSO');
    await userEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() =>
      expect(siteSettingsService.updateSiteSettings).toHaveBeenCalledWith(
        expect.objectContaining({ product_name: 'Acme SSO' })
      )
    );
  });
});
