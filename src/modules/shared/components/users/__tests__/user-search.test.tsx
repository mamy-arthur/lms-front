/**
 * Tests fonctionnels — UserSearch
 *
 * Couvre :
 *  - pas d'appel onSearch au montage initial (guard isMounted)
 *  - déclenchement après le délai de debounce sur changement de valeur
 *  - annulation du timer sur changement rapide (un seul appel attendu)
 *  - déclenchement immédiat sur touche Entrée
 *  - pas d'appel après démontage (cleanup)
 *  - prop debounceMs personnalisable
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSearch } from '../user-search';

describe('UserSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ── Guard montage ─────────────────────────────────────────────────────────

  it("n'appelle pas onSearch au montage initial", () => {
    const onSearch = jest.fn();
    render(<UserSearch value="" onChange={jest.fn()} onSearch={onSearch} />);

    jest.runAllTimers();
    expect(onSearch).not.toHaveBeenCalled();
  });

  // ── Debounce sur changement de valeur ─────────────────────────────────────

  it('appelle onSearch après le délai par défaut (400 ms) lors du changement de valeur', () => {
    const onSearch = jest.fn();
    const { rerender } = render(<UserSearch value="" onChange={jest.fn()} onSearch={onSearch} />);

    rerender(<UserSearch value="alice" onChange={jest.fn()} onSearch={onSearch} />);

    expect(onSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("n'appelle onSearch qu'une seule fois sur changements rapides (dernier gagne)", () => {
    const onSearch = jest.fn();
    const { rerender } = render(<UserSearch value="" onChange={jest.fn()} onSearch={onSearch} />);

    rerender(<UserSearch value="a" onChange={jest.fn()} onSearch={onSearch} />);
    jest.advanceTimersByTime(100);
    rerender(<UserSearch value="al" onChange={jest.fn()} onSearch={onSearch} />);
    jest.advanceTimersByTime(100);
    rerender(<UserSearch value="ali" onChange={jest.fn()} onSearch={onSearch} />);
    jest.advanceTimersByTime(400);

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  // ── Touche Entrée ─────────────────────────────────────────────────────────

  it('appelle onSearch immédiatement sur pression de la touche Entrée', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSearch = jest.fn();

    render(<UserSearch value="alice" onChange={jest.fn()} onSearch={onSearch} />);
    await user.click(screen.getByRole('textbox', { name: 'Rechercher' }));
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  // ── Cleanup après démontage ───────────────────────────────────────────────

  it("n'appelle pas onSearch après démontage", () => {
    const onSearch = jest.fn();
    const { rerender, unmount } = render(
      <UserSearch value="" onChange={jest.fn()} onSearch={onSearch} />,
    );

    rerender(<UserSearch value="alice" onChange={jest.fn()} onSearch={onSearch} />);
    unmount();
    jest.runAllTimers();

    expect(onSearch).not.toHaveBeenCalled();
  });

  // ── debounceMs personnalisable ────────────────────────────────────────────

  it('respecte un debounceMs personnalisé', () => {
    const onSearch = jest.fn();
    const { rerender } = render(
      <UserSearch value="" onChange={jest.fn()} onSearch={onSearch} debounceMs={800} />,
    );

    rerender(
      <UserSearch value="alice" onChange={jest.fn()} onSearch={onSearch} debounceMs={800} />,
    );

    jest.advanceTimersByTime(799);
    expect(onSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  // ── Affichage ─────────────────────────────────────────────────────────────

  it('affiche la valeur courante dans le champ input', () => {
    render(<UserSearch value="dupont" onChange={jest.fn()} onSearch={jest.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('dupont');
  });

  it('appelle onChange lors de la saisie utilisateur', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();

    render(<UserSearch value="" onChange={onChange} onSearch={jest.fn()} />);
    await user.type(screen.getByRole('textbox', { name: 'Rechercher' }), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });
});
