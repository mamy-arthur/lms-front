import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrackedVideoPlayer from '../tracked-video-player';
import PortalContentRenderer from '../PortalContentRenderer';
import { portalVideoApi } from '@/shared/api/portal-video.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { Role } from '@/shared/constants/roles';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';

jest.mock('@/shared/api/portal-video.api', () => ({
  portalVideoApi: { get: jest.fn(), save: jest.fn() },
}));
jest.mock('../ScormPlayer', () => ({ __esModule: true, default: () => <div>SCORM</div> }));
const empty = {
  node_id: 'module',
  node_execution_id: 'execution',
  position: 270,
  duration: 600,
  watched_ranges: [],
  watched_seconds: 0,
  version: 1,
  last_commit_id: null,
};
const context = {
  enrollmentId: 'enrollment',
  courseId: 'course',
  competencyId: 'module',
  nodeExecutionId: 'execution',
  entryId: 'entry',
};
const execution = { node_execution_id: 'execution', expected_state_revision: 1 };

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'learner', name: 'Learner', email: 'learner@example.test', role: Role.TRAINEE },
    sessionId: 'session',
    simulatedRole: null,
  });
  useSimulationStore.setState({ phase: 'idle', epoch: 0 });
  jest.mocked(portalVideoApi.get).mockResolvedValue(empty);
  jest.mocked(portalVideoApi.save).mockImplementation(async (_c, p) => ({
    ...empty,
    ...p,
    version: p.version + 1,
    last_commit_id: p.commit_id,
  }));
});

it('affiche les contrôles natifs et avance ou recule de dix secondes depuis la position restaurée', async () => {
  const { container } = render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  const video = container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.loadedMetadata(video);
  expect(video.currentTime).toBe(270);
  expect(video.controls).toBe(true);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
  });
  expect(video.currentTime).toBe(280);
  expect(portalVideoApi.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ mediaId: 'media' }),
    expect.objectContaining({ position: 280, watched_ranges: [], node_execution_id: 'execution' }),
    expect.any(AbortSignal),
    false,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reculer de 10 secondes' }));
  });
  expect(video.currentTime).toBe(270);
  expect(portalVideoApi.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ mediaId: 'media' }),
    expect.objectContaining({ position: 270, watched_ranges: [], version: 2 }),
    expect.any(AbortSignal),
    false,
  );
  expect(video.paused).toBe(true);
});

it('superpose les contrôles au survol ou au focus clavier, avec une solution de repli pour les écrans tactiles', async () => {
  render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  const video = screen.getByLabelText('Vidéo de formation');
  const controls = screen.getByRole('group', { name: 'Déplacement dans la vidéo' });
  expect(controls.parentElement).toBe(video.parentElement);
  expect(video.parentElement).toHaveClass('relative', 'group/video');
  expect(controls).toHaveClass(
    'absolute',
    'pointer-events-none',
    'opacity-0',
    'group-hover/video:opacity-100',
    'group-focus-within/video:opacity-100',
    '[@media(hover:none)]:opacity-100',
  );
  for (const button of within(controls).getAllByRole('button')) {
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass(
      'pointer-events-none',
      'group-hover/video:pointer-events-auto',
      'group-focus-within/video:pointer-events-auto',
      '[@media(hover:none)]:pointer-events-auto',
    );
  }
});

it('suit plusieurs médias vidéo indépendamment, mais pas les fichiers audio ou PDF, et ne déclenche jamais la complétion en fin de lecture', async () => {
  const onCompleted = jest.fn();
  const entry: ApiPortalContentEntry = {
    id: 'entry',
    content_type_id: 'media-type',
    is_published: true,
    module_type: 'media',
    field_types: { files: 'media' },
    data: {
      files: [
        { id: 'video-1', url: '/one.mp4', mime_type: 'video/mp4' },
        { id: 'video-2', url: '/two.mp4', mime_type: 'video/mp4' },
        { id: 'audio', url: '/audio.mp3', mime_type: 'audio/mpeg' },
        { id: 'pdf', url: '/file.pdf', mime_type: 'application/pdf' },
      ],
    },
  };
  const { container } = render(
    <PortalContentRenderer
      entry={entry}
      isLoading={false}
      {...context}
      nodeExecutionId="execution"
      expectedStateRevision={1}
      readOnly={false}
      onScormCompleted={onCompleted}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(jest.mocked(portalVideoApi.get).mock.calls.map(([c]) => c.mediaId)).toEqual([
    'video-1',
    'video-2',
  ]);
  expect(container.querySelector('audio')).toBeInTheDocument();
  expect(screen.getByTitle('PDF')).toBeInTheDocument();
  const videos = container.querySelectorAll('video');
  videos.forEach((video) => {
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    fireEvent.loadedMetadata(video);
  });
  await act(async () => {
    fireEvent.click(screen.getAllByRole('button', { name: 'Avancer de 10 secondes' })[1]);
  });
  expect(videos[0].currentTime).toBe(270);
  expect(videos[1].currentTime).toBe(280);
  expect(portalVideoApi.save).toHaveBeenCalledTimes(1);
  expect(portalVideoApi.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ mediaId: 'video-2' }),
    expect.objectContaining({ position: 280, watched_ranges: [] }),
    expect.any(AbortSignal),
    false,
  );
  fireEvent.ended(videos[1]);
  expect(onCompleted).not.toHaveBeenCalled();
});

it('maintient le déplacement dans la vidéo disponible pendant les nouvelles tentatives et les conflits sans rétablir le bandeau de statut supprimé', async () => {
  jest.mocked(portalVideoApi.get).mockRejectedValueOnce(new Error('offline'));
  const { container } = render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  const video = container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  fireEvent.loadedMetadata(video);
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    fireEvent.online(window);
  });
  expect(portalVideoApi.get).toHaveBeenCalledTimes(2);
  jest.mocked(portalVideoApi.save).mockRejectedValueOnce({ status: 409 });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
  });
  expect(video.currentTime).toBe(280);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reculer de 10 secondes' }));
  });
  expect(video.currentTime).toBe(270);
  expect(portalVideoApi.save).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it.each(['simulation', 'history', 'missing-execution'])(
  'maintient la lecture disponible sans prétendre que le suivi est accessible en écriture en mode %s',
  async (mode) => {
    if (mode === 'simulation') useAuthStore.getState().setSimulatedRole(Role.TRAINEE);
    const { container } = render(
      <TrackedVideoPlayer
        src="/video.mp4"
        mediaId="media"
        context={context}
        execution={mode === 'missing-execution' ? null : execution}
        readOnly={mode === 'history'}
      />,
    );
    const video = container.querySelector('video')!;
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.loadedMetadata(video);
    const initialPosition = video.currentTime;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
    });
    expect(video.currentTime).toBe(initialPosition + 10);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reculer de 10 secondes' }));
    });
    expect(video.controls).toBe(true);
    expect(video.currentTime).toBe(initialPosition);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(portalVideoApi.save).not.toHaveBeenCalled();
    if (mode === 'simulation') {
      expect(portalVideoApi.get).not.toHaveBeenCalled();
      expect(localStorage.getItem('learneo:video-progress:v1')).toBeNull();
    }
  },
);

it('utilise le dernier callback de conflit sans recréer la session vidéo', async () => {
  const previousConflict = jest.fn();
  const currentConflict = jest.fn();
  const register = jest.fn(() => jest.fn());
  const props = {
    src: '/video.mp4',
    mediaId: 'media',
    context,
    execution,
    readOnly: false,
    registerVideoSession: register,
  };
  const { rerender } = render(
    <TrackedVideoPlayer {...props} onExecutionConflict={previousConflict} />,
  );
  const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await waitFor(() => expect(video.currentTime).toBe(270));
  rerender(<TrackedVideoPlayer {...props} onExecutionConflict={currentConflict} />);
  const error = { status: 409, json: { error_code: 'execution_conflict' } };
  jest.mocked(portalVideoApi.save).mockRejectedValueOnce(error);
  await act(async () => {
    video.currentTime = 280;
    fireEvent.seeking(video);
    fireEvent.seeked(video);
  });
  expect(currentConflict).toHaveBeenCalledTimes(1);
  expect(currentConflict).toHaveBeenCalledWith(error);
  expect(previousConflict).not.toHaveBeenCalled();
  expect(register).toHaveBeenCalledTimes(1);
  expect(portalVideoApi.get).toHaveBeenCalledTimes(1);
});

it('met à jour la révision d’exécution sans recharger ni rembobiner la vidéo', async () => {
  const unregister = jest.fn();
  const register = jest.fn(() => unregister);
  const { container, rerender, unmount } = render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
      registerVideoSession={register}
    />,
  );
  const video = container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.loadedMetadata(video);
  rerender(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={{ ...execution, expected_state_revision: 2 }}
      readOnly={false}
      registerVideoSession={register}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
  });
  expect(portalVideoApi.get).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledTimes(1);
  expect(portalVideoApi.save).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ expected_state_revision: 2 }),
    expect.any(AbortSignal),
    false,
  );
  unmount();
  expect(unregister).toHaveBeenCalledTimes(1);
});

it('lit les anciens médias sans identifiant sans envoyer de requête de progression invalide', async () => {
  const entry: ApiPortalContentEntry = {
    id: 'entry',
    content_type_id: 'media-type',
    is_published: true,
    module_type: 'media',
    field_types: { file: 'media' },
    data: { file: { url: '/video.mp4', mime_type: 'video/mp4' } },
  };
  const { container } = render(
    <PortalContentRenderer
      entry={entry}
      isLoading={false}
      {...context}
      nodeExecutionId="execution"
      expectedStateRevision={1}
      readOnly={false}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(container.querySelector('video')).toBeInTheDocument();
  expect(portalVideoApi.get).not.toHaveBeenCalled();
});

it('crée une nouvelle session pour une nouvelle visite du même nœud et de la même vidéo', async () => {
  const { container, rerender } = render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  const video = container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await act(async () => {
    await Promise.resolve();
  });
  expect(video.currentTime).toBe(270);
  jest
    .mocked(portalVideoApi.get)
    .mockResolvedValue({ ...empty, node_execution_id: 'execution-2', position: 0, version: 0 });
  rerender(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={{ ...context, nodeExecutionId: 'execution-2' }}
      execution={{ ...execution, node_execution_id: 'execution-2' }}
      readOnly={false}
    />,
  );
  await waitFor(() => expect(video.currentTime).toBe(0));
  expect(portalVideoApi.get).toHaveBeenLastCalledWith(
    expect.objectContaining({ nodeExecutionId: 'execution-2' }),
    expect.any(AbortSignal),
  );
  fireEvent.loadedMetadata(video);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
  });
  expect(portalVideoApi.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ nodeExecutionId: 'execution-2' }),
    expect.objectContaining({ node_execution_id: 'execution-2', version: 0 }),
    expect.any(AbortSignal),
    false,
  );
});

it.each([
  ['Reculer de 10 secondes', 4, 0],
  ['Avancer de 10 secondes', 595, 600],
] as const)('limite le déplacement « %s » aux bornes de la vidéo', async (name, start, end) => {
  render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.loadedMetadata(video);
  video.currentTime = start;
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
  expect(video.currentTime).toBe(end);
  expect(portalVideoApi.save).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ position: end, watched_ranges: [] }),
    expect.any(AbortSignal),
    false,
  );
});

it.each([NaN, Infinity, 0])(
  'désactive les boutons de déplacement en l’absence de durée finie strictement positive (%s)',
  async (duration) => {
    render(
      <TrackedVideoPlayer
        src="/video.mp4"
        mediaId="media"
        context={context}
        execution={execution}
        readOnly={false}
      />,
    );
    const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
    expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeDisabled();
    Object.defineProperty(video, 'duration', { configurable: true, value: duration });
    await act(async () => {
      fireEvent.loadedMetadata(video);
    });
    expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reculer de 10 secondes' })).toBeDisabled();
    expect(portalVideoApi.save).not.toHaveBeenCalled();
  },
);

it('permet l’activation au clavier sans mettre en pause ni redémarrer la lecture', async () => {
  const user = userEvent.setup();
  render(
    <TrackedVideoPlayer
      src="/video.mp4"
      mediaId="media"
      context={context}
      execution={execution}
      readOnly={false}
    />,
  );
  const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
  Object.defineProperties(video, {
    duration: { configurable: true, value: 600 },
    paused: { configurable: true, value: false },
  });
  video.play = jest.fn();
  video.pause = jest.fn();
  await act(async () => {
    fireEvent.loadedMetadata(video);
  });
  screen.getByRole('button', { name: 'Avancer de 10 secondes' }).focus();
  await user.keyboard('{Enter}');
  expect(video.currentTime).toBe(280);
  expect(video.play).not.toHaveBeenCalled();
  expect(video.pause).not.toHaveBeenCalled();
});

it('attend de nouvelles métadonnées lorsque la source change ou que la lecture devient indisponible', async () => {
  const props = { mediaId: 'media', context, execution, readOnly: false };
  const { rerender } = render(<TrackedVideoPlayer src="/one.mp4" {...props} />);
  const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  await act(async () => {
    fireEvent.loadedMetadata(video);
  });
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeEnabled();
  rerender(<TrackedVideoPlayer src="/two.mp4" {...props} />);
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeDisabled();
  await act(async () => {
    fireEvent.loadedMetadata(video);
  });
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeEnabled();
  fireEvent.emptied(video);
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeDisabled();
  fireEvent.durationChange(video);
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeEnabled();
  fireEvent.error(video);
  expect(screen.getByRole('button', { name: 'Avancer de 10 secondes' })).toBeDisabled();
});

it('ne suit pas une vidéo sans visite accessible en lecture', async () => {
  const entry: ApiPortalContentEntry = {
    id: 'entry',
    content_type_id: 'media-type',
    is_published: true,
    module_type: 'media',
    field_types: { file: 'media' },
    data: { file: { id: 'media', url: '/video.mp4', mime_type: 'video/mp4' } },
  };
  const { container } = render(
    <PortalContentRenderer
      entry={entry}
      isLoading={false}
      {...context}
      nodeExecutionId={null}
      expectedStateRevision={1}
      readOnly={false}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(container.querySelector('video')).toBeInTheDocument();
  expect(portalVideoApi.get).not.toHaveBeenCalled();
});

describe('plein écran avec les contrôles vidéo', () => {
  const restores: Array<() => void> = [];

  function property(target: object, key: string, value: unknown) {
    const original = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { configurable: true, value });
    restores.push(() => {
      if (original) Object.defineProperty(target, key, original);
      else Reflect.deleteProperty(target, key);
    });
  }

  async function mount() {
    const register = jest.fn(() => jest.fn());
    const view = render(
      <TrackedVideoPlayer
        src="/video.mp4"
        mediaId="media"
        context={context}
        execution={execution}
        readOnly={false}
        registerVideoSession={register}
      />,
    );
    const video = screen.getByLabelText<HTMLVideoElement>('Vidéo de formation');
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    await act(async () => {
      fireEvent.loadedMetadata(video);
    });
    return { ...view, video, wrapper: video.parentElement!, register };
  }

  afterEach(() => {
    cleanup();
    restores
      .splice(0)
      .reverse()
      .forEach((restore) => restore());
  });

  it('demande le plein écran sur le conteneur et conserve la même vidéo, les boutons de déplacement et la session de suivi', async () => {
    const { video, wrapper, register } = await mount();
    const request = jest.fn(async () => {
      property(document, 'fullscreenElement', wrapper);
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    const exit = jest.fn(async () => {
      property(document, 'fullscreenElement', null);
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    property(wrapper, 'requestFullscreen', request);
    property(document, 'exitFullscreen', exit);
    expect(video).toHaveAttribute('controlslist', 'nofullscreen');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Afficher en plein écran' }));
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('fixed', 'inset-0');
    expect(wrapper).not.toHaveClass('relative');
    expect(video).toHaveClass('h-full', 'object-contain');
    expect(video).not.toHaveClass('max-h-[70vh]');
    expect(wrapper).toContainElement(
      screen.getByRole('button', { name: 'Reculer de 10 secondes' }),
    );
    expect(wrapper).toContainElement(
      screen.getByRole('button', { name: 'Avancer de 10 secondes' }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Avancer de 10 secondes' }));
    });
    expect(video.currentTime).toBe(280);
    expect(portalVideoApi.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ nodeExecutionId: 'execution' }),
      expect.objectContaining({ position: 280, watched_ranges: [] }),
      expect.any(AbortSignal),
      false,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitter le plein écran' }));
    });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('relative');
    expect(screen.getByLabelText('Vidéo de formation')).toBe(video);
    expect(video.currentTime).toBe(280);
    expect(register).toHaveBeenCalledTimes(1);
    expect(portalVideoApi.get).toHaveBeenCalledTimes(1);
  });

  it('réagit aux événements de sortie du navigateur et ignore le plein écran sur les éléments sans rapport', async () => {
    const { wrapper } = await mount();
    property(document, 'fullscreenElement', wrapper);
    fireEvent(document, new Event('fullscreenchange'));
    expect(screen.getByRole('button', { name: 'Quitter le plein écran' })).toBeInTheDocument();
    property(document, 'fullscreenElement', null);
    fireEvent(document, new Event('fullscreenchange'));
    expect(screen.getByRole('button', { name: 'Afficher en plein écran' })).toBeInTheDocument();
    property(document, 'fullscreenElement', document.body);
    fireEvent(document, new Event('fullscreenchange'));
    expect(wrapper).not.toHaveClass('fixed');
  });

  it.each(['absent', 'rejected'])(
    'conserve les contrôles dans une surcouche couvrant la fenêtre lorsque l’API de plein écran est dans l’état %s',
    async (mode) => {
      const { video, wrapper } = await mount();
      property(
        wrapper,
        'requestFullscreen',
        mode === 'absent' ? undefined : jest.fn().mockRejectedValue(new Error('denied')),
      );
      property(wrapper, 'webkitRequestFullscreen', undefined);
      const overflow = document.body.style.overflow;
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Afficher en plein écran' }));
      });
      expect(wrapper).toHaveClass('fixed', 'inset-0');
      expect(document.body.style.overflow).toBe('hidden');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Reculer de 10 secondes' }));
      });
      expect(video.currentTime).toBe(260);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(wrapper).not.toHaveClass('fixed');
      expect(document.body.style.overflow).toBe(overflow);
      expect(screen.getByRole('button', { name: 'Afficher en plein écran' })).toHaveFocus();
    },
  );

  it('prend en charge l’API préfixée du conteneur sans activer le plein écran limité à la vidéo', async () => {
    const { wrapper } = await mount();
    property(document, 'fullscreenElement', undefined);
    property(wrapper, 'requestFullscreen', undefined);
    const request = jest.fn(() => {
      property(document, 'webkitFullscreenElement', wrapper);
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    });
    const exit = jest.fn(() => {
      property(document, 'webkitFullscreenElement', null);
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    });
    property(wrapper, 'webkitRequestFullscreen', request);
    property(document, 'exitFullscreen', undefined);
    property(document, 'webkitExitFullscreen', exit);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Afficher en plein écran' }));
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('fixed');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitter le plein écran' }));
    });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(wrapper).not.toHaveClass('fixed');
  });

  it('étend le plein écran natif de la vidéo au conteneur si le navigateur ignore nofullscreen', async () => {
    const { video, wrapper } = await mount();
    const request = jest.fn(async () => {
      property(document, 'fullscreenElement', wrapper);
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    property(wrapper, 'requestFullscreen', request);
    property(document, 'fullscreenElement', video);
    await act(async () => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('fixed');
    expect(wrapper).toContainElement(
      screen.getByRole('button', { name: 'Avancer de 10 secondes' }),
    );
  });

  it('quitte le plein écran limité à la vidéo avant d’utiliser la surcouche lorsque le plein écran du conteneur est refusé', async () => {
    const { video, wrapper } = await mount();
    property(wrapper, 'requestFullscreen', jest.fn().mockRejectedValue(new Error('denied')));
    const exit = jest.fn(async () => {
      property(document, 'fullscreenElement', null);
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    property(document, 'exitFullscreen', exit);
    property(document, 'fullscreenElement', video);
    await act(async () => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('fixed');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitter le plein écran' }));
    });
    expect(wrapper).not.toHaveClass('fixed');
  });

  it('quitte le plein écran limité à la vidéo de Safari et rétablit le défilement au démontage', async () => {
    const { video, wrapper, unmount } = await mount();
    const exit = jest.fn();
    property(video, 'webkitExitFullscreen', exit);
    const overflow = document.body.style.overflow;
    fireEvent(video, new Event('webkitbeginfullscreen'));
    expect(exit).toHaveBeenCalledTimes(1);
    expect(wrapper).toHaveClass('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(overflow);
  });
});
