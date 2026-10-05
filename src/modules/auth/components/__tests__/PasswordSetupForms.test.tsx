import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from '@/shared/api/auth.api';
import { ActivateAccountForm } from '../ActivateAccountForm';
import { ResetPasswordForm } from '../ResetPasswordForm';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/shared/api/auth.api', () => ({
  authApi: { activateAccount: jest.fn(), resetPassword: jest.fn() },
}));

const email = 'alice@example.test';
const token = 'test-token';
const password = 'Password123';

describe.each([
  {
    name: 'reset',
    Form: ResetPasswordForm,
    request: jest.mocked(authApi.resetPassword),
    passwordLabel: 'Nouveau mot de passe',
    submitLabel: /initialiser le mot de passe/,
    redirect: '/login?reset=1',
    recovery: '/forgot-password',
  },
  {
    name: 'activation',
    Form: ActivateAccountForm,
    request: jest.mocked(authApi.activateAccount),
    passwordLabel: 'Mot de passe',
    submitLabel: /Activer mon compte/,
    redirect: '/login?activated=1',
    recovery: '/login',
  },
])('$name form', ({ Form, request, passwordLabel, submitLabel, redirect, recovery }) => {
  beforeEach(() => jest.resetAllMocks());

  async function fill(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(passwordLabel, { exact: true }), password);
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), password);
  }

  it('toggles each password independently without submitting', async () => {
    const user = userEvent.setup();
    render(<Form email={email} token={token} />);
    await fill(user);

    for (const [label, show, hide] of [
      [passwordLabel, 'Afficher le mot de passe', 'Masquer le mot de passe'],
      ['Confirmer le mot de passe', 'Afficher la confirmation', 'Masquer la confirmation'],
    ]) {
      const input = screen.getByLabelText(label, { exact: true });
      expect(input).toHaveAttribute('type', 'password');
      await user.click(screen.getByRole('button', { name: show }));
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveValue(password);
      expect(screen.getByRole('button', { name: hide })).toHaveAttribute('aria-pressed', 'true');
      await user.click(screen.getByRole('button', { name: hide }));
      expect(input).toHaveAttribute('type', 'password');
    }
    expect(request).not.toHaveBeenCalled();
  });

  it('preserves the payload and redirect and disables submission while pending', async () => {
    let finish!: (value: { message: string }) => void;
    request.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<Form email={email} token={token} />);
    await fill(user);
    const submit = screen.getByRole('button', { name: submitLabel });
    await user.click(submit);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      email,
      token,
      password,
      password_confirmation: password,
    });
    expect(submit).toBeDisabled();
    expect(mockReplace).not.toHaveBeenCalled();
    await act(async () => {
      finish({ message: 'ok' });
    });
    expect(mockReplace).toHaveBeenCalledWith(redirect);
  });

  it('associates validation errors with their fields', async () => {
    const user = userEvent.setup();
    render(<Form email={email} token={token} />);
    await user.click(screen.getByRole('button', { name: submitLabel }));

    const input = screen.getByLabelText(passwordLabel, { exact: true });
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(input).toHaveAccessibleDescription('Minimum 8 caract\u00e8res');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(request).not.toHaveBeenCalled();
  });

  it('replaces an expired link with an alert and the correct recovery link', async () => {
    request.mockRejectedValue({
      status: 422,
      json: { error_code: 'password_reset.invalid_token', errors: { token: ['Lien invalide'] } },
    });
    const user = userEvent.setup();
    render(<Form email={email} token={token} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: submitLabel }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalide/);
    expect(screen.queryByLabelText(passwordLabel, { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', recovery);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
