/**
 * Tests fonctionnels — ActivateAccountForm
 *
 * Point de vue utilisateur : saisie, validation client, puis réaction aux
 * différentes réponses de `POST auth/activate-account`.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivateAccountForm } from '../ActivateAccountForm';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Le module réel chargerait apiClient (et sa chaîne de dépendances ESM).
jest.mock('@/shared/api/auth.api', () => ({
  authApi: { activateAccount: jest.fn() },
}));

import { authApi } from '@/shared/api/auth.api';

const mockActivateAccount = jest.mocked(authApi.activateAccount);

const EMAIL = 'alice@example.com';
const TOKEN = 'activation-token';
const VALID_PASSWORD = 'Password123';

/** Reproduit l'erreur levée par httpClient. */
function apiError(status: number, json: unknown): unknown {
  return Object.assign(new Error('Error'), {
    status,
    headers: new Headers(),
    body: JSON.stringify(json),
    json,
  });
}

function renderForm() {
  return render(<ActivateAccountForm email={EMAIL} token={TOKEN} />);
}

async function fillAndSubmit(password = VALID_PASSWORD, confirmation = password) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Mot de passe'), password);
  await user.type(screen.getByLabelText('Confirmer le mot de passe'), confirmation);
  await user.click(screen.getByRole('button', { name: /activer mon compte/i }));
}

describe('ActivateAccountForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pré-remplit l’email en lecture seule', () => {
    renderForm();

    const email = screen.getByLabelText('Adresse email');

    expect(email).toHaveValue(EMAIL);
    expect(email).toHaveAttribute('readonly');
  });

  it('refuse un mot de passe qui ne respecte pas la politique', async () => {
    renderForm();
    await fillAndSubmit('court');

    expect(await screen.findByText('Minimum 8 caractères')).toBeInTheDocument();
    expect(mockActivateAccount).not.toHaveBeenCalled();
  });

  it('refuse une confirmation différente', async () => {
    renderForm();
    await fillAndSubmit(VALID_PASSWORD, 'Password456');

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    expect(mockActivateAccount).not.toHaveBeenCalled();
  });

  it('soumet le jeton et l’email, puis redirige vers la connexion', async () => {
    mockActivateAccount.mockResolvedValue({ message: 'ok' });

    renderForm();
    await fillAndSubmit();

    await waitFor(() =>
      expect(mockActivateAccount).toHaveBeenCalledWith({
        email: EMAIL,
        token: TOKEN,
        password: VALID_PASSWORD,
        password_confirmation: VALID_PASSWORD,
      }),
    );

    expect(mockReplace).toHaveBeenCalledWith('/login?activated=1');
  });

  it('remplace le formulaire par un avertissement quand le jeton est refusé', async () => {
    mockActivateAccount.mockRejectedValue(
      apiError(422, { message: 'Lien invalide', errors: { token: ['Lien invalide'] } }),
    );

    renderForm();
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/administrateur/i);
    expect(screen.queryByLabelText('Mot de passe')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('affiche un message dédié quand l’API impose un délai', async () => {
    mockActivateAccount.mockRejectedValue(apiError(429, { message: 'Trop de demandes' }));

    renderForm();
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/trop de demandes/i);
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
  });

  it('laisse le formulaire soumettable après une erreur réseau', async () => {
    mockActivateAccount.mockRejectedValue(new Error('Failed to fetch'));

    renderForm();
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(/connexion/i);
    expect(screen.getByRole('button', { name: /activer mon compte/i })).toBeEnabled();
  });
});
