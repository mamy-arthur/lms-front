import { Role } from '@/shared/constants/roles';
import {
  createSimulationFixtures,
  SIMULATION_DATE,
  SIMULATION_IDS,
  SIMULATION_SCORM_LAUNCH,
  type ResourceName,
  type SimulationEntity,
} from '../fixtures';
import { createTrainingPreview, importTrainingPreview } from '../training-data';
import { clearSimulationData, handleSimulationRequest, resetSimulationData } from '../local-api';

// Give the existing local engine the exact caller-owned object, without adding an integration API.
jest.mock('../fixtures', () => {
  const actual = jest.requireActual<typeof import('../fixtures')>('../fixtures');
  return { ...actual, createSimulationFixtures: jest.fn(actual.createSimulationFixtures) };
});

const realId = (n: number) => `9a870000-abcd-4bcd-8def-${n.toString(16).padStart(12, '0')}`;
const real = {
  path: realId(1),
  secondPath: realId(2),
  category: realId(3),
  course: realId(4),
  competency: realId(5),
  section: realId(6),
  entry: realId(7),
  type: realId(8),
  media: realId(9),
  bank: realId(10),
  quiz: realId(11),
  evaluation: realId(12),
  rule: realId(13),
  option: realId(14),
  otherOption: realId(15),
  field: realId(16),
  scormType: realId(17),
  scormEntry: realId(18),
  package: realId(19),
  actor: realId(900),
};
const mediaUrl = (pathId = real.path, mediaId = real.media) =>
  `/api/v1/role-simulation/training/learning-paths/${pathId}/media/${mediaId}`;
const synthetic = /^d3e00000-0000-4000-8000-[0-9a-f]{12}$/;
const record = (value: unknown) => value as Record<string, unknown>;
const records = (value: unknown) => value as Array<Record<string, unknown>>;

function catalog(pathId = real.path): SimulationEntity {
  return {
    id: pathId,
    name: 'Formation réelle — français',
    description: '<p>Apprendre <strong>ensemble</strong>.</p>',
    category_id: real.category,
    category_name: 'Prévention',
    image: { id: real.media, url: mediaUrl(pathId), mime_type: 'image/png' },
    duration: 90,
    competencies_count: 1,
    published_at: SIMULATION_DATE,
    tenant_id: real.actor,
    author_id: real.actor,
    learners: [{ id: real.actor, email: 'private@example.test' }],
    enrollments_count: 128,
    certificate: { id: real.actor, body: 'PRIVATE CERTIFICATE' },
    mail_template: { id: real.actor, body: 'PRIVATE MAIL' },
  };
}

function graph(pathId = real.path): Partial<Record<ResourceName, SimulationEntity[]>> {
  return {
    'learning-paths': [
      {
        ...catalog(pathId),
        name: 'Stale detail title',
        category_id: realId(999),
        category_name: 'Stale category',
        image: { id: realId(998), url: 'https://unrelated.test/cover.png' },
        competencies: [
          { competency_id: real.competency, position: 0, location_x: 2, location_y: 3 },
        ],
      },
    ],
    competencies: [
      {
        id: real.competency,
        shortname: 'Module prévention',
        category_id: real.category,
        category_name: 'Modules',
        course_ids: [real.course],
        courses: [{ course_id: real.course, full_name: 'Course', position: 0 }],
        tenant_id: real.actor,
        author: { email: 'private@example.test' },
      },
    ],
    courses: [
      {
        id: real.course,
        full_name: real.course,
        short_name: 'Prévention',
        visibility: 'PUBLISHED',
        category_id: real.category,
        category_name: 'Cours',
        created_by: real.actor,
        progress: { user_id: real.actor },
      },
    ],
    sections: [
      { id: real.section, course_id: real.course, name: 'Introduction', rank: 2, is_hidden: false },
    ],
    entries: [
      {
        id: real.entry,
        course_section_id: real.section,
        content_type_id: real.type,
        is_published: true,
        rank: 4,
        data: {
          title: real.entry,
          body: `<p>Bonjour <strong>apprenant</strong><img src="${mediaUrl(pathId)}" alt="Cours"></p>`,
          photo: real.media,
          gallery: [real.media, { id: real.media, url: 'https://evil.test/image' }],
          url: 'https://evil.test/embed',
          private_user: { id: real.actor, email: 'private@example.test' },
        },
      },
      {
        id: real.scormEntry,
        course_section_id: real.section,
        content_type_id: real.scormType,
        is_published: true,
        rank: 5,
        data: {
          title: 'SCORM source',
          scorm_package_id: real.package,
          launch_url: 'https://evil.test/scorm',
        },
      },
    ],
    'content-types': [
      {
        id: real.type,
        title: 'Page',
        module_type: 'page',
        version: 2,
        fields: [
          { field_id: real.field, name: 'title', type: 'text' },
          { field_id: realId(20), name: 'body', type: 'richtext' },
          { field_id: realId(21), name: 'photo', type: 'media' },
          { field_id: realId(22), name: 'gallery', type: 'media', multiple: true },
          { field_id: realId(23), name: 'url', type: 'text' },
        ],
      },
      { id: real.scormType, title: 'SCORM', module_type: 'scorm', fields: [] },
    ],
    media: [{ id: real.media, url: mediaUrl(pathId), mime_type: 'image/png', user_id: real.actor }],
    'question-banks': [
      { id: real.bank, title: 'Banque', learning_path_ids: [pathId], is_active: true },
    ],
    quizzes: [
      {
        id: real.quiz,
        question_bank_id: real.bank,
        competency_id: real.competency,
        type: 'single_choice',
        question: 'Choisir la bonne réponse',
        options: [
          { id: real.option, label: real.option, is_correct: true, user: { id: real.actor } },
          { id: real.otherOption, label: 'Autre', is_correct: false },
        ],
      },
    ],
    evaluations: [
      {
        id: real.evaluation,
        learning_path_id: pathId,
        type: 'FINAL',
        title: 'Bilan',
        question_bank_ids: [real.bank],
        question_count: 1,
        preceding_competency_id: real.competency,
        is_published: true,
        max_attempts: 3,
        attempts: [{ id: real.actor, learner_id: real.actor, score: 100 }],
      },
    ],
    'progression-rules': [
      {
        id: real.rule,
        learning_path_id: pathId,
        source: { type: 'module', id: real.competency, owner: real.actor },
        condition: { type: 'module_completed', rule_type: 'all' },
        target_on_success: { type: 'evaluation', id: real.evaluation },
        target_on_failure: { type: 'module', id: real.competency },
        target_on_exhausted: { type: 'certificate', id: realId(100) },
        is_active: true,
      },
    ],
    users: [{ id: real.actor, email: 'private@example.test' }],
    tenants: [{ id: real.actor, name: 'PRIVATE TENANT' }],
    groups: [{ id: real.actor, members: [{ id: real.actor }] }],
    certificates: [{ id: real.actor, body: 'PRIVATE CERTIFICATE' }],
    'template-mails': [{ id: real.actor, body: 'PRIVATE MAIL' }],
    'learning-path-categories': [{ id: real.category, name: 'Ignored detail category' }],
  };
}

function setup(paths: SimulationEntity[] = [catalog()]) {
  const data = createSimulationFixtures(Role.TRAINEE);
  const preview = createTrainingPreview(data, paths);
  return { data, preview };
}

beforeEach(() => {
  jest
    .mocked(createSimulationFixtures)
    .mockImplementation(
      jest.requireActual<typeof import('../fixtures')>('../fixtures').createSimulationFixtures,
    );
});
afterEach(() => {
  clearSimulationData();
  jest.restoreAllMocks();
});

describe('createTrainingPreview', () => {
  it('replaces demo paths with synthetic catalog paths/enrollments and deduplicated categories', () => {
    const paths = [catalog(), catalog(real.secondPath), catalog()];
    const before = JSON.stringify(paths);
    const { data, preview } = setup(paths);
    expect(data.resources['learning-paths']).toHaveLength(2);
    expect(data.resources['learning-path-categories']).toHaveLength(1);
    expect(data.enrollments).toHaveLength(2);
    for (const [index, path] of data.resources['learning-paths'].entries()) {
      expect(path).toMatchObject({
        id: expect.stringMatching(synthetic),
        tenant_id: SIMULATION_IDS.tenant,
        author_id: SIMULATION_IDS.editor,
        name: paths[index].name,
        duration: 90,
        description: paths[index].description,
        category_name: 'Prévention',
        competencies_count: 1,
        image: {
          id: expect.stringMatching(synthetic),
          url: mediaUrl(paths[index].id),
          mime_type: 'image/png',
        },
        certificate: null,
        mail_template: null,
        competencies: [],
      });
      expect(path.category_id).toBe(data.resources['learning-path-categories'][0].id);
      expect(data.enrollments[index]).toMatchObject({
        id: expect.stringMatching(synthetic),
        learning_path_id: path.id,
        tenant_id: SIMULATION_IDS.tenant,
        learner_id: SIMULATION_IDS.learner,
        assigned_by: SIMULATION_IDS.manager,
        status: 'not_started',
        started_at: null,
        completed_at: null,
      });
      expect(preview.enrollmentPaths.get(data.enrollments[index].id)).toBe(paths[index].id);
      expect(preview.pathIds.get(paths[index].id)).toBe(path.id);
    }
    expect(preview.loadedPaths.size).toBe(0);
    expect(data.sequence).toBeGreaterThan(1000);
    expect(JSON.stringify(paths)).toBe(before);
  });

  it('leaves absent categories/images/durations empty, with no demo fallback', () => {
    const { data } = setup([{ id: real.path, name: 'Santé & sécurité' }]);
    expect(data.resources['learning-paths'][0]).toMatchObject({
      name: 'Santé & sécurité',
      image: null,
      category_id: null,
      category_name: null,
      duration: null,
    });
    expect(data.resources['learning-path-categories']).toEqual([]);
  });

  it('clears every training/result collection for an empty catalog, preserving local profile/context', () => {
    const data = createSimulationFixtures(Role.TRAINEE);
    const users = data.resources.users;
    const tenants = data.resources.tenants;
    const templates = data.resources['template-mails'];
    const certificates = data.resources.certificates;
    data.completedEntries.add('old-completion');
    data.timeSessions.set('old-time', {});
    data.scormTracking.set('old-scorm', {} as never);
    data.attempts.push({ id: 'old-attempt' } as never);
    data.twoFactorOverrides.set('local', {} as never);
    const preview = createTrainingPreview(data, []);
    for (const resource of [
      'learning-paths',
      'learning-path-categories',
      'courses',
      'course-categories',
      'sections',
      'entries',
      'competencies',
      'competency-categories',
      'question-banks',
      'quizzes',
      'evaluations',
      'progression-rules',
      'content-types',
      'media',
    ] as ResourceName[])
      expect(data.resources[resource]).toEqual([]);
    expect(data.enrollments).toEqual([]);
    expect(data.purchases).toEqual([]);
    expect(data.scormPackages).toEqual([]);
    expect(data.attempts).toEqual([]);
    expect(data.completedEntries.size + data.timeSessions.size + data.scormTracking.size).toBe(0);
    expect(data.resources.users).toBe(users);
    expect(data.resources.tenants).toBe(tenants);
    expect(data.resources.certificates).toBe(certificates);
    expect(data.resources['template-mails']).toBe(templates);
    expect(data.twoFactorOverrides.has('local')).toBe(true);
    expect(preview.enrollmentPaths.size + preview.loadedPaths.size).toBe(0);
  });

  it('removes dangling demo cart items but keeps independent shop items/prices and local orders', () => {
    const data = createSimulationFixtures(Role.TRAINEE);
    const shopItem = { id: realId(999), learning_path_id: real.path, price: 12.25, quantity: 2 };
    data.cart.items.push(
      { ...shopItem, learning_path_id: SIMULATION_IDS.learningPath } as never,
      shopItem as never,
    );
    data.shopPrices.set(real.path, { price: 12.25, currency: 'EUR' });
    const orders = data.orders;
    createTrainingPreview(data, []);
    expect(data.cart.items).toEqual([shopItem]);
    expect(data.cart.total).toBe(24.5);
    expect(data.cart.user_id).toBe(SIMULATION_IDS.learner);
    expect(data.shopPrices.has(real.path)).toBe(true);
    expect(data.orders).toBe(orders);
  });
});

describe('importTrainingPreview', () => {
  it('remaps the complete graph, field/media/option IDs and nested progression nodes without rewriting names', () => {
    const { data, preview } = setup();
    const source = graph();
    const before = JSON.stringify(source);
    importTrainingPreview(data, preview, real.path, source);
    const r = data.resources;
    const path = r['learning-paths'][0];
    const course = r.courses[0];
    const module = r.competencies[0];
    const section = r.sections[0];
    const entry = r.entries[0];
    const type = r['content-types'][0];
    const evaluation = r.evaluations[0];
    const quiz = r.quizzes[0];
    const rule = r['progression-rules'][0];
    expect(records(path.competencies)[0]).toEqual({
      competency_id: module.id,
      position: 0,
      location_x: 2,
      location_y: 3,
    });
    expect(module.course_ids).toEqual([course.id]);
    expect(records(module.courses)[0].course_id).toBe(course.id);
    expect(section.course_id).toBe(course.id);
    expect(entry.course_section_id).toBe(section.id);
    expect(entry.content_type_id).toBe(type.id);
    expect(record(entry.data).photo).toBe(r.media[0].id);
    expect(record(entry.data).gallery).toEqual([r.media[0].id, r.media[0].id]);
    expect(records(type.fields)[0].field_id).toMatch(synthetic);
    expect(records(type.fields)[0].field_id).not.toBe(real.field);
    expect(evaluation.question_bank_ids).toEqual([r['question-banks'][0].id]);
    expect(evaluation.learning_path_id).toBe(path.id);
    expect(evaluation.preceding_competency_id).toBe(module.id);
    expect(r['question-banks'][0].learning_path_ids).toEqual([path.id]);
    expect(quiz.question_bank_id).toBe(r['question-banks'][0].id);
    expect(quiz.competency_id).toBe(module.id);
    expect(records(quiz.options)[0]).toEqual({
      id: expect.stringMatching(synthetic),
      label: real.option,
      is_correct: true,
    });
    expect(course.full_name).toBe(real.course);
    expect(record(entry.data).title).toBe(real.entry);
    expect(rule.source).toEqual({ type: 'module', id: module.id });
    expect(rule.target_on_success).toEqual({ type: 'evaluation', id: evaluation.id });
    expect(rule.target_on_failure).toEqual({ type: 'module', id: module.id });
    expect(record(rule.target_on_exhausted).id).toMatch(synthetic);
    expect(course.category_id).toBe(r['course-categories'][0].id);
    expect(module.category_id).toBe(r['competency-categories'][0].id);
    expect(path).toMatchObject({
      name: catalog().name,
      category_name: 'Prévention',
      image: { url: mediaUrl() },
    });
    expect(r['learning-path-categories']).toHaveLength(1);
    expect(preview.loadedPaths.has(real.path)).toBe(true);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('imports only training fields, never private expansions, users, templates, enrollments or progress', () => {
    const { data, preview } = setup();
    const untouched = Object.fromEntries(
      ['users', 'tenants', 'groups', 'certificates', 'template-mails'].map((resource) => [
        resource,
        data.resources[resource as ResourceName],
      ]),
    );
    const enrollment = data.enrollments[0];
    importTrainingPreview(data, preview, real.path, graph());
    for (const [resource, value] of Object.entries(untouched))
      expect(data.resources[resource as ResourceName]).toBe(value);
    expect(JSON.stringify(data.resources)).not.toMatch(/private@example|PRIVATE|enrollments_count/);
    expect(JSON.stringify(data.resources)).not.toContain(real.actor);
    expect(data.enrollments).toEqual([enrollment]);
    expect(data.attempts).toEqual([]);
    expect(data.completedEntries.size).toBe(0);
    expect(data.resources.courses[0].created_by).toBe(SIMULATION_IDS.editor);
  });

  it('merges a second path and repeated detail without losing results, context or existing IDs', () => {
    const { data, preview } = setup([catalog(), catalog(real.secondPath)]);
    importTrainingPreview(data, preview, real.path, graph());
    const path = data.resources['learning-paths'][0];
    const entry = data.resources.entries[0];
    const course = data.resources.courses[0];
    const enrollment = data.enrollments[0];
    enrollment.status = 'completed';
    const completionKey = `${enrollment.id}:${data.resources.competencies[0].id}:${entry.id}`;
    data.completedEntries.add(completionKey);
    data.timeSessions.set(completionKey, { time_spent: 33 });
    data.scormTracking.set(completionKey, { last_sequence: 2 } as never);
    data.attempts.push({
      id: 'local-attempt',
      evaluation_id: data.resources.evaluations[0].id,
      score: 100,
    } as never);
    const results = [data.attempts, data.completedEntries, data.timeSessions, data.scormTracking];
    importTrainingPreview(data, preview, real.secondPath, graph(real.secondPath));
    expect(data.resources.entries[0]).toBe(entry);
    expect(data.resources.courses[0]).toBe(course);
    expect(data.resources['learning-paths'][0]).toBe(path);
    expect(data.resources.media.map((row) => row.url)).toEqual(
      expect.arrayContaining([mediaUrl(), mediaUrl(real.secondPath)]),
    );
    const sequence = data.sequence;
    const ids = data.resources.entries.map((row) => row.id);
    const update = graph();
    update.courses![0].full_name = 'Mise à jour du cours';
    importTrainingPreview(data, preview, real.path, update);
    expect(data.resources.courses[0].full_name).toBe('Mise à jour du cours');
    expect(data.resources.entries.map((row) => row.id)).toEqual(ids);
    expect(data.sequence).toBe(sequence);
    expect(data.enrollments[0]).toBe(enrollment);
    expect(enrollment.status).toBe('completed');
    expect(data.completedEntries.has(completionKey)).toBe(true);
    expect(data.timeSessions.get(completionKey)).toEqual({ time_spent: 33 });
    expect(data.scormTracking.get(completionKey)).toEqual({ last_sequence: 2 });
    expect(data.attempts[0].score).toBe(100);
    expect([data.attempts, data.completedEntries, data.timeSessions, data.scormTracking]).toEqual(
      results,
    );
    expect(preview.loadedPaths.size).toBe(2);
  });

  it('does not mutate anything or mark loaded on an unknown/mismatched path', () => {
    const { data, preview } = setup();
    const before = JSON.stringify(data);
    expect(() =>
      importTrainingPreview(data, preview, real.secondPath, graph(real.secondPath)),
    ).toThrow(/absent/);
    expect(() => importTrainingPreview(data, preview, real.path, {})).toThrow(/absent/);
    expect(JSON.stringify(data)).toBe(before);
    expect(preview.loadedPaths.size).toBe(0);
  });

  it('makes attached SCORM packages ready and synthetic, without source launch/runtime/archive data', () => {
    const { data, preview } = setup();
    importTrainingPreview(data, preview, real.path, graph());
    const entry = data.resources.entries[1];
    expect(data.scormPackages).toEqual([
      {
        id: expect.stringMatching(synthetic),
        content_entry_id: entry.id,
        title: 'SCORM source',
        status: 'ready',
        version: '1.2',
        launch_path: 'simulation.html',
        original_filename: 'scorm-demonstration.zip',
        size_bytes: 0,
        failure_reason: null,
        created_at: SIMULATION_DATE,
        updated_at: SIMULATION_DATE,
      },
    ]);
    expect(record(entry.data).scorm_package_id).toBe(data.scormPackages[0].id);
    expect(record(entry.data).launch_url).toBeUndefined();
    expect(JSON.stringify(data.scormPackages)).not.toContain(real.package);
  });
});

describe('training preview safety', () => {
  it.each([
    ['url', 'text', 'https://www.youtube.com/watch?v=abc123&t=30'],
    ['resource', 'text', 'https://example.test/formation?chapter=2#section'],
    ['custom', 'url', 'http://example.test/formation'],
    ['url', 'text', '  HTTPS://example.test/formation  '],
  ])('preserves declared external URL content %s (%s): %s', async (name, fieldType, url) => {
    const { data, preview } = setup();
    const detail = graph();
    const type = detail['content-types']![0];
    type.module_type = 'url';
    type.fields = [
      { field_id: real.field, name: 'title', type: 'text' },
      { field_id: realId(23), name, type: fieldType },
    ];
    detail.entries![0].data = { title: 'Ressource externe', [name]: url };
    detail['progression-rules'] = [];
    importTrainingPreview(data, preview, real.path, detail);
    const expected = new URL(url.trim()).href;
    expect(record(data.resources.entries[0].data)[name]).toBe(expected);

    // Exercise the serializer actually consumed by PortalContentRenderer too.
    jest.mocked(createSimulationFixtures).mockReturnValueOnce(data);
    resetSimulationData(Role.TRAINEE);
    const response = await handleSimulationRequest(
      `/api/v1/enrollments/${data.enrollments[0].id}/courses/${data.resources.courses[0].id}/entries/${data.resources.entries[0].id}`,
    );
    expect(response.json).toMatchObject({
      data: { module_type: 'url', data: { [name]: expected }, field_types: { [name]: fieldType } },
    });
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'blob:https://example.test/id',
    'file:///etc/passwd',
    '//example.test/formation',
    '/api/v1/auth/logout',
    '/api/v1/platform/media/private',
    '../admin',
    '#simulation',
    'https://name:password@example.test/course',
    'https://example.test/\\course',
    'https://example.test/\ncourse',
    'http accidental embed',
    `${window.location.origin}/api/v1/auth/logout`,
    `https://${window.location.hostname}:8443/api/v1/auth/logout`,
    `https://${window.location.hostname}./api/v1/auth/logout`,
  ])('still rejects unsafe/internal URL module content: %s', (url) => {
    const { data, preview } = setup();
    const detail = graph();
    detail['content-types']![0].module_type = 'url';
    record(detail.entries![0].data).url = url;
    importTrainingPreview(data, preview, real.path, detail);
    expect(record(data.resources.entries[0].data).url).toBe('');
  });

  it.each([
    'https://evil.test/image.png',
    '//evil.test/image.png',
    '/api/v1/platform/media/image',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'javascript:alert(1)',
    'blob:https://evil.test/a',
    '#simulation',
    '/simulation/formation-cover.svg',
    `${mediaUrl()}?download=1`,
    `${mediaUrl()}#fragment`,
    `${mediaUrl()}/other`,
    mediaUrl(real.secondPath),
    `${mediaUrl()}/../other`,
    mediaUrl(real.path, '%2e%2e'),
    `https://app.example.test${mediaUrl()}`,
    ` ${mediaUrl()}`,
    `${mediaUrl()}\n`,
  ])('rejects unsafe scalar/image/media URL %s', (url) => {
    const source = catalog();
    source.image = { id: real.media, url, mime_type: 'image/png' };
    const { data, preview } = setup([source]);
    const detail = graph();
    detail.media![0].url = url;
    record(detail.entries![0].data).url = url;
    importTrainingPreview(data, preview, real.path, detail);
    expect(data.resources['learning-paths'][0].image).toBeNull();
    expect(data.resources.media).toEqual([]);
    expect(record(data.resources.entries[0].data).url).toBe('');
    expect(record(data.resources.entries[0].data).photo).toBeNull();
  });

  it('permits only exact per-path img sources in inert allowlisted HTML, preserving formatting', () => {
    const { data, preview } = setup();
    const detail = graph();
    record(detail.entries![0].data).body = `
      <h2>Titre</h2><p>Texte <em>important</em><strong>utile</strong></p>
      <ul><li>Liste</li></ul><table><tr><td colspan="2">Cellule</td></tr></table>
      <img src="${mediaUrl()}" alt="Cours" onerror="alert(1)" style="background:url(https://evil.test)" srcset="https://evil.test 2x">
      <img src="https://evil.test/image"><img src="${mediaUrl(real.secondPath)}">
      <img src="/api/v1/platform/media/${real.media}"><img src="${mediaUrl()}?x=1">
      <a href="https://evil.test" ping="https://evil.test">Lien</a>
      <script>alert(1)</script><style>p{background:url(https://evil.test)}</style>
      <form action="https://evil.test"><input autofocus onfocus="alert(1)"></form>
      <iframe srcdoc="<img src=https://evil.test>" src="https://evil.test"></iframe>
      <object data="https://evil.test"></object><embed src="https://evil.test">
      <svg><image href="https://evil.test"></image></svg><math><mtext>bad</mtext></math>
      <div style="background:url(https://evil.test)" onclick="alert(1)" data-user-id="${real.actor}">Inerte</div>`;
    importTrainingPreview(data, preview, real.path, detail);
    const html = record(data.resources.entries[0].data).body as string;
    const container = document.createElement('template');
    container.innerHTML = html;
    expect(html).toContain('<h2>Titre</h2>');
    expect(html).toContain('<em>important</em>');
    expect(html).toContain('<strong>utile</strong>');
    expect(html).toContain('colspan="2"');
    expect(html).not.toMatch(
      /evil\.test|onerror|onclick|style=|srcset|href=|srcdoc|data-user|<script|<style|<form|<iframe|<object|<embed|<svg|<math/i,
    );
    expect(
      [...container.content.querySelectorAll('[src]')].map((node) => node.getAttribute('src')),
    ).toEqual([mediaUrl()]);
  });

  it('rejects remote-looking text in any declared field and honors URL-type fields with arbitrary names', () => {
    const { data, preview } = setup();
    const detail = graph();
    records(detail['content-types']![0].fields).push(
      { field_id: realId(30), name: 'custom', type: 'url' },
      { field_id: realId(31), name: 'link', type: 'text' },
    );
    Object.assign(record(detail.entries![0].data), {
      custom: '#simulation',
      link: 'http accidental embed',
    });
    importTrainingPreview(data, preview, real.path, detail);
    expect(record(data.resources.entries[0].data)).toMatchObject({ url: '', custom: '', link: '' });
  });

  it('performs no network, storage or source-object writes', () => {
    const previousFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
    const network = jest.fn(() => {
      throw new Error('Unexpected network request');
    });
    Object.defineProperty(globalThis, 'fetch', { value: network, configurable: true });
    const storage = jest.spyOn(Storage.prototype, 'setItem');
    const xhr = jest.spyOn(XMLHttpRequest.prototype, 'open');
    try {
      const { data, preview } = setup();
      importTrainingPreview(data, preview, real.path, graph());
      expect(network).not.toHaveBeenCalled();
      expect(storage).not.toHaveBeenCalled();
      expect(xhr).not.toHaveBeenCalled();
    } finally {
      if (previousFetch) Object.defineProperty(globalThis, 'fetch', previousFetch);
      else Reflect.deleteProperty(globalThis, 'fetch');
    }
  });
});

describe('compatibility with the existing local engine', () => {
  it('resolves media and plays inert SCORM, then completes progression and scores synthetic quiz options', async () => {
    const { data, preview } = setup();
    const source = graph();
    // A failure edge back to its own root is a locked cycle in the existing engine.
    source['progression-rules']![0].target_on_failure = null;
    importTrainingPreview(data, preview, real.path, source);
    jest.mocked(createSimulationFixtures).mockReturnValueOnce(data);
    resetSimulationData(Role.TRAINEE);
    const enrollmentId = data.enrollments[0].id;
    const courseId = data.resources.courses[0].id;
    const competencyId = data.resources.competencies[0].id;
    const entryId = data.resources.entries[0].id;
    const scormId = data.resources.entries[1].id;
    const evaluationId = data.resources.evaluations[0].id;
    const request = async (path: string, body?: Record<string, unknown>) => {
      const result = await handleSimulationRequest(
        `/api/v1/${path}`,
        body === undefined
          ? {}
          : {
              method: 'POST',
              body: JSON.stringify(body),
            },
      );
      return result.status === 204 ? {} : record(record(result.json).data);
    };
    const entry = await request(
      `enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}`,
    );
    expect(record(record(entry.data).photo)).toMatchObject({
      id: data.resources.media[0].id,
      url: mediaUrl(),
    });
    expect(record(entry.data).url).toBe('');
    const launch = await request(
      `enrollments/${enrollmentId}/courses/${courseId}/entries/${scormId}/scorm/launch?competency_id=${competencyId}`,
    );
    expect(launch.launch_url).toBe(SIMULATION_SCORM_LAUNCH);
    expect(launch.scorm_package_id).toBe(data.scormPackages[0].id);
    await expect(
      request(`enrollments/${enrollmentId}/evaluations/${evaluationId}/attempts`, {}),
    ).rejects.toMatchObject({ status: 403 });
    for (const entry of data.resources.entries) {
      await request(
        `enrollments/${enrollmentId}/competencies/${competencyId}/courses/${courseId}/entries/${entry.id}/complete`,
        {},
      );
    }
    const attempt = await request(
      `enrollments/${enrollmentId}/evaluations/${evaluationId}/attempts`,
      {},
    );
    const quiz = records(attempt.quizzes)[0];
    const option = records(quiz.options)[0];
    expect(option.id).toMatch(synthetic);
    await request(`evaluation-attempts/${attempt.id}/quizzes/${quiz.id}/answer`, {
      selected_option_ids: [option.id],
    });
    const result = await request(`evaluation-attempts/${attempt.id}/submit`, {});
    expect(result).toMatchObject({ score: 100, status: 'completed' });
    expect(data.enrollments[0].status).toBe('completed');
    importTrainingPreview(data, preview, real.path, source);
    expect(data.attempts[0].score).toBe(100);
    const summary = await request(`enrollments/${enrollmentId}/summary`);
    expect(record(summary.progress).percent).toBe(100);
  });
});
