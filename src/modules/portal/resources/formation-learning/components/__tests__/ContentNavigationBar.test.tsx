/**
 * Tests unitaires — ContentNavigationBar
 *
 * Couvre surtout l'état d'enregistrement, qui était le défaut signalé : le bouton
 * ne montrait qu'un changement de libellé, sans indicateur de chargement, et la
 * navigation restait cliquable pendant la requête.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ContentNavigationBar from '../ContentNavigationBar';

const baseProps = {
  index: 3,
  total: 12,
  prev: 'entry-2',
  next: 'entry-4',
  onNavigate: jest.fn(),
  isCompleted: false,
  onMarkComplete: jest.fn(),
  isCompleting: false,
};

/**
 * Returns `baseProps` rather than the merged object so the mocks keep their
 * `jest.Mock` type — spreading into `Partial<Props>` widens them to the plain
 * prop signature and loses `.mock`.
 */
function setup(overrides: Partial<React.ComponentProps<typeof ContentNavigationBar>> = {}) {
  render(<ContentNavigationBar {...baseProps} {...overrides} />);
  return baseProps;
}

describe('ContentNavigationBar', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── État d'enregistrement ──────────────────────────────────────────────────

  describe('pendant l’enregistrement', () => {
    it('marque le bouton comme occupé', () => {
      setup({ isCompleting: true });

      const cta = screen.getByRole('button', { name: /terminer et continuer/i });
      expect(cta).toHaveAttribute('aria-busy', 'true');
      expect(cta).toBeDisabled();
    });

    it('affiche un indicateur de chargement animé', () => {
      const { container } = render(<ContentNavigationBar {...baseProps} isCompleting />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('conserve le même libellé pour ne pas faire sauter la largeur du bouton', () => {
      const { rerender } = render(<ContentNavigationBar {...baseProps} />);
      const idleLabel = screen.getByRole('button', { name: /terminer et continuer/i }).textContent;

      rerender(<ContentNavigationBar {...baseProps} isCompleting />);
      const busyLabel = screen.getByRole('button', { name: /terminer et continuer/i }).textContent;

      expect(busyLabel).toBe(idleLabel);
    });

    it('empêche de naviguer ailleurs tant que la progression n’est pas sauvegardée', () => {
      setup({ isCompleting: true });

      expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    });
  });

  // ── Action de validation ───────────────────────────────────────────────────

  it('enchaîne sur le contenu suivant après validation quand il y en a un', async () => {
    const props = setup();

    await userEvent.click(screen.getByRole('button', { name: /terminer et continuer/i }));

    expect(props.onMarkComplete).toHaveBeenCalledTimes(1);
    // Le callback de continuation est passé à l'appelant, qui l'exécute onSuccess.
    const onDone = props.onMarkComplete.mock.calls[0][0] as () => void;
    onDone();
    expect(props.onNavigate).toHaveBeenCalledWith('entry-4');
  });

  it('ne passe aucune continuation sur le dernier contenu', async () => {
    const props = setup({ next: null });

    await userEvent.click(screen.getByRole('button', { name: /^terminer$/i }));

    expect(props.onMarkComplete).toHaveBeenCalledWith(undefined);
  });

  // ── Contenu déjà terminé ───────────────────────────────────────────────────

  describe('quand le contenu est déjà terminé', () => {
    it('confirme la validation et bascule sur une simple navigation', async () => {
      const props = setup({ isCompleted: true });

      expect(screen.getByText('Terminé')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /terminer/i })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /suivant/i }));

      expect(props.onNavigate).toHaveBeenCalledWith('entry-4');
      expect(props.onMarkComplete).not.toHaveBeenCalled();
    });
  });

  // ── Mode sans persistance (mock) ───────────────────────────────────────────

  it('n’offre que la navigation quand il n’y a rien à persister', () => {
    setup({ onMarkComplete: undefined });

    expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /terminer/i })).not.toBeInTheDocument();
  });

  // ── Bornes de navigation ───────────────────────────────────────────────────

  it('désactive Précédent sur le premier contenu et Suivant sur le dernier', () => {
    const { unmount } = render(<ContentNavigationBar {...baseProps} prev={null} />);
    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    unmount();

    render(<ContentNavigationBar {...baseProps} next={null} isCompleted />);
    expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
  });

  // ── Progression ────────────────────────────────────────────────────────────

  it('expose la progression de façon accessible', () => {
    setup({ index: 3, total: 12 });

    expect(screen.getByText('Contenu 3 / 12')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });

  it('ne divise pas par zéro quand la formation est vide', () => {
    setup({ index: 0, total: 0 });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
