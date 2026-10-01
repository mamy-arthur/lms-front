import { StrictMode, useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExamFinishDialog } from '@/modules/quizzes/components/exam/ExamFinishDialog';
import { useEvaluationNavigationGuard } from '../useEvaluationNavigationGuard';
import {
  evaluationDocument,
  isEvaluationNavigationLocked,
} from '../../lib/evaluation-document-session';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

const outside = jest.fn();
const inside = jest.fn();
function Guard({ locked = true }: { locked?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEvaluationNavigationGuard(locked, root);
  return (
    <div>
      <header data-testid="header">
        <a href="/elsewhere" onClick={outside}>
          Accueil
        </a>
      </header>
      <aside data-testid="sidebar">
        <button onClick={outside}>Autre module</button>
      </aside>
      <div ref={root}>
        <button onClick={inside}>Réessayer la sauvegarde</button>
      </div>
    </div>
  );
}

function PortalGuard({ locked }: { locked: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEvaluationNavigationGuard(locked, root);
  return (
    <div>
      <aside data-testid="external-dialog" role="dialog">
        <button onClick={outside}>Navigation extérieure</button>
      </aside>
      <div ref={root}>
        <div ref={setContainer} data-testid="owned-portal" />
        <ExamFinishDialog
          open
          container={container}
          questions={[]}
          answers={{}}
          onCancel={inside}
          onConfirm={inside}
        />
      </div>
    </div>
  );
}

describe('Verrouillage de navigation pendant les évaluations', () => {
  beforeEach(() => {
    delete window.__learneoEvaluationDocument;
    window.history.replaceState({}, '', '/evaluation');
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bloque les liens et le sommaire sans bloquer les commandes de l’évaluation', () => {
    const { rerender } = render(<Guard />);
    fireEvent.click(screen.getByText('Accueil'));
    fireEvent.click(screen.getByText('Autre module'));
    fireEvent.click(screen.getByText('Réessayer la sauvegarde'));
    expect(outside).not.toHaveBeenCalled();
    expect(inside).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sidebar').inert).toBe(true);
    expect(screen.getByTestId('header').inert).toBe(true);
    expect(isEvaluationNavigationLocked()).toBe(true);
    rerender(<Guard locked={false} />);
    fireEvent.click(screen.getByText('Autre module'));
    expect(outside).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sidebar').inert).not.toBe(true);
    expect(isEvaluationNavigationLocked()).toBe(false);
  });

  it('avertit avant fermeture uniquement pendant le verrouillage sans action si annulation', () => {
    const { unmount } = render(<Guard />);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(inside).not.toHaveBeenCalled();
    unmount();
    const next = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(next);
    expect(next.defaultPrevented).toBe(false);
    expect(isEvaluationNavigationLocked()).toBe(false);
  });

  it('rétablit la route verrouillée avant que le routeur reçoive le retour arrière', () => {
    render(<Guard />);
    const routerPop = jest.fn();
    window.addEventListener('popstate', routerPop);
    window.history.replaceState({}, '', '/previous');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(window.location.pathname).toBe('/evaluation');
    expect(routerPop).not.toHaveBeenCalled();
    window.removeEventListener('popstate', routerPop);
  });

  it('ne duplique pas l’historique et ne navigue pas pendant le nettoyage StrictMode', () => {
    const push = jest.spyOn(window.history, 'pushState');
    const back = jest.spyOn(window.history, 'back');
    const { unmount } = render(
      <StrictMode>
        <Guard />
      </StrictMode>,
    );
    expect(push).toHaveBeenCalledTimes(1);
    expect(isEvaluationNavigationLocked()).toBe(true);
    unmount();
    expect(back).not.toHaveBeenCalled();
    expect(isEvaluationNavigationLocked()).toBe(false);
  });

  it('rééquilibre uniquement les locks du document possédé et conserve beforeunload après changement d’identité', () => {
    const { unmount } = render(
      <StrictMode>
        <Guard />
      </StrictMode>,
    );
    const oldDocument = evaluationDocument();
    expect(oldDocument.navigationLocks).toBe(1);
    act(() => useSimulationStore.setState((state) => ({ epoch: state.epoch + 1 })));
    const nextDocument = evaluationDocument();
    expect(nextDocument).not.toBe(oldDocument);
    expect(oldDocument.navigationLocks).toBe(0);
    expect(nextDocument.navigationLocks).toBe(1);
    const locked = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(locked);
    expect(locked.defaultPrevented).toBe(true);
    unmount();
    expect(oldDocument.navigationLocks).toBe(0);
    expect(nextDocument.navigationLocks).toBe(0);
    const unlocked = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unlocked);
    expect(unlocked.defaultPrevented).toBe(false);
  });

  it('ne rend pas inerte un portail déjà ouvert lors du verrouillage et n’exempte pas les dialogues extérieurs', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PortalGuard locked={false} />);
    const dialog = screen.getByRole('dialog', { name: 'Terminer le quiz ?' });
    rerender(<PortalGuard locked />);
    expect(screen.getByTestId('owned-portal')).toContainElement(dialog);
    for (let element: HTMLElement | null = dialog; element; element = element.parentElement) {
      expect(element.inert).not.toBe(true);
    }
    expect(screen.getByTestId('external-dialog').inert).toBe(true);
    expect(fireEvent.click(screen.getByText('Navigation extérieure'))).toBe(false);
    expect(outside).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Retour' }));
    await user.click(screen.getByRole('button', { name: 'Soumettre le quiz' }));
    expect(inside).toHaveBeenCalledTimes(2);
    rerender(<PortalGuard locked={false} />);
    expect(screen.getByTestId('external-dialog').inert).not.toBe(true);
  });
});
