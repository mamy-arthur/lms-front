import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import { authApi } from '@/shared/api/auth.api';
import styles from '../client-login.module.css';

jest.mock('@/shared/api/auth.api', () => ({
  authApi: {
    forgotPassword: jest.fn(),
    platformForgotPassword: jest.fn(),
  },
}));

jest.mock('@/shared/hooks/useTenant', () => ({
  useTenant: () => ({
    tenantName: 'Acme Formation',
    branding: { logo_url: 'https://assets.example.test/acme.svg' },
  }),
}));

const mockForgotPassword = jest.mocked(authApi.forgotPassword);
const EMAIL = 'alice@example.com';

async function submitEmail(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Adresse email'), EMAIL);
  await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
}

describe('Page client de mot de passe oublié', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockForgotPassword.mockResolvedValue({ message: 'Email envoyé' });
  });

  it('réutilise le cadre, le logo, le visuel et les styles du login', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('main')).toHaveClass(styles.page);
    expect(screen.getByRole('complementary')).toHaveAccessibleName(
      'Chaque jour, un peu plus loin.',
    );
    expect(screen.getByText('Acme Formation')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acme Formation' })).toHaveAttribute(
      'src',
      'https://assets.example.test/acme.svg',
    );
    expect(screen.getByRole('region', { name: 'Mot de passe oublié' })).toHaveClass(styles.form);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass(styles.formTitle);
    expect(
      screen.getByText('Entrez votre email pour recevoir un lien de réinitialisation.'),
    ).toHaveClass(styles.formSubtitle);
    const email = screen.getByLabelText('Adresse email');
    expect(email).toHaveClass(styles.fieldInput);
    expect(email.closest('form')).toHaveClass(styles.fields);
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(email).toHaveAttribute('inputmode', 'email');
    expect(screen.getByRole('button', { name: 'Envoyer le lien' })).toHaveClass(styles.submit);
    expect(screen.getByRole('link', { name: 'Retour à la connexion' })).toHaveClass(
      styles.textLink,
    );
    expect(screen.getByRole('link', { name: 'Retour à la connexion' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it.each(['', 'adresse-invalide'])(
    'refuse un email invalide (%s) avant tout appel API',
    async (email) => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      if (email) await user.type(screen.getByLabelText('Adresse email'), email);
      await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Email invalide');
      expect(screen.getByLabelText('Adresse email')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Adresse email')).toHaveAccessibleDescription('Email invalide');
      expect(mockForgotPassword).not.toHaveBeenCalled();
    },
  );

  it('envoie la demande client et garde le cadre et le retour après confirmation', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await submitEmail(user);

    expect(await screen.findByRole('status')).toHaveTextContent(EMAIL);
    expect(mockForgotPassword).toHaveBeenCalledTimes(1);
    expect(mockForgotPassword).toHaveBeenCalledWith(EMAIL);
    expect(authApi.platformForgotPassword).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Envoyer le lien' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass(styles.page);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mot de passe oublié');
    expect(screen.getByRole('img', { name: 'Acme Formation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à la connexion' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('garde le bouton désactivé et son style pendant l’envoi', async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: Awaited<ReturnType<typeof authApi.forgotPassword>>) => void;
    mockForgotPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<ForgotPasswordPage />);
    await submitEmail(user);

    const button = screen.getByRole('button', { name: 'Envoi...' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(styles.submit);
    await user.click(button);
    expect(mockForgotPassword).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveRequest({ message: 'Email envoyé' });
    });
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it.each([
    [new TypeError('Failed to fetch'), /impossible de joindre le serveur/i],
    [Object.assign(new Error('Unavailable'), { status: 503 }), /momentanément indisponible/i],
    [
      Object.assign(new Error('Throttled'), {
        status: 429,
        headers: new Headers({ 'Retry-After': '120' }),
      }),
      /2 minutes/i,
    ],
  ])('préserve les erreurs API et permet de réessayer (%s)', async (error, message) => {
    const user = userEvent.setup();
    mockForgotPassword.mockRejectedValueOnce(error);
    render(<ForgotPasswordPage />);
    await submitEmail(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Adresse email')).toHaveValue(EMAIL);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Envoyer le lien' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    expect(await screen.findByRole('status')).toHaveTextContent(EMAIL);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockForgotPassword).toHaveBeenCalledTimes(2);
  });
});
