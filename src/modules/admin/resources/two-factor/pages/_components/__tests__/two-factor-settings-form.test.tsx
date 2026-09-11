import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TwoFactorSettings } from '../../../types';
import { TwoFactorSettingsForm } from '../two-factor-settings-form';

const EFFECTIVE = {
  enabled: false,
  code_length: 6,
  ttl_minutes: 10,
  resend_cooldown_seconds: 60,
  max_attempts: 5,
  lockout_threshold: 5,
  trusted_device_days: 30,
  template_mail_id: null,
};

/** Aucune surcharge : tous les champs sont hérités. */
const INHERITED_SETTINGS: TwoFactorSettings = {
  tenant_id: null,
  overrides: {
    enabled: null,
    code_length: null,
    ttl_minutes: null,
    resend_cooldown_seconds: null,
    max_attempts: null,
    lockout_threshold: null,
    trusted_device_days: null,
    template_mail_id: null,
  },
  effective: EFFECTIVE,
  updated_by: null,
  updated_at: null,
};

const save = () => screen.getByRole('button', { name: /enregistrer/i });

describe('TwoFactorSettingsForm — héritage', () => {
  it('affiche la valeur effective des champs hérités', () => {
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByText(/hérité : 10 minutes/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Durée de validité')).toBeDisabled();
  });

  it('envoie null pour chaque champ resté hérité', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(save());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ ttl_minutes: null, code_length: null }),
    );
  });

  it('envoie la valeur saisie une fois l’héritage désactivé', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByLabelText('Valeur par défaut', {
        selector: '#inherit-ttl_minutes',
      }),
    );

    fireEvent.change(screen.getByLabelText('Durée de validité'), {
      target: { value: '25' },
    });
    await user.click(save());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ ttl_minutes: 25 }));
  });
});

describe('TwoFactorSettingsForm — validation des bornes', () => {
  it('bloque l’envoi et signale une valeur hors bornes', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByLabelText('Valeur par défaut', {
        selector: '#inherit-code_length',
      }),
    );

    fireEvent.change(screen.getByLabelText('Longueur du code'), {
      target: { value: '99' },
    });
    await user.click(save());

    expect(await screen.findByText(/comprise entre 6 et 10/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('TwoFactorSettingsForm — portée', () => {
  it('masque le sélecteur de template au niveau global', () => {
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText(/template du mail otp/i)).not.toBeInTheDocument();
  });

  it('affiche le sélecteur de template au niveau tenant', () => {
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="tenant"
        templateMails={[
          {
            id: 't-1',
            reference: 'TM-1',
            name: 'Code de connexion',
            subject: 'Code',
            status: true,
          },
        ]}
        isSaving={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByLabelText(/template du mail otp/i)).toBeInTheDocument();
  });

  it('n’envoie template_mail_id que sur la portée tenant', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(save());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('template_mail_id');
  });
});

describe('TwoFactorSettingsForm — activation', () => {
  it('avertit quand le 2FA passe de désactivé à activé', async () => {
    const user = userEvent.setup();
    render(
      <TwoFactorSettingsForm
        settings={INHERITED_SETTINGS}
        scope="global"
        isSaving={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/activer la vérification/i));

    expect(await screen.findByRole('alert')).toHaveTextContent(/devront saisir un code/i);
  });

  it('n’avertit pas quand le 2FA était déjà actif', () => {
    render(
      <TwoFactorSettingsForm
        settings={{
          ...INHERITED_SETTINGS,
          effective: { ...EFFECTIVE, enabled: true },
        }}
        scope="global"
        isSaving={false}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
