import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  portalScormApi,
  type ApiScormLaunch,
  type ApiScormTrackingState,
  type ScormVersion,
} from '@/shared/api/portal-scorm.api';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { ScormSession } from '../../lib/scormRuntime';
import ScormPlayer from '../ScormPlayer';

jest.mock('@/shared/api/portal-scorm.api', () => ({
  portalScormApi: {
    launch: jest.fn(),
    getTracking: jest.fn(),
    commitTracking: jest.fn(),
    getTrackingSequence: jest.fn(),
  },
}));

// Track construction while keeping the ordinary runtime real for regression tests.
jest.mock('../../lib/scormRuntime', () => {
  const actual =
    jest.requireActual<typeof import('../../lib/scormRuntime')>('../../lib/scormRuntime');
  return {
    ...actual,
    ScormSession: jest.fn((options) => new actual.ScormSession(options)),
  };
});

const mockApi = jest.mocked(portalScormApi);
const initialAuth = useAuthStore.getState();
const initialSimulation = useSimulationStore.getState();
const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch');
const originalBeacon = Object.getOwnPropertyDescriptor(navigator, 'sendBeacon');
const mockFetch = jest.fn();
const mockBeacon = jest.fn();
const queryClients: QueryClient[] = [];
const globals = window as unknown as Record<
  string,
  Record<string, (...args: string[]) => string> | undefined
>;
const notice = 'Lecture seule — aucun score, temps ou progression enregistré.';
const errorText = 'Impossible de charger le contenu SCORM.';
const props = {
  enrollmentId: 'demo-enrollment',
  competencyId: 'demo-competency',
  courseId: 'demo-course',
  entryId: 'demo-entry',
};
const assetUrl =
  '/api/v1/role-simulation/training/learning-paths/12345678-1234-4123-8123-123456789abc/entries/12345678-1234-4123-8123-123456789def/scorm/assets/payload.signature/index.html';
const launch: ApiScormLaunch = {
  enrollment_id: props.enrollmentId,
  competency_id: props.competencyId,
  content_entry_id: props.entryId,
  scorm_package_id: 'demo-package',
  version: '1.2',
  launch_path: 'index.html',
  launch_url: assetUrl,
  read_only: true,
};
const tracking: ApiScormTrackingState = {
  enrollment_id: 'real-enrollment',
  competency_id: 'real-competency',
  content_entry_id: 'real-entry',
  lesson_status: 'incomplete',
  score_raw: null,
  score_min: null,
  score_max: null,
  session_time: 0,
  total_time: 0,
  cmi_data: {},
  last_commit_id: null,
  last_sequence: 0,
  updated_at: null,
};

function setActor(simulatedRole: Role | null = Role.TRAINEE, realRole = Role.EDITOR) {
  useAuthStore.setState({
    user: {
      id: 'real-user-secret',
      name: 'Identité réelle',
      email: 'real@example.test',
      role: realRole,
    },
    role: simulatedRole ?? realRole,
    simulatedRole,
  });
  useSimulationStore.setState({ phase: 'ready', epoch: 0 });
}

function mount(onCompleted = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  queryClients.push(client);
  const ui = (entryId = props.entryId) => (
    <QueryClientProvider client={client}>
      <ScormPlayer {...props} entryId={entryId} onCompleted={onCompleted} />
    </QueryClientProvider>
  );
  return { ...render(ui()), ui, onCompleted };
}

function noTracking() {
  expect(ScormSession).not.toHaveBeenCalled();
  expect(mockApi.getTracking).not.toHaveBeenCalled();
  expect(mockApi.commitTracking).not.toHaveBeenCalled();
  expect(mockApi.getTrackingSequence).not.toHaveBeenCalled();
}

beforeEach(() => {
  jest.clearAllMocks();
  setActor();
  mockApi.launch.mockResolvedValue({ data: launch });
  mockApi.getTracking.mockResolvedValue({ data: tracking });
  mockApi.commitTracking.mockResolvedValue({
    data: { ...tracking, lesson_status: 'completed', last_sequence: 1 },
  });
  Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: mockFetch });
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: mockBeacon });
  jest.spyOn(global, 'XMLHttpRequest');
});

afterEach(() => {
  cleanup();
  for (const client of queryClients.splice(0)) client.clear();
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockBeacon).not.toHaveBeenCalled();
  expect(XMLHttpRequest).not.toHaveBeenCalled();
  delete globals.API;
  delete globals.API_1484_11;
  useAuthStore.setState(initialAuth, true);
  useSimulationStore.setState(initialSimulation, true);
  localStorage.clear();
  jest.restoreAllMocks();
  if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch);
  else Reflect.deleteProperty(global, 'fetch');
  if (originalBeacon) Object.defineProperty(navigator, 'sendBeacon', originalBeacon);
  else Reflect.deleteProperty(navigator, 'sendBeacon');
});

describe('ScormPlayer read-only real packages', () => {
  it.each<ScormVersion>(['1.2', '2004'])(
    'binds %s before assigning src; never tracks or completes, including unload/remount',
    async (version) => {
      const url = `${window.location.origin}${assetUrl}`;
      mockApi.launch.mockResolvedValue({ data: { ...launch, version, launch_url: url } });
      const property = version === '1.2' ? 'API' : 'API_1484_11';
      const assignments: { value: string; bound: boolean }[] = [];
      const original = Element.prototype.setAttribute;
      jest.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (
        this: Element,
        name,
        value,
      ) {
        if (this instanceof HTMLIFrameElement && name === 'src') {
          assignments.push({ value, bound: !!globals[property] });
        }
        original.call(this, name, value);
      });
      const view = mount();
      await waitFor(() => expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', url));
      expect(assignments).toContainEqual({ value: url, bound: true });
      expect(assignments.every(({ bound }) => bound)).toBe(true);
      expect(screen.getByRole('status')).toHaveTextContent(notice);
      const frame = screen.getByTitle('Contenu SCORM');
      expect(frame).not.toHaveAttribute('srcdoc');
      expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
      expect(frame).not.toHaveAttribute('allowfullscreen');
      expect(frame.getAttribute('allow')).toContain("fullscreen 'none'");
      expect(
        screen.queryByRole('button', { name: 'Terminer l’activité simulée' }),
      ).not.toBeInTheDocument();
      expect(mockApi.launch).toHaveBeenCalledWith(
        props.enrollmentId,
        props.competencyId,
        props.courseId,
        props.entryId,
      );
      const api = globals[property]!;
      const prefix = version === '1.2' ? 'LMS' : '';
      const core = version === '1.2' ? 'cmi.core.' : 'cmi.';
      expect(api[`${prefix}Initialize`]('')).toBe('true');
      expect(
        api[`${prefix}GetValue`](`${core}${version === '1.2' ? 'student_id' : 'learner_id'}`),
      ).toBe('preview-learner');
      expect(
        api[`${prefix}GetValue`](`${core}${version === '1.2' ? 'student_name' : 'learner_name'}`),
      ).not.toBe('Identité réelle');
      expect(api[`${prefix}SetValue`](`${core}score.raw`, '100')).toBe('true');
      expect(
        api[`${prefix}SetValue`](
          `${core}${version === '1.2' ? 'lesson_status' : 'completion_status'}`,
          'completed',
        ),
      ).toBe('true');
      expect(
        api[`${prefix}SetValue`](`${core}session_time`, version === '1.2' ? '00:05:00' : 'PT5M'),
      ).toBe('true');
      expect(api[`${prefix}SetValue`]('cmi.suspend_data', 'resume-page-4')).toBe('true');
      expect(api[`${prefix}Commit`]('')).toBe('true');
      expect(api[version === '1.2' ? 'LMSFinish' : 'Terminate']('')).toBe('true');
      fireEvent(window, new Event('beforeunload'));
      fireEvent(window, new Event('pagehide'));
      fireEvent(window, new Event('unload'));
      view.unmount();
      expect(globals[property]).toBeUndefined();
      expect(api[`${prefix}GetValue`]('cmi.suspend_data')).toBe('');
      expect(api[`${prefix}SetValue`]('cmi.suspend_data', 'late')).toBe('false');
      expect(view.onCompleted).not.toHaveBeenCalled();
      noTracking();

      const next = mount();
      await waitFor(() => expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', url));
      const nextApi = globals[property]!;
      expect(nextApi).not.toBe(api);
      expect(nextApi[`${prefix}Initialize`]('')).toBe('true');
      expect(nextApi[`${prefix}GetValue`]('cmi.suspend_data')).toBe('');
      expect(nextApi[`${prefix}GetValue`](`${core}score.raw`)).toBe('');
      nextApi[`${prefix}SetValue`](
        `${core}${version === '1.2' ? 'lesson_status' : 'completion_status'}`,
        'completed',
      );
      // Unmount a dirty session without calling Finish: still no completion or tracking.
      next.unmount();
      expect(next.onCompleted).not.toHaveBeenCalled();
      expect(nextApi[`${prefix}Commit`]('')).toBe('false');
      noTracking();
    },
  );

  it('does not reuse readiness/API or CMI when switching launch versions/entries', async () => {
    const view = mount();
    await waitFor(() =>
      expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
    );
    const oldApi = globals.API!;
    oldApi.LMSInitialize('');
    oldApi.LMSSetValue('cmi.suspend_data', 'old');
    const nextUrl = assetUrl.replace('index.html', 'next.html');
    mockApi.launch.mockResolvedValue({ data: { ...launch, version: '2004', launch_url: nextUrl } });
    view.rerender(view.ui('next-entry'));
    await waitFor(() => expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', nextUrl));
    expect(globals.API).toBeUndefined();
    expect(globals.API_1484_11!.Initialize('')).toBe('true');
    expect(globals.API_1484_11!.GetValue('cmi.suspend_data')).toBe('');
    expect(oldApi.LMSCommit('')).toBe('false');
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });

  it('uses the overlay below the simulation exit header, not native fullscreen', async () => {
    const view = mount();
    const button = await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const container = button.parentElement!;
    const requestFullscreen = jest.fn();
    Object.defineProperty(container, 'requestFullscreen', { value: requestFullscreen });
    fireEvent.click(button);
    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(container).toHaveClass('fixed', 'top-16', 'z-50');
    expect(screen.getByRole('status')).toHaveTextContent(notice);
    expect(screen.getByRole('button', { name: 'Quitter le plein écran' })).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container).not.toHaveClass('fixed');
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    `https://evil.test${assetUrl}`,
    `//localhost${assetUrl}`,
    '/api/v1/enrollments/real/scorm/assets/token/index.html?read_only=true',
    assetUrl.replace('index.html', '%2e%2e/index.html'),
    '/api/v1/role-simulation/training/injected.html',
  ])('fails closed for an untrusted launch URL: %s', async (launch_url) => {
    mockApi.launch.mockResolvedValue({ data: { ...launch, launch_url } });
    const view = mount();
    expect(await screen.findByText(errorText)).toBeVisible();
    expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
    expect(globals.API).toBeUndefined();
    expect(globals.API_1484_11).toBeUndefined();
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });

  it('rejects read_only without an active simulation instead of booting the tracking runtime', async () => {
    setActor(null, Role.TRAINEE);
    mount();
    expect(await screen.findByText(errorText)).toBeVisible();
    expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
    noTracking();
  });

  it('discards the preview when leaving simulation even if the launch remains cached', async () => {
    const view = mount();
    await waitFor(() =>
      expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
    );
    const api = globals.API!;
    api.LMSInitialize('');
    api.LMSSetValue('cmi.suspend_data', 'old');
    act(() => setActor(null));
    expect(screen.getByText(errorText)).toBeVisible();
    expect(globals.API).toBeUndefined();
    expect(api.LMSCommit('')).toBe('false');
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });

  it('shows loading without a runtime or iframe before launch resolves', async () => {
    let resolve!: (value: { data: ApiScormLaunch }) => void;
    mockApi.launch.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mount();
    expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
    expect(globals.API).toBeUndefined();
    noTracking();
    await act(async () => resolve({ data: launch }));
    await waitFor(() =>
      expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
    );
  });

  it('shows launch errors rather than substituting the fictional demo', async () => {
    mockApi.launch.mockRejectedValue(new Error('Forbidden preview'));
    const view = mount();
    expect(await screen.findByText(errorText)).toBeVisible();
    expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Terminer l’activité simulée' }),
    ).not.toBeInTheDocument();
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });

  it('detaches the adapter on an iframe load error without reporting completion', async () => {
    const view = mount();
    await waitFor(() =>
      expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
    );
    const api = globals.API!;
    api.LMSInitialize('');
    fireEvent.error(screen.getByTitle('Contenu SCORM'));
    expect(screen.getByText(errorText)).toBeVisible();
    expect(globals.API).toBeUndefined();
    expect(api.LMSCommit('')).toBe('false');
    view.unmount();
    expect(view.onCompleted).not.toHaveBeenCalled();
    noTracking();
  });
});

describe('ScormPlayer unchanged demo and learner behavior', () => {
  it('retains the inert fictional SuperAdmin demo and its local completion button', async () => {
    setActor(Role.TRAINEE, Role.SUPER_ADMIN);
    mockApi.launch.mockResolvedValue({
      data: { ...launch, read_only: undefined, launch_url: 'about:blank' },
    });
    const view = mount();
    const frame = await screen.findByTitle('Contenu SCORM');
    expect(frame).not.toHaveAttribute('src');
    expect(frame.getAttribute('srcdoc')).toContain('Activité SCORM de démonstration');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Terminer l’activité simulée' }));
    expect(view.onCompleted).toHaveBeenCalledTimes(1);
    noTracking();
  });

  it('does not infer a real preview from a URL query when read_only is absent', async () => {
    mockApi.launch.mockResolvedValue({
      data: { ...launch, read_only: undefined, launch_url: `${assetUrl}?read_only=true` },
    });
    mount();
    const frame = await screen.findByTitle('Contenu SCORM');
    expect(frame).not.toHaveAttribute('src');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(screen.getByRole('button', { name: 'Terminer l’activité simulée' })).toBeVisible();
    noTracking();
  });

  it('preloads/tracks/completes ordinary learners normally, ignoring spoofed read_only query params', async () => {
    setActor(null, Role.TRAINEE);
    const url =
      '/api/v1/enrollments/real/courses/course/entries/entry/scorm/assets/token/index.html?read_only=true';
    mockApi.launch.mockResolvedValue({
      data: { ...launch, read_only: undefined, launch_url: url },
    });
    let resolve!: (value: { data: ApiScormTrackingState }) => void;
    mockApi.getTracking.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const view = mount();
    await waitFor(() => expect(mockApi.getTracking).toHaveBeenCalledTimes(1));
    expect(ScormSession).toHaveBeenCalledTimes(1);
    expect(globals.API).toBeDefined();
    expect(screen.getByTitle('Contenu SCORM')).not.toHaveAttribute('src');
    await act(async () => resolve({ data: tracking }));
    await waitFor(() => expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', url));
    expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('allowfullscreen');
    expect(screen.getByTitle('Contenu SCORM').getAttribute('sandbox')).toContain(
      'allow-forms allow-popups',
    );
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Terminer l’activité simulée' }),
    ).not.toBeInTheDocument();
    const api = globals.API!;
    expect(api.LMSInitialize('')).toBe('true');
    expect(api.LMSGetValue('cmi.core.lesson_mode')).toBe('normal');
    await act(async () => {
      api.LMSSetValue('cmi.core.lesson_status', 'completed');
      api.LMSCommit('');
    });
    await waitFor(() => expect(mockApi.commitTracking).toHaveBeenCalledTimes(1));
    expect(view.onCompleted).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(globals.API).toBeUndefined();
  });
});
