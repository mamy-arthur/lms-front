import { Role } from '@/shared/constants/roles';
import { apiGet, apiPost, apiPut, httpClient } from '@/shared/lib/apiClient';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { portalScormApi } from '@/shared/api/portal-scorm.api';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import { startSimulation, endSimulation } from '../service';
import { clearSimulationData } from '../local-api';
import { cancelSimulationRequests } from '../transport';
import { useSimulationStore, type SimulationSession } from '../simulation.store';

const realPath = '33333333-3333-4333-8333-333333333333';
const realEntry = '44444444-4444-4444-8444-444444444444';
const realPackage = '55555555-5555-4555-8555-555555555555';
const base = '/api/v1/role-simulation/training/learning-paths';
const launchEndpoint = `${base}/${realPath}/entries/${realEntry}/scorm/launch`;
const launchUrl = `${base}/${realPath}/entries/${realEntry}/scorm/assets/cGF5bG9hZA.c2lnbmF0dXJl/story/index.html`;
const resources = {
  'learning-paths': [
    {
      id: realPath,
      name: 'Formation SCORM',
      competencies: [{ competency_id: 'module', position: 0 }],
    },
  ],
  competencies: [{ id: 'module', shortname: 'Module', course_ids: ['course'] }],
  courses: [{ id: 'course', full_name: 'Cours', visibility: 'PUBLISHED' }],
  sections: [{ id: 'section', course_id: 'course', name: 'Section', rank: 0, is_hidden: false }],
  entries: [
    {
      id: realEntry,
      course_section_id: 'section',
      content_type_id: 'scorm-type-v1',
      rank: 0,
      is_published: true,
      data: { title: 'Activité réelle', scorm_package_id: realPackage },
    },
  ],
  'content-types': [
    { id: 'scorm-type-v1', module_type: 'scorm', fields: [{ name: 'title', type: 'text' }] },
  ],
};
let session: SimulationSession;
let launch: Record<string, unknown>;
function result(json: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(json),
  } as Response;
}
function setup(realRole = Role.CLIENT_MANAGER) {
  useAuthStore.setState({
    user: {
      id: 'real-actor',
      name: 'Private identity',
      email: 'private@example.test',
      role: realRole,
    },
    role: realRole,
    simulatedRole: null,
    sessionId: 'real-session',
  });
  session = {
    allowed_roles: [Role.TRAINEE],
    simulated_role: null,
    tenant_id: 'tenant',
    shop_tenants: [],
  };
  useSimulationStore.setState({ phase: 'ready', session, returnPath: null, error: null });
  launch = {
    content_entry_id: realEntry,
    scorm_package_id: realPackage,
    version: '1.2',
    launch_path: 'story/index.html',
    launch_url: launchUrl,
    read_only: true,
  };
  global.fetch = jest.fn(async (url: string, options: RequestInit) => {
    if (url === '/api/v1/role-simulation') {
      if (options.method === 'POST') session = { ...session, simulated_role: Role.TRAINEE };
      if (options.method === 'DELETE') session = { ...session, simulated_role: null };
      return result({ data: session });
    }
    if (options.method && options.method !== 'GET') throw new Error('Forbidden business write');
    if (url === `${base}?page=1&per_page=100`)
      return result({
        data: resources['learning-paths'],
        meta: { current_page: 1, last_page: 1 },
      });
    if (url === `${base}/${realPath}`) return result({ data: { resources } });
    if (url === launchEndpoint) return result({ data: launch });
    throw new Error(`Forbidden network call: ${url}`);
  }) as jest.Mock;
}

async function openFormation() {
  await startSimulation(Role.TRAINEE);
  const list = await apiGet<ApiMeEnrollmentsResponse>('me/enrollments');
  const enrollment = list.data[0].id;
  const summary = await apiGet<{ data: ApiPortalLearningPathSummary }>(
    `enrollments/${enrollment}/summary`,
  );
  const module = summary.data.modules[0];
  const course = module.courses[0];
  return {
    enrollment,
    competency: module.id,
    course: course.id,
    entry: course.sections[0].content_entries[0].id,
  };
}

beforeEach(() => setup());
afterEach(() => {
  cancelSimulationRequests();
  clearSimulationData();
  queryClient.clear();
  useAuthStore.getState().clearAuth();
  useSimulationStore.setState({ phase: 'idle', session: null });
  jest.restoreAllMocks();
});

it.each([Role.CLIENT_MANAGER, Role.EDITOR])(
  '%s launches an actual package via a dedicated GET with synthetic learner identifiers',
  async (role) => {
    setup(role);
    const ids = await openFormation();
    const response = await portalScormApi.launch(
      ids.enrollment,
      ids.competency,
      ids.course,
      ids.entry,
    );
    expect(response.data).toMatchObject({
      read_only: true,
      launch_url: launchUrl,
      content_entry_id: ids.entry,
      enrollment_id: ids.enrollment,
      competency_id: ids.competency,
      scorm_package_id: expect.stringMatching(/^d3e00000-/),
    });
    expect(fetch).toHaveBeenCalledTimes(4); // start, catalog, graph, launch only
    expect((fetch as jest.Mock).mock.calls.at(-1)[0]).toBe(launchEndpoint);
    expect(JSON.stringify(response)).not.toContain('Private identity');
    expect(JSON.stringify(response)).not.toContain('real-session');

    // Even old queued callers cannot mutate the local preview's tracking or completion.
    const root = `enrollments/${ids.enrollment}/courses/${ids.course}/entries/${ids.entry}`;
    await apiPut(`${root}/scorm/tracking`, {
      competency_id: ids.competency,
      commit_id: 'test',
      sequence: 1,
      lesson_status: 'passed',
      score_raw: 100,
      session_time: 120,
      total_time: 120,
      cmi_data: { secret: 'discarded' },
    });
    await apiPost(
      `enrollments/${ids.enrollment}/competencies/${ids.competency}/courses/${ids.course}/entries/${ids.entry}/complete`,
    );
    await apiPut(`${root}/time-sessions/test`, { competency_id: ids.competency, time_spent: 120 });
    const tracking = await apiGet(`${root}/scorm/tracking`, { competency_id: ids.competency });
    expect(tracking).toMatchObject({
      data: {
        lesson_status: 'not_attempted',
        score_raw: null,
        session_time: 0,
        total_time: 0,
        cmi_data: {},
        last_sequence: 0,
        updated_at: null,
      },
    });
    expect(await apiGet(`enrollments/${ids.enrollment}/summary`)).toMatchObject({
      data: { progress: { percent: 0 } },
    });
    expect(fetch).toHaveBeenCalledTimes(4);
  },
);

it('uses the real package version instead of the imported placeholder version', async () => {
  const ids = await openFormation();
  launch.version = '2004';
  expect(
    (await portalScormApi.launch(ids.enrollment, ids.competency, ids.course, ids.entry)).data
      .version,
  ).toBe('2004');
});

it('validates enrollment, module, course and entry membership before requesting a real launch', async () => {
  const ids = await openFormation();
  for (const key of ['enrollment', 'competency', 'course', 'entry'] as const) {
    const invalid = { ...ids, [key]: 'd3e00000-0000-4000-8000-ffffffffffff' };
    await expect(
      portalScormApi.launch(invalid.enrollment, invalid.competency, invalid.course, invalid.entry),
    ).rejects.toBeDefined();
  }
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('permits preview navigation past SCORM prerequisites without recording completion', async () => {
  const network = fetch as jest.Mock;
  const original = network.getMockImplementation()!;
  network.mockImplementation((url: string, options: RequestInit) => {
    if (url === `${base}/${realPath}`)
      return Promise.resolve(
        result({
          data: {
            resources: {
              ...resources,
              'learning-paths': [
                {
                  ...resources['learning-paths'][0],
                  competencies: [
                    { competency_id: 'module', position: 0 },
                    { competency_id: 'next-module', position: 1 },
                  ],
                },
              ],
              competencies: [
                ...resources.competencies,
                { id: 'next-module', shortname: 'Suite', course_ids: ['next-course'] },
              ],
              courses: [
                ...resources.courses,
                { id: 'next-course', full_name: 'Suite', visibility: 'PUBLISHED' },
              ],
              sections: [
                ...resources.sections,
                {
                  id: 'next-section',
                  course_id: 'next-course',
                  name: 'Suite',
                  rank: 0,
                  is_hidden: false,
                },
              ],
              entries: [
                ...resources.entries,
                {
                  id: 'next-entry',
                  course_section_id: 'next-section',
                  content_type_id: 'page-type',
                  rank: 0,
                  is_published: true,
                  data: { title: 'Après le SCORM' },
                },
              ],
              'content-types': [
                ...resources['content-types'],
                { id: 'page-type', module_type: 'page', fields: [] },
              ],
              'progression-rules': [
                {
                  id: 'rule',
                  learning_path_id: realPath,
                  is_active: true,
                  source: { type: 'module', id: 'module' },
                  target_on_success: { type: 'module', id: 'next-module' },
                  condition: { type: 'module_completed', rule_type: 'all' },
                },
              ],
            },
          },
        }),
      );
    return original(url, options);
  });
  const ids = await openFormation();
  const { data: summary } = await apiGet<{ data: ApiPortalLearningPathSummary }>(
    `enrollments/${ids.enrollment}/summary`,
  );
  expect(summary.progress).toEqual({ completed: 0, total: 2, percent: 0 });
  expect(summary.modules[0].courses[0].sections[0].content_entries[0]).toMatchObject({
    completed: false,
    read_only: true,
  });
  expect(summary.modules[1].accessible).toBe(true);
  const course = summary.modules[1].courses[0];
  const entry = course.sections[0].content_entries[0];
  await expect(
    apiGet(`enrollments/${ids.enrollment}/courses/${course.id}/entries/${entry.id}`),
  ).resolves.toMatchObject({ data: { id: entry.id } });
  expect(fetch).toHaveBeenCalledTimes(3);
});

it.each([
  { read_only: false },
  { version: 'unknown' },
  { content_entry_id: realPath },
  { scorm_package_id: realEntry },
  { launch_url: 'https://external.test/run' },
  { launch_url: launchUrl.replace(realPath, realEntry) },
  { launch_url: launchUrl.replace(`/entries/${realEntry}`, `/entries/${realPath}`) },
  { launch_url: '/api/v1/platform/scorm/launch' },
])('rejects an invalid launch response: %j', async (patch) => {
  const ids = await openFormation();
  Object.assign(launch, patch);
  await expect(
    portalScormApi.launch(ids.enrollment, ids.competency, ids.course, ids.entry),
  ).rejects.toThrow('Lancement SCORM de simulation invalide');
});

it('does not silently show a fictitious player when launch is no longer authorized', async () => {
  const ids = await openFormation();
  (fetch as jest.Mock).mockResolvedValueOnce(result({ message: 'Forbidden' }, 403));
  await expect(
    portalScormApi.launch(ids.enrollment, ids.competency, ids.course, ids.entry),
  ).rejects.toMatchObject({ status: 403 });
});

it('rejects a late launch response after exit and blocks stale synthetic callbacks', async () => {
  const ids = await openFormation();
  let resolve!: (response: Response) => void;
  const fetching = new Promise<void>((ready) => {
    (fetch as jest.Mock).mockImplementationOnce(() => {
      ready();
      return new Promise<Response>((done) => {
        resolve = done;
      });
    });
  });
  const pending = portalScormApi.launch(ids.enrollment, ids.competency, ids.course, ids.entry);
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await fetching;
  await endSimulation();
  resolve(result({ data: launch }));
  await rejected;
  await expect(
    portalScormApi.launch(ids.enrollment, ids.competency, ids.course, ids.entry),
  ).rejects.toMatchObject({ name: 'AbortError' });
});

it('does not allow launch mutations, arbitrary asset APIs, tracking reads or external lookalikes', async () => {
  await startSimulation(Role.TRAINEE);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    await expect(httpClient(launchEndpoint, { method, body: '{}' })).rejects.toBeDefined();
  }
  for (const url of [
    launchEndpoint + '/extra',
    launchEndpoint.replace('/launch', '/tracking'),
    `https://external.test${launchEndpoint}`,
    launchUrl,
  ]) {
    await expect(httpClient(url)).rejects.toBeDefined();
  }
  expect(fetch).toHaveBeenCalledTimes(1);
});
