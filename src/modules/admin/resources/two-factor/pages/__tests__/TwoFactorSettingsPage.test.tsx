import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TwoFactorSettings } from '../../types';
import { TwoFactorSettingsPage } from '../TwoFactorSettingsPage';

const GLOBAL_SETTINGS: TwoFactorSettings = {
  tenant_id: null,
  overrides: {
    enabled: true,
    code_length: null,
    ttl_minutes: null,
    resend_cooldown_seconds: null,
    max_attempts: null,
    lockout_threshold: null,
    trusted_device_days: null,
    template_mail_id: null,
  },
  effective: {
    enabled: true,
    code_length: 6,
    ttl_minutes: 10,
    resend_cooldown_seconds: 60,
    max_attempts: 5,
    lockout_threshold: 5,
    trusted_device_days: 30,
    template_mail_id: null,
  },
  updated_at: null,
  updated_by: null,
};

let mockGlobalSettings: TwoFactorSettings | undefined;
let mockTenantSettings: TwoFactorSettings;
const mockUpdateTenant = jest.fn();

jest.mock('../../hooks/useTwoFactorSettings', () => ({
  useGlobalTwoFactorSettings: () => ({
    data: mockGlobalSettings ? { data: mockGlobalSettings } : undefined,
    isLoading: !mockGlobalSettings,
  }),
  useTenantTwoFactorSettings: () => ({ data: { data: mockTenantSettings } }),
  useTenantTemplateMails: () => ({ data: { data: [] } }),
  useUpdateGlobalTwoFactorSettings: () => ({ isPending: false, mutate: jest.fn() }),
  useUpdateTenantTwoFactorSettings: () => ({ isPending: false, mutate: mockUpdateTenant }),
}));

jest.mock('@/modules/admin/resources/tenants/hooks/useTenantsQuery', () => ({
  useTenants: () => ({ data: { data: [{ id: 'tenant-1', name: 'Tenant test' }] } }),
}));

async function selectTenant(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Par tenant' }));
  await user.click(screen.getByRole('combobox', { name: 'Tenant' }));
  await user.click(screen.getByRole('option', { name: 'Tenant test' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGlobalSettings = GLOBAL_SETTINGS;
  mockTenantSettings = {
    ...GLOBAL_SETTINGS,
    tenant_id: 'tenant-1',
    overrides: { ...GLOBAL_SETTINGS.overrides, enabled: null },
  };
});

describe('TwoFactorSettingsPage activation inheritance', () => {
  it('allows disabling and re-enabling inheritance without locking the switch', async () => {
    const user = userEvent.setup();
    render(<TwoFactorSettingsPage />);
    await selectTenant(user);

    const inheritance = screen.getByRole('switch', { name: /H.riter de l.activation globale/i });
    const activation = screen.getByRole('switch', { name: /Activer la v.rification/i });
    expect(inheritance).toBeChecked();
    expect(activation).toBeDisabled();

    await user.click(inheritance);

    expect(inheritance).not.toBeChecked();
    expect(inheritance).toBeEnabled();
    expect(activation).toBeEnabled();

    await user.click(activation);
    expect(activation).not.toBeChecked();
    await user.click(inheritance);

    expect(inheritance).toBeChecked();
    expect(activation).toBeChecked();
    expect(activation).toBeDisabled();
  });

  it.each([true, false])(
    'restores global activation %s and saves a null override',
    async (enabled) => {
      mockGlobalSettings = {
        ...GLOBAL_SETTINGS,
        overrides: { ...GLOBAL_SETTINGS.overrides, enabled },
        effective: { ...GLOBAL_SETTINGS.effective, enabled },
      };
      mockTenantSettings = {
        ...mockTenantSettings,
        overrides: { ...mockTenantSettings.overrides, enabled: !enabled },
        effective: { ...mockTenantSettings.effective, enabled: !enabled },
      };
      const user = userEvent.setup();
      render(<TwoFactorSettingsPage />);
      await selectTenant(user);

      const inheritance = screen.getByRole('switch', { name: /H.riter de l.activation globale/i });
      expect(inheritance).toBeEnabled();
      await user.click(inheritance);

      expect(inheritance).toBeChecked();
      expect(screen.getByRole('switch', { name: /Activer la v.rification/i })).toHaveAttribute(
        'aria-checked',
        String(enabled),
      );
      await user.click(screen.getByRole('button', { name: /Enregistrer/i }));
      expect(mockUpdateTenant).toHaveBeenCalledWith(expect.objectContaining({ enabled: null }));
    },
  );

  it('enables restoring inheritance when global settings finish loading', async () => {
    mockGlobalSettings = undefined;
    mockTenantSettings = {
      ...mockTenantSettings,
      overrides: { ...mockTenantSettings.overrides, enabled: false },
      effective: { ...mockTenantSettings.effective, enabled: false },
    };
    const user = userEvent.setup();
    const { rerender } = render(<TwoFactorSettingsPage />);
    await selectTenant(user);

    const inheritance = screen.getByRole('switch', { name: /H.riter de l.activation globale/i });
    expect(inheritance).toBeDisabled();

    mockGlobalSettings = GLOBAL_SETTINGS;
    rerender(<TwoFactorSettingsPage />);

    expect(inheritance).toBeEnabled();
    await user.click(inheritance);
    expect(inheritance).toBeChecked();
    expect(screen.getByRole('switch', { name: /Activer la v.rification/i })).toBeChecked();
  });
});
