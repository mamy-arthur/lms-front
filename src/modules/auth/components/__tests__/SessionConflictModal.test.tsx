import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionConflictModal } from '../SessionConflictModal';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const EXISTING_SESSION = {
  deviceName: 'PC (Windows)',
  browser: 'Chrome',
  lastActivityAt: '2026-08-25T10:30:00Z',
};

describe('SessionConflictModal', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onConfirm.mockResolvedValue(undefined);
  });

  function renderModal(isOpen = true) {
    return render(
      <SessionConflictModal
        isOpen={isOpen}
        existingSession={EXISTING_SESSION}
        replacementToken="replace-token-abc"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
  }

  it("n'affiche rien quand isOpen est false", () => {
    renderModal(false);
    expect(screen.queryByText('Session déjà active')).not.toBeInTheDocument();
  });

  it('affiche les informations de la session existante', () => {
    renderModal();
    expect(screen.getByText('Session déjà active')).toBeInTheDocument();
    expect(screen.getByText('PC (Windows)')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
  });

  it('appelle onCancel au clic sur Annuler sans appeler onConfirm', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('appelle onConfirm avec le replacement_token au clic sur confirmer', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /me connecter sur cet appareil/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('replace-token-abc'));
  });

  it('affiche un loader pendant la confirmation', async () => {
    const user = userEvent.setup();
    onConfirm.mockImplementation(() => new Promise(() => {})); // never resolves
    renderModal();
    await user.click(screen.getByRole('button', { name: /me connecter sur cet appareil/i }));
    await waitFor(() => expect(screen.getByText(/connexion/i)).toBeInTheDocument());
  });

  it('désactive le bouton Annuler pendant le chargement', async () => {
    const user = userEvent.setup();
    onConfirm.mockImplementation(() => new Promise(() => {}));
    renderModal();
    await user.click(screen.getByRole('button', { name: /me connecter sur cet appareil/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled());
  });
});
