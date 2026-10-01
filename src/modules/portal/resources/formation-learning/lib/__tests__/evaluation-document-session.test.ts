import { act, cleanup, renderHook } from '@testing-library/react';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { EvaluationAutosave } from '../evaluation-autosave';
import {
  anchorEvaluationClock,
  evaluationDocument,
  isEvaluationDocumentCurrent,
  subscribeEvaluationDocument,
} from '../evaluation-document-session';
import { useEvaluationDeadline } from '../../hooks/useEvaluationDeadline';
import { evaluationAttempt } from '../__fixtures__/evaluation-attempt';
import {
  evaluationTenant,
  evaluationUser,
  resetEvaluationIdentity,
} from '../__fixtures__/evaluation-identity';

const simulationSession = {
  simulated_role: Role.TRAINEE,
  tenant_id: 'tenant-a',
  allowed_roles: [Role.TRAINEE],
  shop_tenants: [],
};

describe('Isolation du document d’évaluation par identité runtime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetEvaluationIdentity();
    useSimulationStore.setState({ phase: 'ready', session: simulationSession, epoch: 1 });
    delete window.__learneoEvaluationDocument;
  });
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ['logout', () => useAuthStore.getState().clearAuth()],
    ['account', () => useAuthStore.getState().setAuth({ ...evaluationUser, id: 'learner-b' })],
    ['session', () => useAuthStore.getState().setAuth(evaluationUser, 'session-b')],
    ['tenant', () => useTenantStore.getState().setTenant({ ...evaluationTenant, id: 'tenant-b' })],
    ['simulated role', () => useAuthStore.getState().setSimulatedRole(Role.TRAINEE)],
    [
      'server simulation role',
      () => useSimulationStore.setState({
        session: { ...simulationSession, simulated_role: Role.EDITOR },
      }),
    ],
    [
      'server simulation tenant',
      () => useSimulationStore.setState({
        session: { ...simulationSession, tenant_id: 'tenant-b' },
      }),
    ],
    ['epoch', () => useSimulationStore.setState({ epoch: 2 })],
    ['checking', () => useSimulationStore.setState({ phase: 'checking' })],
    ['transition', () => useSimulationStore.setState({ phase: 'transition' })],
    ['error', () => useSimulationStore.setState({ phase: 'error' })],
  ] as const)('arrête tous les managers et vide les cartes immédiatement lors de %s', (_label, change) => {
    const document = evaluationDocument();
    const attempt = evaluationAttempt({ expires_at: '2026-10-01T12:01:00.000Z' });
    const clock = anchorEvaluationClock(attempt, document);
    const send = jest.fn();
    const first = new EvaluationAutosave(attempt, document.id, send, () => true);
    const second = new EvaluationAutosave(
      { ...attempt, id: 'attempt-2' }, document.id, send, () => true,
    );
    document.saves.set(attempt.id, first);
    document.saves.set('attempt-2', second);
    document.frozen.add(attempt.id);
    const stopFirst = jest.spyOn(first, 'stop');
    const stopSecond = jest.spyOn(second, 'stop');

    change(); // No mounted React hook or later evaluationDocument() call is needed.
    expect(stopFirst).toHaveBeenCalledTimes(1);
    expect(stopSecond).toHaveBeenCalledTimes(1);
    expect(document.saves.size).toBe(0);
    expect(document.clocks.size).toBe(0);
    expect(document.frozen.size).toBe(0);
    expect(isEvaluationDocumentCurrent(document)).toBe(false);
    const next = evaluationDocument();
    expect(next.id).not.toBe(document.id);
    expect(anchorEvaluationClock(attempt, next)).not.toBe(clock);
    expect(() => anchorEvaluationClock(attempt, document)).toThrow('contexte');
    expect(next.clocks.size).toBe(1);
    first.change('question-1', new Set(['a']));
    second.retry();
    expect(send).not.toHaveBeenCalled();
  });

  it('conserve le document et les horloges pour un rafraîchissement du même profil/contexte', () => {
    const document = evaluationDocument();
    const clock = anchorEvaluationClock(evaluationAttempt());
    document.frozen.add('attempt-1');
    const listener = jest.fn();
    const unsubscribe = subscribeEvaluationDocument(listener);
    useAuthStore.getState().setAuth({ ...evaluationUser, name: 'Updated profile' });
    useTenantStore.getState().setTenant({ ...evaluationTenant, name: 'Updated tenant' });
    useSimulationStore.setState({
      returnPath: '/portal',
      session: { ...simulationSession, allowed_roles: [Role.TRAINEE, Role.EDITOR] },
    });
    expect(evaluationDocument()).toBe(document);
    expect(evaluationDocument().clocks.get('attempt-1')).toBe(clock);
    expect(evaluationDocument().frozen.has('attempt-1')).toBe(true);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('ne réactive jamais le document A après A -> déconnexion -> A sans rendu intermédiaire', () => {
    const first = evaluationDocument();
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth(evaluationUser, 'session-a');
    const next = evaluationDocument();
    expect(next.identity).toBe(first.identity);
    expect(next.id).not.toBe(first.id);
    expect(isEvaluationDocumentCurrent(first)).toBe(false);
  });

  it('réagit à un changement d’epoch sans attendre un tick ni changer l’id synthétique', () => {
    const attempt = evaluationAttempt({ expires_at: '2026-10-01T12:01:00.000Z' });
    anchorEvaluationClock(attempt);
    const { result } = renderHook(() => useEvaluationDeadline(attempt.id));
    act(() => {
      jest.advanceTimersByTime(20_000);
    });
    expect(result.current.remaining).toBe(40);
    act(() => useSimulationStore.setState({ epoch: 2 }));
    expect(result.current.remaining).toBeNull();
    act(() => {
      anchorEvaluationClock(attempt);
      jest.advanceTimersByTime(250);
    });
    expect(result.current.remaining).toBe(60);
  });

  it('ne duplique pas les abonnements aux stores lors du HMR du module runtime', () => {
    window.__learneoEvaluationDocumentOwner?.unsubscribe.forEach((unsubscribe) => unsubscribe());
    delete window.__learneoEvaluationDocumentOwner;
    const authSubscribe = jest.spyOn(useAuthStore, 'subscribe');
    const tenantSubscribe = jest.spyOn(useTenantStore, 'subscribe');
    const simulationSubscribe = jest.spyOn(useSimulationStore, 'subscribe');
    const document = evaluationDocument();
    const clock = anchorEvaluationClock(evaluationAttempt());
    const manager = new EvaluationAutosave(
      evaluationAttempt(), document.id, jest.fn(), () => true,
    );
    document.saves.set('attempt-1', manager);
    document.frozen.add('attempt-1');
    const listener = jest.fn();
    const unsubscribe = subscribeEvaluationDocument(listener);
    const auth = jest.requireActual<typeof import('@/shared/stores/auth.store')>(
      '@/shared/stores/auth.store',
    );
    const tenant = jest.requireActual<typeof import('@/shared/stores/tenant.store')>(
      '@/shared/stores/tenant.store',
    );
    const simulation = jest.requireActual<typeof import('@/shared/simulation/simulation.store')>(
      '@/shared/simulation/simulation.store',
    );
    // Reload only the runtime, retaining the application's actual store instances.
    jest.doMock('@/shared/stores/auth.store', () => auth);
    jest.doMock('@/shared/stores/tenant.store', () => tenant);
    jest.doMock('@/shared/simulation/simulation.store', () => simulation);
    try {
      jest.isolateModules(() => {
        const reloaded = jest.requireActual<typeof import('../evaluation-document-session')>(
          '../evaluation-document-session',
        );
        expect(reloaded.evaluationDocument()).toBe(document);
        expect(reloaded.evaluationDocument().clocks.get('attempt-1')).toBe(clock);
        expect(reloaded.evaluationDocument().saves.get('attempt-1')).toBe(manager);
        expect(reloaded.evaluationDocument().frozen.has('attempt-1')).toBe(true);
        const unsubscribeReloaded = reloaded.subscribeEvaluationDocument(jest.fn());
        unsubscribeReloaded();
      });
      expect(authSubscribe).toHaveBeenCalledTimes(1);
      expect(tenantSubscribe).toHaveBeenCalledTimes(1);
      expect(simulationSubscribe).toHaveBeenCalledTimes(1);
      useSimulationStore.setState({ epoch: 2 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(document.saves.size).toBe(0);
    } finally {
      unsubscribe();
      jest.dontMock('@/shared/stores/auth.store');
      jest.dontMock('@/shared/stores/tenant.store');
      jest.dontMock('@/shared/simulation/simulation.store');
    }
  });
});