import { Role } from '@/shared/constants/roles';
import { apiGet, apiPost, apiPatch, httpClient } from '@/shared/lib/apiClient';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type {
  ApiPortalLearningPathSummary,
  ApiPortalContentEntry,
} from '@/shared/types/portal.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import { startSimulation, endSimulation, synchronizeSimulation } from '../service';
import { clearSimulationData } from '../local-api';
import { useSimulationStore, type SimulationSession } from '../simulation.store';
import { cancelSimulationRequests } from '../transport';
import { SIMULATION_IDS } from '../fixtures';

const base = '/api/v1/role-simulation/training/learning-paths';
const synthetic = /^d3e00000-0000-4000-8000-/;
const path = {
  id: 'real-path',
  name: 'Prévention des risques',
  duration: 90,
  category_id: 'real-category',
  category_name: 'Prévention',
  competencies_count: 1,
  image: { id: 'real-cover', url: `${base}/real-path/media/real-cover`, mime_type: 'image/png' },
};
const resources = {
  'learning-paths': [{ ...path, competencies: [{ competency_id: 'real-module', position: 0 }] }],
  competencies: [{ id: 'real-module', shortname: 'La sécurité', course_ids: ['real-course'] }],
  courses: [{ id: 'real-course', full_name: 'Les bons gestes', visibility: 'PUBLISHED' }],
  sections: [
    {
      id: 'real-section',
      name: 'Introduction',
      course_id: 'real-course',
      rank: 0,
      is_hidden: false,
    },
  ],
  entries: [
    {
      id: 'real-entry',
      course_section_id: 'real-section',
      content_type_id: 'real-type-v1',
      rank: 0,
      is_published: true,
      data: { title: 'Consignes', body: '<p>Contenu réel autorisé</p>' },
    },
  ],
  'content-types': [
    {
      id: 'real-type-v1',
      module_type: 'page',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
      ],
    },
  ],
  evaluations: [
    {
      id: 'real-evaluation',
      learning_path_id: path.id,
      title: 'Bilan',
      type: 'FINAL',
      question_bank_ids: ['real-bank'],
      question_count: 1,
      is_published: true,
      max_attempts: null,
    },
  ],
  'question-banks': [{ id: 'real-bank', title: 'Questions', learning_path_ids: [path.id] }],
  quizzes: [
    {
      id: 'real-quiz',
      question_bank_id: 'real-bank',
      competency_id: 'real-module',
      type: 'true_false',
      question: 'Faut-il respecter les consignes ?',
      correct_answer: true,
    },
  ],
  'progression-rules': [],
};

let session: SimulationSession;
function network(json: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    statusText: 'Preview response',
    headers: new Headers(),
    text: async () => JSON.stringify(json),
  } as Response;
}
function setup(role = Role.CLIENT_MANAGER) {
  useAuthStore.setState({
    user: { id: 'real-actor', name: 'Compte réel', email: 'real@example.test', role },
    role,
    simulatedRole: null,
    sessionId: 'real-session',
  });
  session = {
    allowed_roles: [Role.TRAINEE],
    simulated_role: null,
    tenant_id: 'real-tenant',
    shop_tenants: [],
  };
  useSimulationStore.setState({ phase: 'ready', session, returnPath: null, error: null });
  global.fetch = jest.fn(async (url: string, options: RequestInit) => {
    if (url === '/api/v1/role-simulation') {
      if (options.method === 'POST') session = { ...session, simulated_role: Role.TRAINEE };
      if (options.method === 'DELETE') session = { ...session, simulated_role: null };
      return network({ data: session });
    }
    if (options.method && options.method !== 'GET') throw new Error('Unexpected business write');
    if (url === `${base}?page=1&per_page=100`)
      return network({ data: [path], meta: { current_page: 1, last_page: 1 } });
    if (url === `${base}/${path.id}`) return network({ data: { resources } });
    throw new Error(`Unexpected network access: ${url}`);
  }) as jest.Mock;
}

beforeEach(() => setup());
afterEach(() => {
  clearSimulationData();
  cancelSimulationRequests();
  queryClient.clear();
  useAuthStore.getState().clearAuth();
  useSimulationStore.setState({ phase: 'idle', session: null });
  jest.restoreAllMocks();
});

it.each([Role.CLIENT_MANAGER, Role.EDITOR])(
  '%s previews real training with only local progress and quiz attempts',
  async (role) => {
    setup(role);
    const actor = useAuthStore.getState().user;
    await expect(startSimulation(Role.TRAINEE)).resolves.toBe('/trainee/formations');
    const [list, categories] = await Promise.all([
      apiGet<ApiMeEnrollmentsResponse>('me/enrollments'),
      apiGet<{ data: Array<{ id: string; name: string }> }>('platform/learning-path-categories'),
    ]);
    expect(list.data).toHaveLength(1);
    const registration = list.data[0];
    expect(registration.id).toMatch(synthetic);
    expect(registration).toMatchObject({ learner_id: SIMULATION_IDS.learner });
    expect(registration.learning_path).toMatchObject({
      name: path.name,
      duration: 90,
      totalModules: 1,
      image: { url: path.image.url },
      category_id: categories.data[0].id,
    });
    expect(registration.progress_percent).toBe(0);
    expect(categories.data).toMatchObject([
      {
        id: expect.stringMatching(synthetic),
        name: 'Prévention',
        description: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    ]);
    expect(fetch).toHaveBeenCalledTimes(2); // lifecycle + one shared catalog request

    const summaryPath = `enrollments/${registration.id}/summary`;
    const [first] = await Promise.all([
      apiGet<{ data: ApiPortalLearningPathSummary }>(summaryPath),
      apiGet(summaryPath),
    ]);
    expect(fetch).toHaveBeenCalledTimes(3); // detail loaded once on opening
    const module = first.data.modules[0];
    const course = module.courses[0];
    const entry = course.sections[0].content_entries[0];
    expect(module.name).toBe('La sécurité');
    expect(course.name).toBe('Les bons gestes');
    const content = await apiGet<{ data: ApiPortalContentEntry }>(
      `enrollments/${registration.id}/courses/${course.id}/entries/${entry.id}`,
    );
    expect(content.data.data.body).toBe('<p>Contenu réel autorisé</p>');
    expect(content.data.field_types.body).toBe('richtext');
    await apiPost(
      `enrollments/${registration.id}/competencies/${module.id}/courses/${course.id}/entries/${entry.id}/complete`,
    );
    const attempt = await apiPost<{ data: ApiEvaluationAttempt }>(
      `enrollments/${registration.id}/evaluations/${first.data.final_evaluation!.id}/attempts`,
    );
    await apiPost(
      `evaluation-attempts/${attempt.data.id}/quizzes/${attempt.data.quizzes[0].id}/answer`,
      { answer: true },
    );
    await apiPost(`evaluation-attempts/${attempt.data.id}/submit`);
    expect(await apiGet(summaryPath)).toMatchObject({ data: { progress: { percent: 100 } } });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().user).toBe(actor);
    expect(useAuthStore.getState().sessionId).toBe('real-session');
    await synchronizeSimulation();
    expect(await apiGet(summaryPath)).toMatchObject({ data: { progress: { percent: 100 } } });
    await endSimulation();
    await expect(
      apiPatch(`enrollments/${registration.id}`, { status: 'completed' }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(
      (fetch as jest.Mock).mock.calls
        .filter(([, options]) => options.method && options.method !== 'GET')
        .map(([url]) => url),
    ).toEqual(['/api/v1/role-simulation', '/api/v1/role-simulation']);
  },
);

it('keeps the existing fictitious training for superadmin simulation', async () => {
  setup(Role.SUPER_ADMIN);
  await startSimulation(Role.TRAINEE);
  const list = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments');
  expect(list.data[0].learning_path.name).toContain('démonstration');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each([Role.CLIENT_MANAGER, Role.EDITOR])(
  '%s keeps the real external URL through the simulation transport without a backend proxy',
  async (role) => {
    setup(role);
    await startSimulation(Role.TRAINEE);
    const list = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments');
    const url = 'https://www.youtube.com/watch?v=abc123';
    (fetch as jest.Mock).mockResolvedValueOnce(
      network({
        data: {
          resources: {
            ...resources,
            entries: [{ ...resources.entries[0], data: { title: 'Vidéo externe', url } }],
            'content-types': [{
              ...resources['content-types'][0],
              module_type: 'url',
              fields: [{ name: 'title', type: 'text' }, { name: 'url', type: 'text' }],
            }],
          },
        },
      }),
    );
    const enrollmentId = list.data[0].id;
    const summary = await apiGet<{ data: ApiPortalLearningPathSummary }>(
      `enrollments/${enrollmentId}/summary`,
    );
    const course = summary.data.modules[0].courses[0];
    const entry = course.sections[0].content_entries[0];
    const content = await apiGet<{ data: ApiPortalContentEntry }>(
      `enrollments/${enrollmentId}/courses/${course.id}/entries/${entry.id}`,
    );
    expect(content.data).toMatchObject({
      module_type: 'url',
      data: { url },
      field_types: { url: 'text' },
    });
    expect(entry.id).toMatch(synthetic);
    expect(fetch).toHaveBeenCalledTimes(3); // lifecycle, catalog and authorized graph only
    expect((fetch as jest.Mock).mock.calls.map(([requestUrl]) => requestUrl)).toEqual([
      '/api/v1/role-simulation',
      `${base}?page=1&per_page=100`,
      `${base}/${path.id}`,
    ]);
    await expect(httpClient(url)).rejects.toBeDefined(); // no API allowlist expansion
    expect(fetch).toHaveBeenCalledTimes(3);
  },
);

it('never substitutes fictitious formations for an empty authorized catalog', async () => {
  await startSimulation(Role.TRAINEE);
  (fetch as jest.Mock).mockResolvedValueOnce(
    network({ data: [], meta: { current_page: 1, last_page: 1 } }),
  );
  expect(await apiGet('me/enrollments')).toMatchObject({ data: [], meta: { total: 0 } });
  expect(await apiGet('platform/learning-path-categories')).toMatchObject({ data: [] });
});

it('supports pagination then local category/search/status/title filtering', async () => {
  await startSimulation(Role.TRAINEE);
  (fetch as jest.Mock)
    .mockResolvedValueOnce(network({ data: [path], meta: { current_page: 1, last_page: 2 } }))
    .mockResolvedValueOnce(
      network({
        data: [{ ...path, id: 'another-path', name: 'Accueil' }],
        meta: { current_page: 2, last_page: 2 },
      }),
    );
  const list = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments', {
    sort_by: 'title',
    sort_dir: 'asc',
  });
  expect(list.data.map((row) => row.learning_path.name)).toEqual(['Accueil', path.name]);
  const categories = await apiGet<{ data: Array<{ id: string }> }>(
    'platform/learning-path-categories',
  );
  const filtered = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments', {
    q: 'risques',
    category_id: categories.data[0].id,
    status: 'not_started',
  });
  expect(filtered.data.map((row) => row.learning_path.name)).toEqual([path.name]);
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('fails closed on catalog failure and allows a retry without showing fixtures', async () => {
  await startSimulation(Role.TRAINEE);
  (fetch as jest.Mock).mockRejectedValueOnce(new Error('Offline'));
  await expect(apiGet('me/enrollments')).rejects.toThrow('Offline');
  expect(
    (await apiGet<ApiMeEnrollmentsResponse>('me/enrollments')).data[0].learning_path.name,
  ).toBe(path.name);
});

it('rejects a revoked detail without importing or replacing it with demo content', async () => {
  await startSimulation(Role.TRAINEE);
  const list = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments');
  (fetch as jest.Mock).mockResolvedValueOnce(network({ message: 'Not found' }, 404));
  await expect(apiGet(`enrollments/${list.data[0].id}/summary`)).rejects.toMatchObject({
    status: 404,
  });
});

it('discards an in-flight training response when the user exits simulation', async () => {
  await startSimulation(Role.TRAINEE);
  let resolve!: (value: Response) => void;
  (fetch as jest.Mock).mockImplementationOnce(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  const request = apiGet('me/enrollments');
  const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
  await endSimulation();
  resolve(network({ data: [path], meta: { current_page: 1, last_page: 1 } }));
  await rejected;
  expect(useAuthStore.getState().simulatedRole).toBeNull();
});

it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
  'never sends %s to the real training API',
  async (method) => {
    await startSimulation(Role.TRAINEE);
    const count = (fetch as jest.Mock).mock.calls.length;
    await expect(httpClient(base, { method, body: '{}' })).rejects.toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(count);
  },
);

it.each([
  `${base}/real-path/export`,
  `https://external.test${base}`,
  '/api/v1/platform/learning-paths/real-path',
])('does not expand the real read allowlist: %s', async (url) => {
  await startSimulation(Role.TRAINEE);
  await expect(httpClient(url)).rejects.toBeDefined();
  expect(fetch).toHaveBeenCalledTimes(1);
});
