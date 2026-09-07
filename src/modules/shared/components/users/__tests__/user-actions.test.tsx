import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserActions } from '../user-actions';

const baseProps = { isActive: true, userLabel: 'Alice Dupont' };

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /actions pour alice dupont/i }));
}

describe('UserActions — réinitialisation 2FA', () => {
  it('masque l’action quand le handler n’est pas fourni', async () => {
    const user = userEvent.setup();
    render(<UserActions {...baseProps} onEdit={jest.fn()} onDelete={jest.fn()} />);

    await openMenu(user);

    expect(screen.queryByText(/réinitialiser le 2fa/i)).not.toBeInTheDocument();
  });

  it('affiche et déclenche l’action quand le handler est fourni', async () => {
    const user = userEvent.setup();
    const onResetTwoFactor = jest.fn();
    render(<UserActions {...baseProps} onEdit={jest.fn()} onResetTwoFactor={onResetTwoFactor} />);

    await openMenu(user);
    await user.click(screen.getByText(/réinitialiser le 2fa/i));

    expect(onResetTwoFactor).toHaveBeenCalledTimes(1);
  });
});
