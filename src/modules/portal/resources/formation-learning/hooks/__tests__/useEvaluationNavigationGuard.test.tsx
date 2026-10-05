import { StrictMode, useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

/** Deterministic async traversals; pushState/replaceState still update jsdom's URL/state. */
function installHistory() {
  const replace = window.history.replaceState.bind(window.history);
  const entries = [{ state: window.history.state, url: window.location.href }];
  const traversals: Array<() => void> = [];
  let index = 0;
  jest.spyOn(window.history, 'replaceState').mockImplementation((state, unused, url) => {
    replace(state, unused, url);
    entries[index] = { state, url: window.location.href };
  });
  jest.spyOn(window.history, 'pushState').mockImplementation((state, unused, url) => {
    replace(state, unused, url);
    entries.splice(index + 1, entries.length, { state, url: window.location.href });
    index += 1;
  });
  jest.spyOn(window.history, 'go').mockImplementation((delta = 0) => {
    traversals.push(() => {
      const next = index + delta;
      if (next < 0 || next >= entries.length || next === index) return;
      index = next;
      const entry = entries[index];
      replace(entry.state, '', entry.url);
      window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
    });
  });
  jest.spyOn(window.history, 'back').mockImplementation(() => window.history.go(-1));
  jest.spyOn(window.history, 'forward').mockImplementation(() => window.history.go(1));
  return () => {
    act(() => traversals.splice(0).forEach((traverse) => traverse()));
  };
}

describe('Verrouillage de navigation pendant les évaluations', () => {
  let flushHistory: () => void;
  beforeEach(() => {
    delete window.__learneoEvaluationDocument;
    window.history.replaceState({}, '', '/evaluation');
    jest.clearAllMocks();
    flushHistory = installHistory();
  });
  afterEach(async () => {
    cleanup();
    await act(async () => {});
    flushHistory();
    window.__learneoEvaluationHistoryFence?.dispose();
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

  it('ne duplique pas l’historique au remontage StrictMode et retire la barrière au démontage définitif', async () => {
    const push = jest.spyOn(window.history, 'pushState');
    const back = jest.spyOn(window.history, 'back');
    const { unmount } = render(
      <StrictMode>
        <Guard />
      </StrictMode>,
    );
    expect(push).toHaveBeenCalledTimes(1);
    expect(isEvaluationNavigationLocked()).toBe(true);
    await act(async () => {});
    expect(back).not.toHaveBeenCalled();
    unmount();
    expect(back).not.toHaveBeenCalled();
    expect(isEvaluationNavigationLocked()).toBe(false);
    await act(async () => {});
    expect(back).toHaveBeenCalledTimes(1);
    flushHistory();
    expect(window.history.state).toEqual({});
    expect(window.__learneoEvaluationHistoryFence?.retired).toBe(true);
  });

  it('rééquilibre uniquement les locks du document possédé et conserve beforeunload après changement d’identité', async () => {
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
    await act(async () => {});
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    expect(window.history.back).not.toHaveBeenCalled();
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

  it('revient à la vraie page précédente dès le premier Retour après déverrouillage en conservant l’état du routeur', async () => {
    const previousState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['previous'] };
    const evaluationState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['evaluation'] };
    const resultState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['result'], custom: 42 };
    window.history.replaceState(previousState, '', '/previous');
    window.history.pushState(evaluationState, '', '/evaluation');
    const { rerender } = render(<Guard />);
    const router = jest.fn();
    window.addEventListener('popstate', router);
    // Next.js can refresh the current entry while the fence owns it.
    window.history.replaceState({ ...window.history.state, ...resultState }, '', '/evaluation');
    rerender(<Guard locked={false} />);
    await act(async () => {});
    flushHistory();
    expect(window.location.pathname).toBe('/evaluation');
    expect(window.history.state).toEqual(resultState);
    expect(router).not.toHaveBeenCalled();

    window.history.back();
    flushHistory();
    expect(window.location.pathname).toBe('/previous');
    expect(window.history.state).toEqual(previousState);
    expect(router).toHaveBeenCalledTimes(1);
    window.history.forward();
    flushHistory();
    expect(window.location.pathname).toBe('/evaluation');
    expect(window.history.state).toEqual(resultState);
    // Forward must not reactivate the duplicate entry left in the forward stack.
    const previousEvents = router.mock.calls.length;
    window.history.forward();
    flushHistory();
    flushHistory();
    expect(window.history.state).toEqual(resultState);
    expect(router).toHaveBeenCalledTimes(previousEvents);
    window.history.back();
    flushHistory();
    expect(window.location.pathname).toBe('/previous');
    window.removeEventListener('popstate', router);
  });

  it('attend la libération du dernier verrou avant de consommer l’entrée partagée', async () => {
    const { rerender } = render(
      <>
        <Guard />
        <Guard />
      </>,
    );
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    expect(evaluationDocument().navigationLocks).toBe(2);
    rerender(
      <>
        <Guard locked={false} />
        <Guard />
      </>,
    );
    await act(async () => {});
    expect(window.history.back).not.toHaveBeenCalled();
    expect(evaluationDocument().navigationLocks).toBe(1);
    rerender(
      <>
        <Guard locked={false} />
        <Guard locked={false} />
      </>,
    );
    await act(async () => {});
    expect(window.history.back).toHaveBeenCalledTimes(1);
    flushHistory();
    expect(window.history.state).toEqual({});
  });

  it('réutilise la barrière lors d’un démontage et remontage immédiat', async () => {
    const { unmount } = render(<Guard />);
    unmount();
    render(<Guard />);
    await act(async () => {});
    expect(window.history.pushState).toHaveBeenCalledTimes(1);
    expect(window.history.back).not.toHaveBeenCalled();
    expect(isEvaluationNavigationLocked()).toBe(true);
  });

  it('rétablit la barrière si un verrou est repris pendant le retour asynchrone', async () => {
    const { rerender } = render(<Guard />);
    rerender(<Guard locked={false} />);
    await act(async () => {});
    expect(window.history.back).toHaveBeenCalledTimes(1);
    rerender(<Guard />);
    const router = jest.fn();
    window.addEventListener('popstate', router);
    flushHistory();
    expect(window.location.pathname).toBe('/evaluation');
    expect(window.history.state.learneoEvaluationFence).toEqual(expect.any(String));
    expect(isEvaluationNavigationLocked()).toBe(true);
    expect(router).not.toHaveBeenCalled();
    rerender(<Guard locked={false} />);
    await act(async () => {});
    flushHistory();
    expect(window.history.back).toHaveBeenCalledTimes(2);
    expect(window.history.state).toEqual({});
    window.removeEventListener('popstate', router);
  });

  it('ne ramène pas sur l’évaluation lorsqu’une autre route a déjà été ouverte', async () => {
    const { unmount } = render(<Guard />);
    const nextState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['next'] };
    window.history.pushState(nextState, '', '/next');
    unmount();
    await act(async () => {});
    expect(window.history.back).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/next');
    expect(window.history.state).toEqual(nextState);
    expect(window.__learneoEvaluationHistoryFence).toBeUndefined();
  });

  it('conserve une base sûre après un retour de plusieurs entrées pendant le verrouillage', async () => {
    window.history.replaceState({}, '', '/previous');
    window.history.pushState({}, '', '/evaluation');
    const { rerender } = render(<Guard />);
    window.history.go(-2);
    flushHistory();
    expect(window.location.pathname).toBe('/evaluation');
    rerender(<Guard locked={false} />);
    await act(async () => {});
    flushHistory();
    expect(window.location.pathname).toBe('/evaluation');
    expect(window.history.state).toEqual({});
    window.history.back();
    flushHistory();
    expect(window.location.pathname).toBe('/previous');
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
