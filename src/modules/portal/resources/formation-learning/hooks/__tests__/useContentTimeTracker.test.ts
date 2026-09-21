/**
 * Tests unitaires — useContentTimeTracker
 *
 * Toute la logique temporelle du suivi tient dans des transitions invisibles
 * depuis l'interface : pause à la perte de visibilité, reprise depuis le
 * bfcache, clôture au changement de contenu, sauvegarde périodique et rejeu des
 * envois non acquittés. Les faux timers de Jest pilotent à la fois `Date`,
 * `performance.now()` et les intervalles, ce qui rend ces transitions
 * déterministes.
 */

jest.mock('@/shared/api/portal.api', () => ({
  portalContentTimeApi: { record: jest.fn() },
}));

import { act, renderHook } from '@testing-library/react';
import { portalContentTimeApi } from '@/shared/api/portal.api';
import { useContentTimeTracker } from '../useContentTimeTracker';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { Role } from '@/shared/constants/roles';

const record = jest.mocked(portalContentTimeApi.record);

const FLUSH_INTERVAL_MS = 30_000;
const PENDING_GRACE_MS = 5_000;
const PENDING_STORAGE_KEY = 'learneo:content-time:pending';

interface Props {
  enrollmentId: string;
  courseId: string | null;
  entryId: string | null;
  competencyId: string | null;
  context: { node_execution_id: string; expected_state_revision: number } | null;
  idleDetection: boolean;
  onExecutionConflict?: (error: unknown) => void;
}

function props(entryId: string, overrides: Partial<Props> = {}): Props {
  return {
    enrollmentId: 'enrollment-1',
    courseId: 'course-1',
    entryId,
    competencyId: 'competency-1',
    context: { node_execution_id: 'execution-1', expected_state_revision: 7 },
    idleDetection: true,
    ...overrides,
  };
}

/** Arguments de `record` : (enrollment, course, entry, session, payload, options). */
function callAt(index: number) {
  const [, , entryId, sessionId, payload, options] = record.mock.calls[index];

  return { entryId, sessionId, payload, options };
}

function lastCall() {
  return callAt(record.mock.calls.length - 1);
}

function executionConflict() {
  return Object.assign(new Error('Conflict'), {
    status: 409,
    json: { error_code: 'execution_conflict' },
  });
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

/** Laisse les continuations `then` des envois s'exécuter sous faux timers. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

  record.mockReset();
  record.mockResolvedValue(undefined);

  useAuthStore.setState({ simulatedRole: null });
  useSimulationStore.setState({ phase: 'idle', epoch: 0 });
  window.localStorage.clear();
  setVisibility('visible');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useContentTimeTracker', () => {
  it('ne crée aucune période fictive et ne lit/prune pas la file réelle en simulation', async () => {
    useAuthStore.setState({ simulatedRole: Role.TRAINEE });
    useSimulationStore.setState({ phase: 'ready' });
    const saved = JSON.stringify([
      {
        enrollmentId: 'real-enrollment',
        courseId: 'real-course',
        entryId: 'real-entry',
        sessionId: 'real-pending-session',
        queuedAt: 0,
        payload: { time_spent: 10 },
      },
    ]);
    window.localStorage.setItem(PENDING_STORAGE_KEY, saved);
    const { unmount } = renderHook(() => useContentTimeTracker(props('demo-entry')));

    await advance(2 * FLUSH_INTERVAL_MS);
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      window.dispatchEvent(new Event('pagehide'));
      window.dispatchEvent(new Event('pageshow'));
      setVisibility('hidden');
    });
    unmount();
    await settle();

    expect(record).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PENDING_STORAGE_KEY)).toBe(saved);
  });

  it('ne démarre pas le chrono pendant une transition sans rôle simulé encore défini', async () => {
    useSimulationStore.setState({ phase: 'transition' });
    const { unmount } = renderHook(() => useContentTimeTracker(props('entry-1')));
    await advance(FLUSH_INTERVAL_MS);
    unmount();

    expect(record).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PENDING_STORAGE_KEY)).toBeNull();
  });

  it('conserve la dernière période réelle sans l’envoyer pendant la simulation puis la rejoue', async () => {
    const first = renderHook(() => useContentTimeTracker(props('entry-1')));
    await advance(5_000);

    act(() => {
      useSimulationStore.setState({ phase: 'transition', epoch: 1 });
      useAuthStore.setState({ simulatedRole: Role.TRAINEE });
      useSimulationStore.setState({ phase: 'ready' });
    });
    const saved = window.localStorage.getItem(PENDING_STORAGE_KEY);
    expect(JSON.parse(saved!)[0].payload.time_spent).toBe(5);
    expect(record).not.toHaveBeenCalled();

    await advance(2 * FLUSH_INTERVAL_MS);
    first.unmount();
    expect(window.localStorage.getItem(PENDING_STORAGE_KEY)).toBe(saved);
    expect(record).not.toHaveBeenCalled();

    useAuthStore.setState({ simulatedRole: null });
    useSimulationStore.setState({ phase: 'ready', epoch: 2 });
    const second = renderHook(() => useContentTimeTracker(props('entry-2')));
    await settle();
    expect(record).toHaveBeenCalledTimes(1);
    expect(lastCall().entryId).toBe('entry-1');
    expect(lastCall().payload.time_spent).toBe(5);
    expect(window.localStorage.getItem(PENDING_STORAGE_KEY)).toBeNull();
    second.unmount();
  });

  it.each(['success', 'forbidden'] as const)(
    'ne perd pas le temps réel si une requête en vol finit (%s) après le début de simulation',
    async (outcome) => {
      let resolve!: () => void;
      let reject!: (error: unknown) => void;
      record.mockReturnValueOnce(
        new Promise<void>((res, rej) => {
          resolve = res;
          reject = rej;
        }),
      );
      const { unmount } = renderHook(() => useContentTimeTracker(props('entry-1')));
      await advance(FLUSH_INTERVAL_MS + 5_000);
      expect(lastCall().payload.time_spent).toBe(30);

      act(() => {
        useSimulationStore.setState({ phase: 'transition', epoch: 1 });
        useAuthStore.setState({ simulatedRole: Role.TRAINEE });
      });
      const saved = window.localStorage.getItem(PENDING_STORAGE_KEY);
      expect(JSON.parse(saved!)[0].payload.time_spent).toBe(35);

      await act(async () => {
        if (outcome === 'success') resolve();
        else reject(Object.assign(new Error('Simulation active'), { status: 403 }));
        await Promise.resolve();
      });
      unmount();

      expect(record).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(PENDING_STORAGE_KEY)).toBe(saved);
    },
  );

  it('un ancien acquittement ne supprime pas une mesure finale réelle plus récente', async () => {
    let acknowledge!: () => void;
    record.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        acknowledge = resolve;
      }),
    );
    const { unmount } = renderHook(() => useContentTimeTracker(props('entry-1')));
    await advance(FLUSH_INTERVAL_MS + 5_000);
    record.mockRejectedValueOnce(new Error('offline'));
    unmount();
    await settle();

    await act(async () => {
      acknowledge();
      await Promise.resolve();
    });

    const saved = JSON.parse(window.localStorage.getItem(PENDING_STORAGE_KEY)!);
    expect(saved).toHaveLength(1);
    expect(saved[0].payload.time_spent).toBe(35);
  });

  it('clôt l’ancienne visite avec sa révision et ouvre une période indépendante pour la suivante', async () => {
    const { rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(5_000);

    rerender(
      props('entry-1', {
        context: { node_execution_id: 'execution-2', expected_state_revision: 12 },
      }),
    );
    expect(callAt(0).payload).toMatchObject({
      node_execution_id: 'execution-1',
      expected_state_revision: 7,
      time_spent: 5,
    });

    await advance(FLUSH_INTERVAL_MS);
    expect(lastCall().sessionId).not.toBe(callAt(0).sessionId);
    expect(lastCall().payload).toMatchObject({
      node_execution_id: 'execution-2',
      expected_state_revision: 12,
      time_spent: 30,
    });
    unmount();
  });

  it('utilise la révision courante pour les flushs actifs sans recréer la période', async () => {
    const { result, rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(FLUSH_INTERVAL_MS);
    const sessionId = lastCall().sessionId;
    rerender(
      props('entry-1', {
        context: { node_execution_id: 'execution-1', expected_state_revision: 8 },
      }),
    );
    expect(record).toHaveBeenCalledTimes(1);
    await advance(FLUSH_INTERVAL_MS);
    expect(lastCall().sessionId).toBe(sessionId);
    expect(lastCall().payload.expected_state_revision).toBe(8);

    rerender(
      props('entry-1', {
        context: { node_execution_id: 'execution-1', expected_state_revision: 9 },
      }),
    );
    await act(async () => {
      await result.current.flushBeforeComplete();
    });
    expect(lastCall().sessionId).toBe(sessionId);
    expect(lastCall().payload.expected_state_revision).toBe(9);
    unmount();
  });

  it('conserve la révision de clôture quand le contexte devient nul', async () => {
    const { rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(5_000);
    rerender(props('entry-1', { context: null }));
    expect(lastCall().payload).toMatchObject({
      node_execution_id: 'execution-1',
      expected_state_revision: 7,
      time_spent: 5,
    });
    await advance(FLUSH_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('abandonne une période en conflit et attend un contexte actualisé sans la rejouer', async () => {
    const conflict = executionConflict();
    const onExecutionConflict = jest.fn();
    record.mockRejectedValueOnce(conflict);
    const { result, rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1', { onExecutionConflict }),
    });
    await advance(FLUSH_INTERVAL_MS);
    const rejected = lastCall();
    expect(onExecutionConflict).toHaveBeenCalledWith(conflict);
    expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    window.dispatchEvent(new Event('pointerdown'));
    await advance(2 * FLUSH_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(1);
    await act(async () => {
      await expect(result.current.flushBeforeComplete()).rejects.toBe(conflict);
    });
    act(() => result.current.resumeAfterFailure());

    rerender(
      props('entry-1', {
        onExecutionConflict,
        context: { node_execution_id: 'execution-1', expected_state_revision: 8 },
      }),
    );
    await advance(FLUSH_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(2);
    expect(lastCall().sessionId).not.toBe(rejected.sessionId);
    expect(lastCall().payload).toMatchObject({ expected_state_revision: 8, time_spent: 30 });
    unmount();
  });

  it('remonte aussi le conflit du flush obligatoire après avoir retiré la période', async () => {
    const conflict = executionConflict();
    const onExecutionConflict = jest.fn();
    const { result, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1', { onExecutionConflict }),
    });
    await advance(5_000);
    record.mockRejectedValueOnce(conflict);
    await act(async () => {
      await expect(result.current.flushBeforeComplete()).rejects.toBe(conflict);
    });
    expect(onExecutionConflict).toHaveBeenCalledWith(conflict);
    expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    unmount();
  });

  it('retire un rejeu périmé sans lui substituer la visite courante ni arrêter son chrono', async () => {
    record.mockRejectedValueOnce(new Error('network down'));
    const first = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(5_000);
    first.unmount();
    await settle();
    const old = lastCall();
    await advance(PENDING_GRACE_MS + 1_000);

    const onExecutionConflict = jest.fn();
    record.mockRejectedValueOnce(executionConflict());
    const second = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-2', {
        onExecutionConflict,
        context: { node_execution_id: 'execution-2', expected_state_revision: 12 },
      }),
    });
    await settle();
    expect(lastCall().sessionId).toBe(old.sessionId);
    expect(lastCall().payload).toEqual(old.payload);
    expect(onExecutionConflict).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    await advance(2 * FLUSH_INTERVAL_MS);
    expect(record.mock.calls.filter((call) => call[3] === old.sessionId)).toHaveLength(2);
    expect(lastCall().payload).toMatchObject({
      node_execution_id: 'execution-2',
      expected_state_revision: 12,
      time_spent: 60,
    });
    second.unmount();
    await settle();
    await advance(PENDING_GRACE_MS + 1_000);
    const calls = record.mock.calls.length;
    const third = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-3'),
    });
    await settle();
    expect(record).toHaveBeenCalledTimes(calls);
    third.unmount();
  });

  it('ignore pour la nouvelle période un conflit tardif de l’ancienne visite', async () => {
    let rejectOld!: (error: unknown) => void;
    record.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectOld = reject;
        }),
    );
    const onExecutionConflict = jest.fn();
    const { rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1', { onExecutionConflict }),
    });
    await advance(FLUSH_INTERVAL_MS);
    await advance(5_000);
    record.mockRejectedValueOnce(new Error('network down'));
    rerender(
      props('entry-1', {
        onExecutionConflict,
        context: { node_execution_id: 'execution-2', expected_state_revision: 12 },
      }),
    );
    await settle();
    expect(window.localStorage.getItem('learneo:content-time:pending')).not.toBeNull();
    await act(async () => {
      rejectOld(executionConflict());
    });
    expect(onExecutionConflict).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    await advance(FLUSH_INTERVAL_MS);
    expect(record).toHaveBeenCalledTimes(3);
    expect(lastCall().payload).toMatchObject({
      node_execution_id: 'execution-2',
      expected_state_revision: 12,
      time_spent: 30,
    });
    unmount();
  });

  it('actualise le callback de récupération sans clôturer la période', async () => {
    const oldCallback = jest.fn();
    const newCallback = jest.fn();
    const { rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1', { onExecutionConflict: oldCallback }),
    });
    await advance(5_000);
    rerender(props('entry-1', { onExecutionConflict: newCallback }));
    expect(record).not.toHaveBeenCalled();
    record.mockRejectedValueOnce(executionConflict());
    await advance(FLUSH_INTERVAL_MS);
    expect(oldCallback).not.toHaveBeenCalled();
    expect(newCallback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it.each([10_000, 35_000])(
    'acquitte le dernier segment à %i ms avant de fermer la visite',
    async (duration) => {
      const { result, rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
        initialProps: props('entry-1'),
      });
      await advance(duration);
      let acknowledge!: () => void;
      record.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            acknowledge = resolve;
          }),
      );
      let done = false;
      let flush!: Promise<void>;
      act(() => {
        flush = result.current.flushBeforeComplete().then(() => {
          done = true;
        });
      });
      const final = lastCall();
      expect(final.payload.time_spent).toBe(duration / 1000);
      if (duration > FLUSH_INTERVAL_MS) expect(final.sessionId).toBe(callAt(0).sessionId);
      expect(done).toBe(false);

      const calls = record.mock.calls.length;
      await advance(FLUSH_INTERVAL_MS);
      window.dispatchEvent(new Event('pointerdown'));
      setVisibility('hidden');
      setVisibility('visible');
      window.dispatchEvent(new Event('pageshow'));
      await advance(5_000);
      expect(record).toHaveBeenCalledTimes(calls);
      await act(async () => {
        acknowledge();
        await flush;
      });
      expect(done).toBe(true);
      rerender(props('entry-1', { entryId: null }));
      unmount();
      expect(record).toHaveBeenCalledTimes(calls);
      expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    },
  );

  it('remonte un échec du flush obligatoire et reprend la même période pour réessayer', async () => {
    const { result, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(10_000);
    record.mockRejectedValueOnce(new Error('network down'));
    await act(async () => {
      await expect(result.current.flushBeforeComplete()).rejects.toThrow('network down');
    });
    const first = lastCall();
    act(() => result.current.resumeAfterFailure());
    await advance(5_000);
    await act(async () => {
      await result.current.flushBeforeComplete();
    });
    expect(lastCall().sessionId).toBe(first.sessionId);
    expect(lastCall().payload.time_spent).toBe(15);
    unmount();
  });

  it('ne supprime pas un flush final non acquitté à la réception d’un ancien acquittement', async () => {
    let acknowledgePeriodic!: () => void;
    record.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          acknowledgePeriodic = resolve;
        }),
    );
    const { result, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });
    await advance(35_000);
    record.mockRejectedValueOnce(new Error('network down'));
    await act(async () => {
      await expect(result.current.flushBeforeComplete()).rejects.toThrow('network down');
    });
    await act(async () => {
      acknowledgePeriodic();
    });
    const pending = JSON.parse(window.localStorage.getItem('learneo:content-time:pending') ?? '[]');
    expect(pending).toHaveLength(1);
    expect(pending[0].payload.time_spent).toBe(35);
    unmount();
  });

  it('clôt la période en cours et en ouvre une nouvelle au changement de contenu', async () => {
    const { rerender, unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(5_000);

    rerender(props('entry-2'));

    expect(record).toHaveBeenCalledTimes(1);
    const closed = callAt(0);
    expect(closed.entryId).toBe('entry-1');
    expect(closed.payload.time_spent).toBe(5);
    expect(closed.options).toEqual({ keepalive: true });

    // Le contenu suivant doit être compté sous une nouvelle période.
    await advance(FLUSH_INTERVAL_MS);

    const flushed = lastCall();
    expect(flushed.entryId).toBe('entry-2');
    expect(flushed.sessionId).not.toBe(closed.sessionId);

    unmount();
  });

  it("cesse de compter le temps quand l'onglet passe en arrière-plan", async () => {
    const { unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(10_000);

    setVisibility('hidden');
    await settle();

    expect(lastCall().payload.time_spent).toBe(10);

    // Deux sauvegardes périodiques plus tard, le total ne doit pas avoir bougé.
    await advance(2 * FLUSH_INTERVAL_MS);

    expect(lastCall().payload.time_spent).toBe(10);

    unmount();
  });

  it('reprend le décompte au retour depuis le bfcache', async () => {
    const { unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(5_000);

    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
      await Promise.resolve();
    });

    expect(lastCall().payload.time_spent).toBe(5);

    // Page gelée dans le bfcache : rien ne doit s'accumuler.
    await advance(60_000);
    expect(lastCall().payload.time_spent).toBe(5);

    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
      await Promise.resolve();
    });

    await advance(4_000);

    unmount();
    await settle();

    expect(lastCall().payload.time_spent).toBe(9);
  });

  it("rejoue au montage suivant une période dont l'envoi final a échoué", async () => {
    record.mockRejectedValueOnce(new Error('network down'));

    const first = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(5_000);

    first.unmount();
    await settle();

    expect(record).toHaveBeenCalledTimes(1);
    const lost = callAt(0);

    // Au-delà du délai de grâce, l'envoi n'est plus considéré comme en vol.
    await advance(PENDING_GRACE_MS + 1_000);

    const second = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-2'),
    });
    await settle();

    expect(record).toHaveBeenCalledTimes(2);
    const replayed = callAt(1);
    expect(replayed.sessionId).toBe(lost.sessionId);
    expect(replayed.payload).toEqual(lost.payload);

    second.unmount();
  });

  it('abandonne une période refusée définitivement par le serveur', async () => {
    record.mockRejectedValueOnce(Object.assign(new Error('Not Found'), { status: 404 }));

    const first = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(5_000);

    first.unmount();
    await settle();

    await advance(PENDING_GRACE_MS + 1_000);

    const second = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-2'),
    });
    await settle();

    expect(record).toHaveBeenCalledTimes(1);

    second.unmount();
  });

  it('ignore les périodes trop courtes pour être exploitables', async () => {
    const { unmount } = renderHook((p: Props) => useContentTimeTracker(p), {
      initialProps: props('entry-1'),
    });

    await advance(500);

    unmount();
    await settle();

    expect(record).not.toHaveBeenCalled();
  });
});
