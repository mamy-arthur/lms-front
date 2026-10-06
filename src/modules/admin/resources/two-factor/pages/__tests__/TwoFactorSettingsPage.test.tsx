import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TenantTemplateMail, TwoFactorSettings } from '../../types';
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
const mockRefetchTemplates = jest.fn();
let mockTemplateMailsQuery: {
  data?: { data: TenantTemplateMail[] };
  isLoading: boolean;
  isError: boolean;
  refetch: typeof mockRefetchTemplates;
};

jest.mock('../../hooks/useTwoFactorSettings', () => ({
  useGlobalTwoFactorSettings: () => ({
    data: mockGlobalSettings ? { data: mockGlobalSettings } : undefined,
    isLoading: !mockGlobalSettings,
  }),
  useTenantTwoFactorSettings: () => ({ data: { data: mockTenantSettings } }),
  useTenantTemplateMails: () => mockTemplateMailsQuery,
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
  mockTemplateMailsQuery = {
    data: { data: [] },
    isLoading: false,
    isError: false,
    refetch: mockRefetchTemplates,
  };
  mockGlobalSettings = GLOBAL_SETTINGS;
  mockTenantSettings = {
    ...GLOBAL_SETTINGS,
    tenant_id: 'tenant-1',
    overrides: { ...GLOBAL_SETTINGS.overrides, enabled: null },
  };
});

describe('TwoFactorSettingsPage — héritage de l’activation', () => {
  it('permet de désactiver puis de réactiver l’héritage sans verrouiller l’interrupteur', async () => {
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
    'rétablit l’activation globale %s et enregistre une surcharge nulle',
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

  it('permet de rétablir l’héritage après le chargement des paramètres globaux', async () => {
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

describe('TwoFactorSettingsPage — modèles d’e-mail', () => {
  it('désactive le sélecteur pendant le chargement puis permet de choisir un modèle', async () => {
    mockTemplateMailsQuery = { ...mockTemplateMailsQuery, data: undefined, isLoading: true };
    const user = userEvent.setup();
    const { rerender } = render(<TwoFactorSettingsPage />);
    await selectTenant(user);

    expect(screen.getByText('Chargement des modèles…')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('combobox', { name: 'Modèle de l’e-mail' })).toBeDisabled();
    expect(screen.queryByText(/aucun modèle personnalisé disponible/i)).not.toBeInTheDocument();

    mockTemplateMailsQuery = {
      ...mockTemplateMailsQuery,
      isLoading: false,
      data: {
        data: [
          {
            id: 'template-1',
            name: 'Code de connexion',
            reference: null,
            subject: 'Code',
            status: true,
          },
        ],
      },
    };
    rerender(<TwoFactorSettingsPage />);

    expect(screen.queryByText('Chargement des modèles…')).not.toBeInTheDocument();
    const selector = screen.getByRole('combobox', { name: 'Modèle de l’e-mail' });
    expect(selector).toBeEnabled();
    await user.click(selector);
    await user.click(screen.getByRole('option', { name: 'Code de connexion' }));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(mockUpdateTenant).toHaveBeenCalledWith(
      expect.objectContaining({ template_mail_id: 'template-1' }),
    );
  });

  it('affiche l’erreur et relance la requête sans la confondre avec une liste vide', async () => {
    mockTemplateMailsQuery = { ...mockTemplateMailsQuery, data: undefined, isError: true };
    const user = userEvent.setup();
    const { rerender } = render(<TwoFactorSettingsPage />);
    await selectTenant(user);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Impossible de charger les modèles d’e-mail.',
    );
    expect(screen.getByRole('combobox', { name: 'Modèle de l’e-mail' })).toBeDisabled();
    expect(screen.queryByText(/aucun modèle personnalisé disponible/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mockRefetchTemplates).toHaveBeenCalledTimes(1);

    mockTemplateMailsQuery = { ...mockTemplateMailsQuery, data: { data: [] }, isError: false };
    rerender(<TwoFactorSettingsPage />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Modèle de l’e-mail' })).toBeEnabled();
    expect(screen.getByText(/aucun modèle personnalisé disponible/i)).toBeInTheDocument();
  });
});
