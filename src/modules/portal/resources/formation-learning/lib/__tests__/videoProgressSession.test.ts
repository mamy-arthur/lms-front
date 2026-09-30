import {
  portalVideoApi,
  type VideoProgress,
  type VideoProgressContext,
} from '@/shared/api/portal-video.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { Role } from '@/shared/constants/roles';
import { VideoProgressSession, mergeWatchedRanges } from '../videoProgressSession';

jest.mock('@/shared/api/portal-video.api', () => ({
  portalVideoApi: { get: jest.fn(), save: jest.fn() },
}));
const get = jest.mocked(portalVideoApi.get);
const save = jest.mocked(portalVideoApi.save);
const context: VideoProgressContext = {
  enrollmentId: 'enrollment',
  courseId: 'course',
  entryId: 'entry',
  competencyId: 'module',
  nodeExecutionId: 'execution',
  mediaId: 'video',
};
const execution = { node_execution_id: 'execution', expected_state_revision: 1 };
const empty: VideoProgress = {
  node_id: 'module',
  node_execution_id: 'execution',
  position: 0,
  duration: 600,
  watched_ranges: [],
  watched_seconds: 0,
  version: 0,
  last_commit_id: null,
};
const user = {
  id: 'learner-a',
  name: 'Learner',
  email: 'learner@example.test',
  role: Role.TRAINEE,
};
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

describe('progression de la vidéo native', () => {
  let video: HTMLVideoElement;
  let session: VideoProgressSession;
  let status: jest.Mock;
  let onExecutionConflict: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    jest.clearAllMocks();
    useAuthStore.setState({ user, sessionId: 'session-a', simulatedRole: null });
    useTenantStore.setState({ tenant: null });
    useSimulationStore.setState({ epoch: 0, phase: 'idle' });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    video = document.createElement('video');
    Object.defineProperties(video, {
      duration: { configurable: true, writable: true, value: 600 },
      paused: { configurable: true, writable: true, value: true },
      readyState: { configurable: true, writable: true, value: 4 },
      seeking: { configurable: true, writable: true, value: false },
    });
    video.pause = jest.fn(() => {
      Object.assign(video, { paused: true });
      video.dispatchEvent(new Event('pause'));
    });
    status = jest.fn();
    onExecutionConflict = jest.fn();
    get.mockResolvedValue({ ...empty });
    save.mockImplementation(async (_context, payload) => ({
      ...empty,
      ...payload,
      version: payload.version + 1,
      last_commit_id: payload.commit_id,
    }));
    session = new VideoProgressSession(
      video,
      context,
      execution,
      false,
      status,
      onExecutionConflict,
    );
  });

  afterEach(async () => {
    session.dispose();
    await settle();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  function event(name: string) {
    video.dispatchEvent(new Event(name));
  }
  function play() {
    Object.assign(video, { paused: false });
    event('play');
    event('playing');
  }
  function seconds(count: number) {
    for (let i = 0; i < count; i++) {
      video.currentTime++;
      jest.advanceTimersByTime(1000);
    }
  }
  function seek(time: number) {
    Object.assign(video, { seeking: true });
    video.currentTime = time;
    event('seeking');
    Object.assign(video, { seeking: false });
    event('seeked');
  }

  it('restaure la position à 4:30 uniquement lorsque les métadonnées sont disponibles, sans lecture automatique', async () => {
    Object.assign(video, { duration: NaN });
    get.mockResolvedValue({ ...empty, position: 270, version: 1 });
    session.start();
    await settle();
    expect(video.currentTime).toBe(0);
    Object.assign(video, { duration: 600 });
    event('loadedmetadata');
    expect(video.currentTime).toBe(270);
    expect(video.paused).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('ne fait pas reculer un apprenant ayant déjà commencé la lecture pendant une récupération lente', async () => {
    let resolve!: (value: VideoProgress) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    session.start();
    play();
    seconds(2);
    resolve({ ...empty, position: 270, version: 1 });
    await settle();
    expect(video.currentTime).toBe(2);
    await session.flush();
    expect(save).toHaveBeenLastCalledWith(
      context,
      expect.objectContaining({ position: 2, version: 1 }),
      expect.any(AbortSignal),
      false,
    );
  });

  it('sauvegarde toutes les dix secondes et à la pause avec les intervalles réellement visionnés', async () => {
    session.start();
    await settle();
    play();
    seconds(10);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][1]).toMatchObject({ position: 10, watched_ranges: [[0, 10]] });
    seconds(2);
    video.pause();
    await settle();
    expect(save.mock.calls[1][1]).toMatchObject({
      position: 12,
      version: 1,
      watched_ranges: [[10, 12]],
    });
    jest.advanceTimersByTime(30_000);
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('permet d’avancer, de reculer et de recommencer à zéro sans comptabiliser les segments sautés', async () => {
    session.start();
    await settle();
    play();
    seconds(3);
    seek(270);
    await settle();
    expect(save.mock.calls[0][1]).toMatchObject({ position: 270, watched_ranges: [[0, 3]] });
    seconds(2);
    seek(1);
    await settle();
    expect(save.mock.calls[1][1]).toMatchObject({ position: 1, watched_ranges: [[270, 272]] });
    session.restart();
    await settle();
    expect(save.mock.calls[2][1]).toMatchObject({ position: 0, watched_ranges: [] });
  });

  it('n’enregistre aucun intervalle visionné lors de la sauvegarde d’un déplacement jusqu’à la fin', async () => {
    session.start();
    await settle();
    seek(600);
    event('ended');
    await settle();
    expect(save.mock.calls[0][1]).toMatchObject({ position: 600, watched_ranges: [] });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('sauvegarde immédiatement les déplacements par bouton sans comptabiliser les intervalles sautés', async () => {
    session.start();
    await settle();
    play();
    seconds(3);
    session.seekBy(10);
    await settle();
    expect(video.currentTime).toBe(13);
    expect(save.mock.calls[0][1]).toMatchObject({ position: 13, watched_ranges: [[0, 3]] });
    seconds(2);
    session.seekBy(-10);
    await settle();
    expect(video.currentTime).toBe(5);
    expect(save.mock.calls[1][1]).toMatchObject({ position: 5, watched_ranges: [[13, 15]] });
    expect(video.paused).toBe(false);
  });

  it('n’annule pas un déplacement par bouton lorsque la position de reprise initiale arrive tardivement', async () => {
    let resolve!: (value: VideoProgress) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    session.start();
    session.seekBy(10);
    expect(video.currentTime).toBe(10);
    resolve({ ...empty, position: 270, version: 1 });
    await settle();
    expect(video.currentTime).toBe(10);
    expect(save.mock.lastCall?.[1]).toMatchObject({ position: 10, version: 1, watched_ranges: [] });
    expect(video.paused).toBe(true);
  });

  it('ignore les déplacements par bouton pendant la complétion et après la destruction de la session', async () => {
    session.start();
    await settle();
    await session.prepareCompletion();
    session.seekBy(10);
    expect(video.currentTime).toBe(0);
    expect(save).not.toHaveBeenCalled();
    session.resumeAfterFailure();
    session.seekBy(10);
    await settle();
    expect(video.currentTime).toBe(10);
    session.dispose();
    session.seekBy(10);
    expect(video.currentTime).toBe(10);
  });

  it.each([NaN, Infinity, 0])(
    'ignore les déplacements par bouton avec une durée de %s',
    async (duration) => {
      Object.assign(video, { duration });
      session.start();
      await settle();
      session.seekBy(10);
      expect(video.currentTime).toBe(0);
      expect(save).not.toHaveBeenCalled();
    },
  );

  it('ne comptabilise pas les sauts non signalés, la mise en mémoire tampon, les onglets masqués ni les pauses', async () => {
    session.start();
    await settle();
    play();
    seconds(1);
    video.currentTime = 100;
    jest.advanceTimersByTime(1000);
    event('waiting');
    seconds(3);
    event('playing');
    seconds(1);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    seconds(3);
    video.pause();
    await settle();
    const ranges = save.mock.calls.flatMap(([, payload]) => payload.watched_ranges);
    expect(mergeWatchedRanges(ranges)).toEqual([
      [0, 1],
      [103, 104],
    ]);
  });

  it('accepte une lecture réellement accélérée sans la traiter comme un déplacement', async () => {
    session.start();
    await settle();
    video.playbackRate = 2;
    play();
    video.currentTime = 2;
    jest.advanceTimersByTime(1000);
    await session.flush();
    expect(save.mock.calls[0][1].watched_ranges).toEqual([[0, 2]]);
  });

  it.each(['pagehide', 'dispose'])('sauvegarde avec keepalive lors de %s', async (exit) => {
    session.start();
    await settle();
    play();
    seconds(2);
    if (exit === 'dispose') session.dispose();
    else window.dispatchEvent(new Event('pagehide'));
    await settle();
    expect(save).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ position: 2 }),
      expect.any(AbortSignal),
      true,
    );
  });

  it('sérialise une sauvegarde périodique en cours et le dernier déplacement en arrière', async () => {
    let resolve!: (value: VideoProgress) => void;
    save.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    session.start();
    await settle();
    play();
    seconds(10);
    seek(2);
    expect(save).toHaveBeenCalledTimes(1);
    resolve({ ...empty, version: 1, last_commit_id: save.mock.calls[0][1].commit_id });
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][1]).toMatchObject({ position: 2, version: 1 });
  });

  it('réessaie le même envoi après un échec, puis sauvegarde la position la plus récente', async () => {
    save.mockRejectedValueOnce(new Error('offline'));
    session.start();
    await settle();
    play();
    seconds(10);
    await settle();
    expect(status).toHaveBeenCalledWith('retrying');
    seek(2);
    await settle();
    expect(save.mock.calls[1][1]).toEqual(save.mock.calls[0][1]);
    expect(save.mock.calls[2][1]).toMatchObject({ position: 2, version: 1 });
    expect(video.paused).toBe(false);
  });

  it('restaure la position locale en attente après une actualisation et la perte d’un accusé de réception', async () => {
    save.mockRejectedValue(new Error('offline'));
    session.start();
    await settle();
    seek(270);
    await settle();
    session.dispose();
    await settle();
    const payload = save.mock.calls[0][1];
    get.mockResolvedValue({
      ...empty,
      position: 270,
      version: 1,
      last_commit_id: payload.commit_id,
    });
    save.mockImplementation(async (_c, p) => ({
      ...empty,
      ...p,
      version: p.version + 1,
      last_commit_id: p.commit_id,
    }));
    video.currentTime = 0;
    session = new VideoProgressSession(video, context, execution, false, status);
    session.start();
    await settle();
    expect(video.currentTime).toBe(270);
    expect(save.mock.lastCall?.[1].version).toBe(1);
  });

  it('n’écrase pas une position de reprise serveur plus récente avec un ancien brouillon local', async () => {
    save.mockRejectedValue(new Error('offline'));
    session.start();
    await settle();
    seek(270);
    await settle();
    session.dispose();
    await settle();
    save.mockClear();
    get.mockResolvedValue({ ...empty, position: 20, version: 5, last_commit_id: 'other-tab' });
    video.currentTime = 0;
    session = new VideoProgressSession(video, context, execution, false, status);
    session.start();
    await settle();
    expect(video.currentTime).toBe(20);
    expect(save).not.toHaveBeenCalled();
  });

  it('conserve les intervalles visionnés récupérés lorsque la lecture commence avant la fin de la récupération', async () => {
    save.mockRejectedValue(new Error('offline'));
    session.start();
    await settle();
    play();
    seconds(3);
    await session.flush();
    session.dispose();
    await settle();
    save.mockClear();
    video.currentTime = 0;
    let resolve!: (value: VideoProgress) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    save.mockImplementation(async (_c, p) => ({
      ...empty,
      ...p,
      version: p.version + 1,
      last_commit_id: p.commit_id,
    }));
    session = new VideoProgressSession(video, context, execution, false, status);
    session.start();
    seek(100);
    play();
    seconds(2);
    resolve(empty);
    await settle();
    await session.flush();
    expect(video.currentTime).toBe(102);
    expect(save.mock.lastCall?.[1]).toMatchObject({
      position: 102,
      watched_ranges: [
        [0, 3],
        [100, 102],
      ],
    });
  });

  it('sauvegarde l’instantané final lorsque la récupération initiale se termine après le démontage', async () => {
    let resolve!: (value: VideoProgress) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    session.start();
    play();
    seconds(2);
    session.dispose();
    video.currentTime = 0;
    Object.assign(video, { duration: 10 });
    resolve(empty);
    await settle();
    expect(save).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ position: 2, duration: 600, watched_ranges: [[0, 2]] }),
      expect.any(AbortSignal),
      true,
    );
  });

  it('attend la récupération initiale et la sauvegarde finale avant la complétion', async () => {
    let resolve!: (value: VideoProgress) => void;
    get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    session.start();
    play();
    seconds(2);
    const completed = jest.fn();
    const completion = session.prepareCompletion().then(completed);
    await settle();
    expect(completed).not.toHaveBeenCalled();
    resolve(empty);
    await completion;
    expect(save.mock.lastCall?.[1]).toMatchObject({ position: 2, watched_ranges: [[0, 2]] });
  });

  it('fige le suivi pendant la complétion et ne le reprend qu’après un échec', async () => {
    session.start();
    await settle();
    play();
    seconds(2);
    await session.prepareCompletion();
    save.mockClear();
    play();
    seconds(3);
    seek(40);
    await settle();
    expect(video.paused).toBe(true);
    expect(save).not.toHaveBeenCalled();
    session.resumeAfterFailure();
    play();
    seconds(2);
    await session.flush();
    expect(save.mock.lastCall?.[1]).toMatchObject({ position: 42, watched_ranges: [[40, 42]] });
  });

  it.each([Infinity, NaN, 0, 604801])(
    'n’envoie pas la durée vidéo invalide %s',
    async (duration) => {
      Object.assign(video, { duration });
      session.start();
      await settle();
      play();
      seconds(2);
      video.pause();
      await settle();
      expect(save).not.toHaveBeenCalled();
      expect(localStorage.getItem('learneo:video-progress:v1')).toBeNull();
    },
  );

  it.each(['node', 'visit'])(
    'ne rejoue jamais le brouillon d’un autre contexte %s pour la même vidéo',
    async (scope) => {
      save.mockRejectedValue(new Error('offline'));
      session.start();
      await settle();
      seek(270);
      await settle();
      session.dispose();
      await settle();
      const originalDrafts = localStorage.getItem('learneo:video-progress:v1');
      save.mockClear();
      video.currentTime = 0;
      const nextContext = {
        ...context,
        competencyId: scope === 'node' ? 'module-2' : context.competencyId,
        nodeExecutionId: 'execution-2',
      };
      get.mockResolvedValue({
        ...empty,
        node_id: nextContext.competencyId,
        node_execution_id: nextContext.nodeExecutionId,
      });
      session = new VideoProgressSession(
        video,
        nextContext,
        { ...execution, node_execution_id: nextContext.nodeExecutionId },
        false,
        status,
      );
      session.start();
      await settle();
      expect(video.currentTime).toBe(0);
      expect(save).not.toHaveBeenCalled();
      expect(localStorage.getItem('learneo:video-progress:v1')).toBe(originalDrafts);
      seek(30);
      await settle();
      expect(save.mock.lastCall?.[0]).toEqual(nextContext);
      expect(save.mock.lastCall?.[1]).toMatchObject({
        competency_id: nextContext.competencyId,
        node_execution_id: 'execution-2',
        position: 30,
        watched_ranges: [],
        version: 0,
      });
      expect(
        Object.keys(JSON.parse(localStorage.getItem('learneo:video-progress:v1')!)),
      ).toHaveLength(2);
    },
  );

  it.each(['node_id', 'node_execution_id'] as const)(
    'rejette une réponse de lecture avec un autre %s',
    async (field) => {
      get.mockResolvedValue({ ...empty, position: 270, [field]: 'other' });
      session.start();
      await settle();
      expect(video.currentTime).toBe(0);
      expect(status).toHaveBeenLastCalledWith('conflict');
      play();
      seconds(20);
      await settle();
      expect(save).not.toHaveBeenCalled();
    },
  );

  it('rejette un accusé de réception provenant d’une autre visite', async () => {
    save.mockResolvedValue({ ...empty, node_execution_id: 'other', version: 1 });
    session.start();
    await settle();
    seek(20);
    await settle();
    expect(status).toHaveBeenLastCalledWith('conflict');
    seek(40);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('ne permet pas de réutiliser une session avec le contexte de mutation d’une autre visite', async () => {
    session.start();
    await settle();
    session.updateExecution({ ...execution, node_execution_id: 'execution-2' });
    seek(270);
    await settle();
    expect(save).not.toHaveBeenCalled();
  });

  it('ignore les anciens brouillons sans identifiant de nœud ou de visite', async () => {
    const oldKey = JSON.stringify([
      null,
      user.id,
      context.enrollmentId,
      context.courseId,
      context.entryId,
      context.mediaId,
    ]);
    localStorage.setItem(
      'learneo:video-progress:v1',
      JSON.stringify({
        [oldKey]: {
          position: 270,
          duration: 600,
          ranges: [[0, 270]],
          version: 0,
          pendingCommitId: null,
          updatedAt: Date.now(),
        },
      }),
    );
    session.start();
    await settle();
    expect(video.currentTime).toBe(0);
    expect(save).not.toHaveBeenCalled();
  });

  it('arrête les écritures en conflit sans interrompre la lecture', async () => {
    save.mockRejectedValue({ status: 409 });
    session.start();
    await settle();
    play();
    seek(30);
    await settle();
    seconds(20);
    await settle();
    expect(save).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith('conflict');
    expect(video.paused).toBe(false);
  });

  describe.each([
    { status: 409, json: { error_code: 'execution_conflict' } },
    { status: 422, json: { errors: { node_execution_id: ['Visite invalide'] } } },
    { status: 422, json: { errors: { expected_state_revision: ['Révision invalide'] } } },
  ])('refus du contexte d’exécution ($status)', (error) => {
    it.each(['lecture', 'sauvegarde'])('propage le refus de %s sans le rejouer', async (step) => {
      if (step === 'lecture') get.mockRejectedValueOnce(error);
      else save.mockRejectedValueOnce(error);
      session.start();
      await settle();
      seek(30);
      await settle();
      expect(onExecutionConflict).toHaveBeenCalledTimes(1);
      expect(onExecutionConflict).toHaveBeenCalledWith(error);
      expect(status).toHaveBeenLastCalledWith('conflict');
      expect(JSON.parse(localStorage.getItem('learneo:video-progress:v1') ?? '{}')).toEqual({});
      session.updateExecution({ ...execution, expected_state_revision: 2 });
      seek(40);
      window.dispatchEvent(new Event('online'));
      jest.advanceTimersByTime(20_000);
      await settle();
      expect(get).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledTimes(step === 'lecture' ? 0 : 1);
      expect(onExecutionConflict).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    { status: 409, json: { error_code: 'video_progress_conflict' } },
    { status: 422, json: { errors: { position: ['Position invalide'] } } },
    { status: 403 },
    { status: 408 },
    { status: 429 },
    { status: 500 },
    new Error('offline'),
  ])('ne déclenche pas de récupération du contexte pour une autre erreur (%j)', async (error) => {
    save.mockRejectedValueOnce(error);
    session.start();
    await settle();
    seek(30);
    await settle();
    expect(onExecutionConflict).not.toHaveBeenCalled();
  });

  it('ignore un refus d’exécution reçu après la révocation de la session', async () => {
    let reject!: (error: unknown) => void;
    get.mockReturnValueOnce(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    session.start();
    useAuthStore.getState().clearAuth();
    reject({ status: 409, json: { error_code: 'execution_conflict' } });
    await settle();
    expect(onExecutionConflict).not.toHaveBeenCalled();
  });

  it('réessaie les lectures échouées sans réinitialiser la lecture vidéo en cas de succès tardif', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    session.start();
    await settle();
    play();
    seconds(10);
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
    expect(video.currentTime).toBe(10);
    expect(status).toHaveBeenLastCalledWith('ready');
  });

  it.each(['logout', 'simulation', 'transition', 'tenant'])(
    'révoque immédiatement l’ancien suivi lors de %s',
    async (boundary) => {
      session.start();
      await settle();
      play();
      seconds(2);
      if (boundary === 'logout') useAuthStore.getState().clearAuth();
      if (boundary === 'simulation') useAuthStore.getState().setSimulatedRole(Role.TRAINEE);
      if (boundary === 'transition') useSimulationStore.setState({ phase: 'transition', epoch: 1 });
      if (boundary === 'tenant')
        useTenantStore.setState({
          tenant: { id: 'other' } as NonNullable<
            ReturnType<typeof useTenantStore.getState>['tenant']
          >,
        });
      video.pause();
      session.dispose();
      await settle();
      expect(save).not.toHaveBeenCalled();
    },
  );

  it('ne lit ni n’écrit jamais de progression en simulation', async () => {
    useAuthStore.getState().setSimulatedRole(Role.TRAINEE);
    session.start();
    play();
    seconds(20);
    seek(270);
    await settle();
    expect(get).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(localStorage.getItem('learneo:video-progress:v1')).toBeNull();
  });

  it.each(['learner', 'enrollment', 'media'])(
    'ne restaure pas le brouillon en attente d’un autre contexte %s',
    async (scope) => {
      save.mockRejectedValue(new Error('offline'));
      session.start();
      await settle();
      seek(270);
      await settle();
      session.dispose();
      await settle();
      save.mockClear();
      video.currentTime = 0;
      if (scope === 'learner')
        useAuthStore.setState({ user: { ...user, id: 'learner-b' }, sessionId: 'session-b' });
      session = new VideoProgressSession(
        video,
        {
          ...context,
          enrollmentId: scope === 'enrollment' ? 'other' : context.enrollmentId,
          mediaId: scope === 'media' ? 'other' : context.mediaId,
        },
        execution,
        false,
        status,
      );
      session.start();
      await settle();
      expect(video.currentTime).toBe(0);
      expect(save).not.toHaveBeenCalled();
    },
  );

  it('maintient la lecture historique en lecture seule tout en permettant la reprise et le redémarrage', async () => {
    get.mockResolvedValue({ ...empty, position: 270, version: 1 });
    session = new VideoProgressSession(video, context, execution, true, status);
    session.start();
    await settle();
    expect(video.currentTime).toBe(270);
    play();
    seconds(10);
    session.restart();
    await settle();
    expect(video.currentTime).toBe(0);
    expect(save).not.toHaveBeenCalled();
  });

  it('envoie les données en attente et met en pause avant la complétion manuelle, même en cas de panne réseau', async () => {
    save.mockRejectedValue(new Error('offline'));
    session.start();
    await settle();
    play();
    seconds(2);
    await expect(session.prepareCompletion()).resolves.toBeUndefined();
    expect(save).toHaveBeenCalled();
    expect(video.paused).toBe(true);
  });

  it('fusionne les chevauchements sans combler les intervalles non visionnés', () => {
    expect(
      mergeWatchedRanges([
        [10, 20],
        [0, 5],
        [3, 8],
        [15, 25],
        [25, 30],
      ]),
    ).toEqual([
      [0, 8],
      [10, 30],
    ]);
  });
});
