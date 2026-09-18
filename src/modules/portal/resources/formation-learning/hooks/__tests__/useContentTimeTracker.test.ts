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
  enrollmentId: string | null;
  courseId: string | null;
  entryId: string | null;
  competencyId: string | null;
  idleDetection: boolean;
}

function props(entryId: string, overrides: Partial<Props> = {}): Props {
  return {
    enrollmentId: 'enrollment-1',
    courseId: 'course-1',
    entryId,
    competencyId: 'competency-1',
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
