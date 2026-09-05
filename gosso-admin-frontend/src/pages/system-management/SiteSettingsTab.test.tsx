import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@gouno/ui';
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
      <MemoryRouter>
        <ToastProvider>
          <SiteSettingsTab />
        </ToastProvider>
      </MemoryRouter>
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

  it('renders the real login surface and updates its desktop and mobile previews from draft values', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <SiteSettingsTab />
        </ToastProvider>
      </MemoryRouter>
    );

    const productName = await screen.findByDisplayValue('Acme Identity');
    const loginTitle = screen.getByPlaceholderText('Acme Identity');
    await userEvent.type(loginTitle, 'Welcome to Acme');

    expect(screen.getByRole('heading', { name: 'Welcome to Acme', hidden: true })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByText('1440 × 900')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /mobile/i }));
    expect(screen.getByText('390 × 844')).toBeInTheDocument();
    expect(productName).toHaveValue('Acme Identity');
  });

  it('previews and saves a base64 login background image', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <SiteSettingsTab />
        </ToastProvider>
      </MemoryRouter>
    );

    await screen.findByDisplayValue('Acme Identity');
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const backgroundField = screen.getByLabelText(/login background url/i);
    await userEvent.type(backgroundField, dataUrl);

    const loginSurface = document.querySelector('.login-preview .login-surface') as HTMLElement | null;
    expect(loginSurface?.style.backgroundImage).toContain(dataUrl);

    await userEvent.click(screen.getByRole('button', { name: /save settings/i }));
    await waitFor(() =>
      expect(siteSettingsService.updateSiteSettings).toHaveBeenCalledWith(
        expect.objectContaining({ login_background_url: dataUrl })
      )
    );
  });
});
