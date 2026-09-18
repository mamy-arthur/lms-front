/** @jest-environment node */

import { Role } from '@/shared/constants/roles';
import type { ApiCartResponse } from '@/shared/types/cart.types';
import type { ApiCourse, ApiCourseSection, ApiContentEntry } from '@/shared/types/course.types';
import type { ApiLearningPath } from '@/shared/types/learning-path.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type {
  ApiMeEnrollmentsResponse,
  CreateEnrollmentResponse,
} from '@/shared/types/enrollment.types';
import type { ApiGroup } from '@/shared/types/group.types';
import type { ApiQuestionBank, ApiQuizItem } from '@/shared/types/question-bank.types';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import type { ApiPurchasedLearningPathsResponse } from '@/shared/types/purchased-learning-path.types';
import type { ApiScormLaunch, ApiScormTrackingState } from '@/shared/api/portal-scorm.api';
import type { ApiScormPackage } from '@/shared/api/scorm.api';
import type {
  FormationDetailResponse,
  FormationSummaryListResponse,
} from '@/modules/shared/lib/evaluation-notes';
import type { TwoFactorSettings } from '@/modules/admin/resources/two-factor/types';
import {
  SIMULATION_IDS as id,
  SIMULATION_IMAGE,
  SIMULATION_COVER_IMAGE,
  SIMULATION_SCORM_LAUNCH,
  simulationId,
} from '../fixtures';
import {
  clearSimulationData,
  handleSimulationRequest,
  rememberShopData,
  resetSimulationData,
  SIMULATION_LIMITATIONS,
  SIMULATION_ROUTES,
} from '../local-api';

type Row = { id: string; [key: string]: unknown };
type Detail<T = Row> = { data: T };
type List<T = Row> = { data: T[]; total: number; meta: { total: number; current_page: number } };
const request = async <T = Detail>(path: string, method = 'GET', payload?: unknown): Promise<T> => {
  const response = await handleSimulationRequest(path, {
    method,
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  return response.json as T;
};

describe('isolated simulation business API', () => {
  let fetchSpy: jest.SpyInstance;
  const xhr = jest.fn(() => {
    throw new Error('XMLHttpRequest is forbidden in the local engine');
  });
  const websocket = jest.fn(() => {
    throw new Error('WebSocket is forbidden in the local engine');
  });
  const beacon = jest.fn(() => {
    throw new Error('sendBeacon is forbidden in the local engine');
  });
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  const descriptors = new Map<string, PropertyDescriptor | undefined>();

  beforeAll(() => {
    for (const key of [
      'XMLHttpRequest',
      'WebSocket',
      'navigator',
      'localStorage',
      'sessionStorage',
    ]) {
      descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      const value =
        key === 'XMLHttpRequest'
          ? xhr
          : key === 'WebSocket'
            ? websocket
            : key === 'navigator'
              ? { sendBeacon: beacon }
              : storage;
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }
  });
  afterAll(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  beforeEach(() => {
    resetSimulationData(Role.EDITOR);
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('Network is forbidden');
    });
  });
  afterEach(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhr).not.toHaveBeenCalled();
    expect(websocket).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    for (const method of Object.values(storage)) expect(method).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    clearSimulationData();
  });

  it('returns the same detail shape for relative, API-prefixed and absolute business URLs', async () => {
    for (const root of [
      'platform/courses',
      '/api/v1/platform/courses',
      'https://simulation.example.test/api/v1/platform/courses',
    ]) {
      const result = await handleSimulationRequest(`${root}/${id.course}`);
      expect(result.status).toBe(200);
      expect(result.headers.get('X-Learneo-Simulation')).toBe('true');
      expect(result.headers.get('Cache-Control')).toBe('no-store');
      expect(JSON.parse(result.body)).toEqual(result.json);
      expect(result.json).toMatchObject({
        data: { id: id.course, full_name: 'Premiers pas démonstration' },
      });
    }
  });

  it.each([
    ['platform/learning-paths', id.learningPath],
    ['platform/courses', id.course],
    ['platform/competencies', id.competency],
    ['platform/content-types', id.contentType],
    ['platform/users', id.editor],
    ['users', id.learner],
    ['groups', id.group],
    ['platform/certificates', id.certificate],
    ['certificates', id.certificate],
    ['platform/template-mails', id.mailTemplate],
    ['template-mails', id.mailTemplate],
    ['platform/learning-path-categories', id.category],
    ['platform/course-categories', id.category],
    ['platform/competency-categories', id.category],
    ['platform/tenants', id.tenant],
  ])('serves populated lists and details for %s', async (root, entityId) => {
    const list = await request<List>(root);
    expect(list.data.some((row) => row.id === entityId)).toBe(true);
    expect(list.meta.total).toBe(list.total);
    const detail = await request(`${root}/${entityId}`);
    expect(detail.data.id).toBe(entityId);
  });

  it('creates, updates, rereads and deletes learning paths with stable UUIDs', async () => {
    const created = await request<Detail<ApiLearningPath>>('platform/learning-paths', 'POST', {
      name: 'Nouveau parcours démonstration',
      category_id: id.category,
      price: 10,
      competency_ids: [id.competency],
    });
    expect(created.data.id).toMatch(/^[\da-f-]{36}$/);
    expect(created.data.competencies).toEqual([
      { competency_id: id.competency, position: 0, location_x: null, location_y: null },
    ]);
    await request(`platform/learning-paths/${created.data.id}`, 'PATCH', {
      name: 'Parcours modifié démonstration',
      price: 25,
    });
    expect(
      (await request<Detail<ApiLearningPath>>(`platform/learning-paths/${created.data.id}`)).data,
    ).toMatchObject({
      name: 'Parcours modifié démonstration',
      price: 25,
      category_name: 'Découverte démonstration',
    });
    expect((await request<List>('platform/learning-paths?q=modifié')).data).toHaveLength(1);
    const removed = await handleSimulationRequest(`platform/learning-paths/${created.data.id}`, {
      method: 'DELETE',
    });
    expect(removed).toMatchObject({ status: 204, body: '', json: null });
    await expect(request(`platform/learning-paths/${created.data.id}`)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('filters, sorts and paginates without leaking rows outside the requested filter', async () => {
    expect((await request<List>(`platform/courses?ids=${simulationId(900)}`)).data).toEqual([]);
    expect((await request<List>('platform/users?roles=TRAINEE')).data).toHaveLength(2);
    const first = await request<List>(
      'platform/learning-paths?per_page=1&page=1&sort_by=name&sort_dir=asc',
    );
    const second = await request<List>(
      'platform/learning-paths?per_page=1&page=2&sort_by=name&sort_dir=asc',
    );
    expect(first.meta.total).toBe(2);
    expect(first.data[0].id).not.toBe(second.data[0].id);
    expect((await request<List>('platform/users?page=0&page_size=1')).data[0].id).toBe(id.editor);
    expect((await request<List>('platform/users?page=1&page_size=1')).data[0].id).toBe(id.manager);
  });

  it('keeps courses, scoped sections and entries coherent through mutations', async () => {
    const course = (
      await request<Detail<ApiCourse>>('platform/courses', 'POST', {
        full_name: 'Cours ajouté démonstration',
        short_name: 'Cours démo',
        category_id: id.category,
      })
    ).data;
    const first = (
      await request<Detail<ApiCourseSection>>(`platform/courses/${course.id}/sections`, 'POST', {
        name: 'A démonstration',
      })
    ).data;
    const second = (
      await request<Detail<ApiCourseSection>>(`platform/courses/${course.id}/sections`, 'POST', {
        name: 'B démonstration',
      })
    ).data;
    await request(`platform/courses/${course.id}/sections/reorder`, 'POST', {
      section_ids: [second.id, first.id],
    });
    expect(
      (
        await request<Detail<ApiCourseSection>>(
          `platform/courses/${course.id}/sections/${second.id}`,
        )
      ).data.rank,
    ).toBe(0);
    expect(
      (await request<List>(`platform/courses/${course.id}/sections`)).data.map(
        (section) => section.id,
      ),
    ).toEqual([second.id, first.id]);
    await request(`platform/courses/${course.id}/sections/${second.id}/visibility`, 'PATCH', {
      is_hidden: true,
    });
    expect(
      (
        await request<Detail<ApiCourseSection>>(
          `platform/courses/${course.id}/sections/${second.id}`,
        )
      ).data.is_hidden,
    ).toBe(true);
    const entry = (
      await request<Detail<ApiContentEntry>>(
        `platform/course-sections/${first.id}/entries`,
        'POST',
        {
          content_type_id: id.contentType,
          data: { title: 'Page démonstration', content: '<p>Texte local</p>' },
        },
      )
    ).data;
    await request(`platform/entries/${entry.id}`, 'PUT', {
      data: { title: 'Page modifiée démonstration' },
      is_published: true,
    });
    await request(`platform/entries/${entry.id}/move`, 'POST', {
      course_section_id: second.id,
      position: 0,
    });
    expect((await request<List>(`platform/course-sections/${first.id}/entries`)).data).toEqual([]);
    expect(
      (await request<List>(`platform/course-sections/${second.id}/entries`)).data[0],
    ).toMatchObject({ id: entry.id, is_published: true, rank: 0 });
    await expect(
      request(`platform/courses/${id.course}/sections/${first.id}`),
    ).rejects.toMatchObject({ status: 404 });
    await request(`platform/courses/${course.id}`, 'DELETE');
    await expect(request(`platform/entries/${entry.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('supports module associations, positions, duplicates, overview and unlinking', async () => {
    const module = (
      await request('platform/competencies', 'POST', {
        shortname: 'Module ajouté démonstration',
        course_ids: [id.course],
        category_id: id.category,
      })
    ).data;
    expect(module.courses_count).toBe(1);
    await request(`platform/learning-paths/${id.learningPath}/competencies`, 'POST', {
      competency_id: module.id,
    });
    await request(`platform/learning-paths/${id.learningPath}/competencies/${module.id}`, 'PATCH', {
      location_x: 25,
      location_y: 60,
    });
    const path = (
      await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.learningPath}`)
    ).data;
    expect(path.competencies?.find((link) => link.competency_id === module.id)).toMatchObject({
      location_x: 25,
      location_y: 60,
    });
    const overview = (await request(`platform/competencies/${module.id}/overview`)).data;
    expect(overview).toMatchObject({ course_count: 1, learning_path_count: 1 });
    const duplicate = (await request(`platform/competencies/${module.id}/duplicate`, 'POST')).data;
    expect(duplicate.id).not.toBe(module.id);
    expect(duplicate.courses_count).toBe(1);
    await request(`platform/learning-paths/${id.learningPath}/competencies/${module.id}`, 'DELETE');
    expect(
      (await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.learningPath}`)).data
        .competencies,
    ).toHaveLength(1);
  });

  it('uses bare question bank and quiz responses, but wrapped evaluation responses', async () => {
    const bank = await request<ApiQuestionBank>('platform/question-banks', 'POST', {
      title: 'Banque ajoutée démonstration',
      learning_path_ids: [id.learningPath],
    });
    expect(bank.id).toBeDefined();
    expect(bank).not.toHaveProperty('data');
    const quiz = await request<ApiQuizItem>(`platform/question-banks/${bank.id}/quizzes`, 'POST', {
      type: 'single_choice',
      question: 'Question démonstration',
      competency_id: id.competency,
      options: [
        { label: 'Oui', is_correct: true },
        { label: 'Non', is_correct: false },
      ],
    });
    expect(quiz.type).toBe('single_choice');
    if (quiz.type === 'single_choice') expect(quiz.options[0].id).toMatch(/^[\da-f-]{36}$/);
    await request(`platform/quizzes/${quiz.id}`, 'PUT', {
      question: 'Question modifiée démonstration',
    });
    expect((await request<ApiQuizItem>(`platform/quizzes/${quiz.id}`)).question).toBe(
      'Question modifiée démonstration',
    );
    const evaluation = await request(
      `platform/learning-paths/${id.learningPath}/evaluations`,
      'POST',
      {
        title: 'Évaluation ajoutée démonstration',
        type: 'PARTIAL',
        question_bank_ids: [bank.id],
        question_count: 1,
      },
    );
    expect(evaluation.data).toMatchObject({
      learning_path_id: id.learningPath,
      pool_size: 1,
      pool_insufficient: false,
    });
    const check = await request<{ total: number; available: number }>(
      `platform/learning-paths/${id.learningPath}/evaluations/pool-check?question_bank_ids=${bank.id}`,
    );
    expect(check).toMatchObject({ total: 1, available: 1 });
    expect(
      (await request<ApiQuestionBank>(`platform/question-banks/${bank.id}/deactivate`, 'PATCH'))
        .is_active,
    ).toBe(false);
    await request(`platform/quizzes/${quiz.id}`, 'DELETE');
    expect((await request<List>(`platform/question-banks/${bank.id}/quizzes`)).data).toEqual([]);
  });

  it('persists progression rules and their deactivation', async () => {
    const rule = (
      await request(`platform/learning-paths/${id.learningPath}/progression-rules`, 'POST', {
        source: { type: 'module', id: id.competency },
        condition: { type: 'module_completed', rule_type: 'all' },
        target_on_success: { type: 'evaluation', id: id.evaluation },
      })
    ).data;
    expect(
      (await request<List>(`platform/learning-paths/${id.learningPath}/progression-rules`)).data[0]
        .id,
    ).toBe(rule.id);
    await request(`platform/progression-rules/${rule.id}/deactivate`, 'PATCH');
    expect((await request(`platform/progression-rules/${rule.id}`)).data.is_active).toBe(false);
  });

  it.each(['platform/certificates', 'certificates', 'platform/template-mails', 'template-mails'])(
    'supports template CRUD and duplication for %s',
    async (root) => {
      const created = (
        await request(root, 'POST', {
          name: 'Modèle démonstration',
          subject: 'Objet démonstration',
          body: '<p>Texte local</p>',
        })
      ).data;
      await request(`${root}/${created.id}`, 'PATCH', { name: 'Modèle modifié démonstration' });
      expect((await request(`${root}/${created.id}`)).data.name).toBe(
        'Modèle modifié démonstration',
      );
      const duplicate = (await request(`${root}/${created.id}/duplicate`, 'POST')).data;
      expect(duplicate.id).not.toBe(created.id);
      if (root.endsWith('certificates')) {
        const preview = await request<{ data: { body: string; resolved: boolean } }>(
          `${root}/${created.id}/preview`,
          'POST',
          { resolve_variables: true },
        );
        expect(preview.data).toEqual({ body: '<p>Texte local</p>', resolved: true });
      }
      await request(`${root}/${created.id}`, 'DELETE');
      await expect(request(`${root}/${created.id}`)).rejects.toMatchObject({ status: 404 });
    },
  );

  it('assigns templates and certificates and preserves diagram positions', async () => {
    await request(`platform/learning-paths/${id.secondLearningPath}/certificate`, 'POST', {
      certificate_id: id.certificate,
    });
    await request(
      `platform/learning-paths/${id.secondLearningPath}/certificate/location`,
      'PATCH',
      { location_x: 50, location_y: 70 },
    );
    expect(
      (await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.secondLearningPath}`))
        .data.certificate,
    ).toMatchObject({ id: id.certificate, location_x: 50, location_y: 70 });
    await request(`platform/learning-paths/${id.secondLearningPath}/certificate`, 'DELETE');
    expect(
      (await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.secondLearningPath}`))
        .data.certificate,
    ).toBeNull();
  });

  it('supports content-type field IDs, versions and field/mime discovery', async () => {
    const contentType = (
      await request('platform/content-types', 'POST', {
        title: 'Type démonstration',
        module_type: 'page',
        fields: [{ name: 'title', label: 'Titre', type: 'text', required: true }],
      })
    ).data;
    expect(contentType.version).toBe(1);
    const fields = contentType.fields as Array<{ field_id: string; id: string }>;
    expect(fields[0].id).toBe(fields[0].field_id);
    await request(`platform/content-types/${contentType.id}`, 'PUT', {
      fields: contentType.fields,
    });
    expect((await request(`platform/content-types/${contentType.id}`)).data.version).toBe(2);
    expect((await request<{ data: string[] }>('platform/field-types')).data).toContain('richtext');
    expect((await request<{ data: string[] }>('platform/media-mime-types')).data).toContain(
      'image/png',
    );
  });

  it('supports client users, group membership, purchased paths and enrollment creation', async () => {
    resetSimulationData(Role.CLIENT_MANAGER);
    const user = (
      await request('users', 'POST', {
        first_name: 'Lou',
        last_name: 'démonstration',
        email: 'lou@example.test',
        role: Role.TRAINEE,
        password: 'never-stored',
      })
    ).data;
    expect(user).not.toHaveProperty('password');
    expect(user.full_name).toBe('Lou démonstration');
    await request(`users/${user.id}`, 'PATCH', { first_name: 'Kim' });
    expect((await request(`users/${user.id}`)).data.full_name).toBe('Kim démonstration');
    const group = (
      await request<Detail<ApiGroup>>('groups', 'POST', { name: 'Nouveau groupe démonstration' })
    ).data;
    await request(`groups/${group.id}/members`, 'POST', { trainee_id: user.id });
    expect((await request<Detail<ApiGroup>>(`groups/${group.id}`)).data.members[0].trainee_id).toBe(
      user.id,
    );
    const created = await request<CreateEnrollmentResponse>('enrollments', 'POST', {
      learning_path_id: id.learningPath,
      learner_ids: [id.learner],
      group_ids: [group.id],
    });
    expect(created.meta).toEqual({
      enrolled_count: 1,
      skipped_count: 1,
      skipped_learner_ids: [id.learner],
    });
    const purchases = await request<ApiPurchasedLearningPathsResponse>('purchased-learning-paths');
    expect(purchases.data[0]).toMatchObject({ used: 2, purchased: 12, credits_available: 10 });
    const history = await request<List>(
      `purchased-learning-paths/${id.purchase}/enrollments/history`,
    );
    expect(history.data).toHaveLength(2);
    expect(history.data[1].learner).toMatchObject({ email: 'lou@example.test' });
    await request(`groups/${group.id}/members/${user.id}`, 'DELETE');
    expect((await request<Detail<ApiGroup>>(`groups/${group.id}`)).data.members).toEqual([]);
    await request(`users/${user.id}`, 'DELETE');
    await expect(request(`users/${user.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('provides enrollment lists, content, completion, time sessions and scored quiz attempts', async () => {
    resetSimulationData(Role.TRAINEE);
    const list = await request<ApiMeEnrollmentsResponse>('me/enrollments');
    expect(list.data[0]).toMatchObject({
      id: id.enrollment,
      progress_percent: 0,
      learning_path: { id: id.learningPath },
    });
    expect(await request('my-learning-paths')).toEqual(await request('me/enrollments'));
    const content = await request(
      `enrollments/${id.enrollment}/courses/${id.course}/entries/${id.entry}`,
    );
    expect(content.data).toMatchObject({
      module_type: 'page',
      field_types: { title: 'text', content: 'richtext' },
    });
    const completePath = `enrollments/${id.enrollment}/competencies/${id.competency}/courses/${id.course}/entries/${id.entry}/complete`;
    await request(completePath, 'POST');
    await request(completePath, 'POST');
    const summary = (
      await request<Detail<ApiPortalLearningPathSummary>>(`enrollments/${id.enrollment}/summary`)
    ).data;
    expect(summary.modules[0].progress).toEqual({ completed: 1, total: 1, percent: 100 });
    expect(summary.progress.percent).toBe(50);
    await request(
      `enrollments/${id.enrollment}/courses/${id.course}/entries/${id.entry}/time-sessions/${simulationId(900)}`,
      'PUT',
      {
        competency_id: id.competency,
        started_at: '2026-09-18T09:00:00Z',
        ended_at: '2026-09-18T09:00:10Z',
        time_spent: 10,
      },
    );
    const attemptPath = `enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`;
    const attempt = (await request<Detail<ApiEvaluationAttempt>>(attemptPath, 'POST')).data;
    expect((await request<Detail<ApiEvaluationAttempt>>(attemptPath, 'POST')).data.id).toBe(
      attempt.id,
    );
    expect(attempt.quizzes[0]).not.toHaveProperty('correct_answer');
    await request(
      `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`,
      'POST',
      { answer: true },
    );
    const submitted = await request<Detail<ApiEvaluationAttempt>>(
      `evaluation-attempts/${attempt.id}/submit`,
      'POST',
    );
    expect(submitted.data).toMatchObject({ status: 'completed', score: 100 });
    expect((await request<ApiMeEnrollmentsResponse>('me/enrollments')).data[0]).toMatchObject({
      status: 'completed',
      progress_percent: 100,
    });
    expect((await request<List>(`enrollments/${id.enrollment}/evaluations`)).data[0]).toMatchObject(
      { attempts_used: 1, last_attempt_status: 'completed' },
    );
    await expect(
      request(`evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`, 'POST', {
        answer: false,
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('scores incorrect answers honestly and rejects content outside an enrollment', async () => {
    resetSimulationData(Role.TRAINEE);
    const attempt = (
      await request<Detail<ApiEvaluationAttempt>>(
        `enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`,
        'POST',
      )
    ).data;
    await request(
      `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`,
      'POST',
      { answer: false },
    );
    expect(
      (
        await request<Detail<ApiEvaluationAttempt>>(
          `evaluation-attempts/${attempt.id}/submit`,
          'POST',
        )
      ).data.score,
    ).toBe(0);
    await expect(
      request(
        `enrollments/${id.enrollment}/competencies/${simulationId(999)}/courses/${id.course}/entries/${id.entry}/complete`,
        'POST',
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('adds, increments, changes quantity and removes cart items with real client payloads', async () => {
    resetSimulationData(Role.CLIENT_MANAGER);
    expect((await request<ApiCartResponse>('carts')).data.items).toEqual([]);
    let cart = (
      await request<ApiCartResponse>('carts/items', 'POST', { learning_path_id: id.learningPath })
    ).data;
    expect(cart).toMatchObject({ total: 45, items: [{ quantity: 1, price: 45 }] });
    cart = (
      await request<ApiCartResponse>('carts/items', 'POST', { learning_path_id: id.learningPath })
    ).data;
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.total).toBe(90);
    cart = (
      await request<ApiCartResponse>(`carts/items/${cart.items[0].id}`, 'PATCH', { quantity: 3 })
    ).data;
    expect(cart.total).toBe(135);
    await expect(
      request(`carts/items/${cart.items[0].id}`, 'PATCH', { quantity: -2 }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      request(`carts/items/${cart.items[0].id}`, 'PATCH', { quantity: 1.5 }),
    ).rejects.toMatchObject({ status: 422 });
    const removed = await request<ApiCartResponse>(
      `/api/v1/carts/items/${cart.items[0].id}`,
      'DELETE',
    );
    expect(removed.data).toMatchObject({ total: 0, items: [] });
    expect((await request<ApiCartResponse>('carts')).data).toEqual(removed.data);
  });

  it.each(['card', 'bank_transfer', 'cash'])(
    'creates a local %s order without any payment URL or redirect',
    async (paymentMethod) => {
      resetSimulationData(Role.CLIENT_MANAGER);
      await request('carts/items', 'POST', { learning_path_id: id.learningPath });
      const order = (await request('orders', 'POST', { payment_method: paymentMethod })).data;
      expect(order).toMatchObject({
        payment_method: paymentMethod,
        status: 'completed',
        total: 45,
      });
      expect(JSON.stringify(order)).not.toMatch(/https?:|payment_url|redirect|checkout_url/);
      expect((await request<ApiCartResponse>('carts')).data).toMatchObject({ items: [], total: 0 });
      expect((await request<List>('orders')).data[0]).toEqual(order);
      expect((await request(`orders/${order.id}`)).data).toEqual(order);
      expect(
        (await request<ApiPurchasedLearningPathsResponse>('purchased-learning-paths')).data[0]
          .purchased,
      ).toBe(13);
      await expect(
        request('orders', 'POST', { payment_method: paymentMethod }),
      ).rejects.toMatchObject({ status: 422 });
    },
  );

  it('remembers shop pricing without importing external assets or learning content', async () => {
    const productId = simulationId(800);
    rememberShopData({
      data: [
        {
          id: productId,
          name: 'REAL SECRET PRODUCT',
          price: '19.95',
          currency: 'EUR',
          image: { url: 'https://real.example.test/private.png' },
          competencies: [{ id: 'real-competency' }],
        },
      ],
    });
    const cart = (
      await request<ApiCartResponse>('carts/items', 'POST', { learning_path_id: productId })
    ).data;
    expect(cart).toMatchObject({
      total: 19.95,
      items: [
        { name: 'Produit boutique démonstration', price: 19.95, image: SIMULATION_COVER_IMAGE },
      ],
    });
    expect(JSON.stringify(cart)).not.toMatch(/REAL SECRET|https?:|real-competency/);
    await expect(request(`platform/learning-paths/${productId}`)).rejects.toMatchObject({
      status: 404,
    });
    const before = await request('purchased-learning-paths');
    await request('orders', 'POST', { payment_method: 'card' });
    expect(await request('purchased-learning-paths')).toEqual(before);
    resetSimulationData(Role.EDITOR);
    await expect(
      request('carts/items', 'POST', { learning_path_id: productId }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('preserves the authorized shop cover in the cart and checkout without importing training data', async () => {
    const productId = simulationId(800);
    const image = `/api/v1/role-simulation/shop/learning-paths/${productId}/image`;
    rememberShopData({
      data: { id: productId, price: 45, currency: 'EUR', image: { url: image } },
    });
    const cart = await request<ApiCartResponse>('carts/items', 'POST', {
      learning_path_id: productId,
    });
    expect(cart.data.items[0].image).toBe(image);
    expect((await request<ApiCartResponse>('carts')).data.items[0].image).toBe(image);
    await request(`carts/items/${cart.data.items[0].id}`, 'PATCH', { quantity: 2 });
    const order = await request('orders', 'POST', { payment_method: 'card' });
    expect(order.data).toMatchObject({ total: 90, items: [{ image }] });
    await expect(request(`platform/learning-paths/${productId}`)).rejects.toMatchObject({
      status: 404,
    });
  });

  it.each([
    '/api/v1/platform/media/private/file',
    '/api/v1/role-simulation/shop/learning-paths/other-product/image',
    '/api/v1/role-simulation/shop/learning-paths/product/image?tenant_id=another',
    '//external.example/api/v1/role-simulation/shop/learning-paths/product/image',
    'https://external.example/image.png',
    'javascript:alert(1)',
  ])('does not preserve an unauthorized image URL in the cart: %s', async (url) => {
    rememberShopData({ data: { id: 'product', price: 45, currency: 'EUR', image: { url } } });
    const cart = await request<ApiCartResponse>('carts/items', 'POST', {
      learning_path_id: 'product',
    });
    expect(cart.data.items[0].image).toBe(SIMULATION_COVER_IMAGE);
  });

  it('updates a cart cover if the refreshed shop product no longer has one', async () => {
    const image = '/api/v1/role-simulation/shop/learning-paths/product/image';
    rememberShopData({
      data: { id: 'product', price: 45, currency: 'EUR', image: { url: image } },
    });
    await request('carts/items', 'POST', { learning_path_id: 'product' });
    rememberShopData({ data: { id: 'product', price: 45, currency: 'EUR', image: null } });
    expect((await request<ApiCartResponse>('carts')).data.items[0].image).toBe(
      SIMULATION_COVER_IMAGE,
    );
  });

  it('uses visible local artwork for fictional cart products', async () => {
    const cart = await request<ApiCartResponse>('carts/items', 'POST', {
      learning_path_id: id.learningPath,
    });
    expect(cart.data.items[0].image).toBe(SIMULATION_COVER_IMAGE);
  });

  it('ignores malformed shop responses and rejects unknown items or currency mixing', async () => {
    rememberShopData(null);
    rememberShopData({ data: { id: 'bad', price: -1, currency: 'EUR' } });
    await expect(request('carts/items', 'POST', { learning_path_id: 'bad' })).rejects.toMatchObject(
      { status: 422 },
    );
    await request('carts/items', 'POST', { learning_path_id: id.learningPath });
    rememberShopData({ data: { id: 'usd-product', price: 10, currency: 'USD' } });
    await expect(
      request('carts/items', 'POST', { learning_path_id: 'usd-product' }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it.each([
    'platform/media',
    'platform/inline-media',
    'platform/learning-paths/media',
    'platform/competencies/media',
    'platform/certificates/media',
    'template-mails/media',
  ])('accepts multipart on %s and returns an inert local placeholder', async (path) => {
    const form = new FormData();
    form.append(
      'file',
      new Blob(['<script>unsafe()</script>'], { type: 'text/html' }),
      'demonstration.html',
    );
    const result = await handleSimulationRequest(path, { method: 'POST', body: form });
    const media = (result.json as Detail).data;
    expect(result.status).toBe(201);
    expect(media).toMatchObject({
      url: SIMULATION_IMAGE,
      mime_type: 'image/png',
      original_name: 'demonstration.html',
    });
    expect(media).not.toHaveProperty('upload_url');
    expect((await request(`platform/media/${media.id}`)).data).toEqual(media);
    await request(`platform/media/${media.id}`, 'DELETE');
    await expect(request(`platform/media/${media.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('never returns remote/executable assets submitted with edited HTML', async () => {
    await request(`platform/entries/${id.entry}`, 'PUT', {
      data: {
        title: 'Page démonstration',
        content: '<p><img src="https://real.example.test/tracker.png" onerror="evil()">Texte</p>',
        url: 'https://real.example.test/content',
      },
    });
    const result = await request(`platform/entries/${id.entry}`);
    expect(JSON.stringify(result)).not.toMatch(/https?:|onerror|evil/);
  });

  it.each([
    'auth/logout',
    'platform/auth/logout',
    'auth/login',
    'platform/auth/me',
    'auth/impersonation',
    'platform/impersonations',
    'role-simulation',
    'role-simulation/shop/learning-paths',
    'platform/role-simulation',
    'auth/session/replace',
    'platform/auth/two-factor-challenge',
    'auth/two-factor-resend',
    'auth/reset-password/extra',
  ])('keeps session control forbidden for every method on %s', async (path) => {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      await expect(request(path, method)).rejects.toMatchObject({
        status: 403,
        json: { code: 'SIMULATION_AUTH_FORBIDDEN' },
      });
    }
  });

  it.each([
    'unknown-resource',
    'platform/courses/unimplemented/action',
    'shop/learning-paths',
    'platform/media/signed-upload',
    'platform/scorm-packages/unknown/signed-upload',
    'wallet/transfers',
    'messaging/unknown',
  ])('fails closed for unsupported %s without a successful empty body', async (path) => {
    for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']) {
      await expect(request(path, method)).rejects.toMatchObject({
        status: 501,
        message: expect.stringContaining('Aucun appel réseau'),
        json: { code: 'SIMULATION_ROUTE_UNSUPPORTED' },
      });
    }
  });

  it('supports the legacy course camelCase/bare contract and shares edits with modern course reads', async () => {
    const created = await request<Row>('courses', 'POST', {
      fullName: 'Cours legacy démonstration',
      shortName: 'Legacy démo',
      categoryId: id.category,
      visible: true,
    });
    expect(created).toMatchObject({
      fullName: 'Cours legacy démonstration',
      visible: true,
      visibility: 'PUBLISHED',
    });
    expect(created).not.toHaveProperty('data');
    await request(`courses/${created.id}`, 'PUT', {
      fullName: 'Cours legacy modifié',
      visible: false,
    });
    expect((await request(`platform/courses/${created.id}`)).data).toMatchObject({
      full_name: 'Cours legacy modifié',
      visibility: 'DRAFT',
    });
    expect(await request(`courses/${created.id}`)).toMatchObject({
      fullName: 'Cours legacy modifié',
      visible: false,
    });
    const page = await request<List>('courses?limit=1&page=2');
    expect(page.data).toHaveLength(1);
    expect(page.meta.total).toBe(3);
    await request(`courses/${created.id}`, 'DELETE');
    await expect(request(`platform/courses/${created.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('exposes trainee names/enrollment counts in the actual legacy shape after user mutations', async () => {
    const initial = await request<List>('trainees?limit=1&page=1');
    expect(initial.meta.total).toBe(2);
    expect(initial.data[0]).toMatchObject({
      id: id.learner,
      name: 'Alex démonstration',
      tenantId: id.tenant,
      isActive: true,
      enrolledCourses: 2,
    });
    await request(`users/${id.learner}`, 'PATCH', { first_name: 'Nouvel Alex', is_active: false });
    expect(await request(`trainees/${id.learner}`)).toMatchObject({
      name: 'Nouvel Alex démonstration',
      isActive: false,
    });
    expect((await request<List>('trainees?q=Nouvel')).data).toHaveLength(1);
    await expect(request(`trainees/${id.manager}`)).rejects.toMatchObject({ status: 404 });
  });

  it('derives evaluation note rows and summary scores from submitted learner attempts', async () => {
    const before = await request<FormationDetailResponse>(
      `admin/evaluation-notes/formations/${id.learningPath}`,
    );
    expect(before.data).toMatchObject({
      name: 'Découverte guidée démonstration',
      evaluations: [{ id: id.evaluation, label: 'Bilan démonstration' }],
      rows: [
        {
          traineeId: id.learner,
          traineeName: 'Alex démonstration',
          evaluations: [{ pointsEarned: 0, pointsMax: 100 }],
        },
      ],
    });
    const attempt = (
      await request<Detail<ApiEvaluationAttempt>>(
        `enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`,
        'POST',
      )
    ).data;
    await request(
      `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`,
      'POST',
      { answer: true },
    );
    await request(`evaluation-attempts/${attempt.id}/submit`, 'POST');
    const after = await request<FormationDetailResponse>(
      `evaluation-notes/formations/${id.learningPath}`,
    );
    expect(after.data.rows[0].evaluations[0].pointsEarned).toBe(100);
    const summaries = await request<FormationSummaryListResponse>(
      `admin/evaluation-notes/formations?tenant_id=${id.tenant}&q=Alex`,
    );
    expect(summaries.data.find((row) => row.id === id.learningPath)).toMatchObject({
      traineeCount: 1,
      evaluationCount: 1,
      avgScore: 100,
      successRate: 100,
    });
    expect(summaries.clients).toEqual([{ id: id.tenant, name: 'Organisation démonstration' }]);
    expect(
      (await request<FormationSummaryListResponse>('evaluation-notes/formations?tenant_id=unknown'))
        .data,
    ).toEqual([]);
    after.data.rows[0].evaluations[0].pointsEarned = -1;
    expect(
      (await request<FormationDetailResponse>(`evaluation-notes/formations/${id.learningPath}`))
        .data.rows[0].evaluations[0].pointsEarned,
    ).toBe(100);
  });

  it('returns visual password/reset/2FA-reset successes without retaining or echoing secrets', async () => {
    const before = await request(`users/${id.learner}`);
    const secret = 'NEVER-RETAIN-PASSWORD-OTP-TOKEN';
    for (const root of ['', 'platform/']) {
      for (const action of ['forgot-password', 'reset-password']) {
        const result = await request(`${root}auth/${action}`, 'POST', {
          email: 'demo@example.test',
          token: secret,
          password: secret,
          password_confirmation: secret,
        });
        expect(result).toMatchObject({
          simulation: true,
          message: expect.stringContaining('Simulation'),
        });
        expect(JSON.stringify(result)).not.toContain(secret);
      }
      const change = await request(`${root}users/${id.learner}/password`, 'PATCH', {
        current_password: secret,
        password: secret,
        password_confirmation: secret,
      });
      expect(JSON.stringify(change)).not.toContain(secret);
      await request(`${root}users/${id.learner}/reset-two-factor`, 'POST', { code: secret });
    }
    expect(await request(`users/${id.learner}`)).toEqual(before);
    for (const path of ['users', 'platform/two-factor-settings', 'orders', 'me/enrollments']) {
      expect(JSON.stringify(await request(path))).not.toContain(secret);
    }
  });

  it('persists only allowed 2FA configuration, applies inheritance and validates atomically', async () => {
    const globalPath = 'platform/two-factor-settings';
    const tenantPath = `platform/tenants/${id.tenant}/two-factor-settings`;
    const initial = (await request<Detail<TwoFactorSettings>>(globalPath)).data;
    expect(initial.effective.code_length).toBe(6);
    await request(globalPath, 'PUT', {
      enabled: true,
      code_length: 8,
      password: 'SECRET',
      token: 'SECRET',
    });
    await request(tenantPath, 'PUT', {
      ttl_minutes: 20,
      template_mail_id: id.mailTemplate,
      secret: 'SECRET',
    });
    let settings = (await request<Detail<TwoFactorSettings>>(tenantPath)).data;
    expect(settings).toMatchObject({
      tenant_id: id.tenant,
      overrides: { enabled: null, ttl_minutes: 20 },
      effective: {
        enabled: true,
        code_length: 8,
        ttl_minutes: 20,
        template_mail_id: id.mailTemplate,
      },
    });
    expect(JSON.stringify(settings)).not.toMatch(/SECRET|password|token|secret/);
    await request(tenantPath, 'PUT', { ttl_minutes: null, template_mail_id: null });
    settings = (await request<Detail<TwoFactorSettings>>(tenantPath)).data;
    expect(settings.effective.ttl_minutes).toBe(10);
    await expect(
      request(tenantPath, 'PUT', { enabled: false, code_length: 99 }),
    ).rejects.toMatchObject({ status: 422 });
    expect((await request<Detail<TwoFactorSettings>>(tenantPath)).data).toEqual(settings);
    expect((await request<List>(`platform/tenants/${id.tenant}/template-mails`)).data[0].id).toBe(
      id.mailTemplate,
    );
    resetSimulationData(Role.EDITOR);
    expect((await request<Detail<TwoFactorSettings>>(globalPath)).data).toEqual(initial);
  });

  it('resolves certificate preview variables from fictional selections and preserves inert mail preview bodies', async () => {
    const body =
      '<p>{{user.fullName}} — {{course.fullName}} — {{tenant.name}} — {{certificate.name}}</p>';
    await request(`certificates/${id.certificate}`, 'PATCH', { body });
    const preview = await request<{ data: { body: string; resolved: boolean } }>(
      `certificates/${id.certificate}/preview`,
      'POST',
      {
        resolve_variables: true,
        user_id: id.learner,
        course_id: id.course,
      },
    );
    expect(preview.data.resolved).toBe(true);
    expect(preview.data.body).toContain('Alex démonstration');
    expect(preview.data.body).toContain('Premiers pas démonstration');
    expect(preview.data.body).not.toContain('{{');
    expect((await request(`certificates/${id.certificate}`)).data.body).toBe(body);
    await request(`template-mails/${id.mailTemplate}`, 'PATCH', {
      body: '<p>Bonjour démonstration</p><img src="https://remote.test/pixel"><script>alert(1)</script>',
    });
    const mail = (await request(`template-mails/${id.mailTemplate}`)).data;
    expect(mail.body).toContain('<p>Bonjour démonstration</p>');
    expect(mail.body).not.toMatch(/https?:|<script|<img/);
  });

  it('uploads placeholder SCORM metadata, atomically attaches it, and retains links across editor field saves', async () => {
    const form = new FormData();
    form.append(
      'file',
      new Blob(['NEVER EXECUTE OR STORE ARCHIVE BYTES'], { type: 'application/zip' }),
      'demo.zip',
    );
    const uploaded = await handleSimulationRequest('platform/scorm-packages', {
      method: 'POST',
      body: form,
    });
    const pkg = (uploaded.json as Detail<ApiScormPackage>).data;
    expect(uploaded.status).toBe(201);
    expect(pkg).toMatchObject({
      status: 'ready',
      version: '1.2',
      content_entry_id: null,
      original_filename: 'demo.zip',
    });
    expect(JSON.stringify(pkg)).not.toMatch(/https?:|upload_url|NEVER EXECUTE/);
    const created = (
      await request(`platform/course-sections/${id.section}/entries`, 'POST', {
        content_type_id: id.scormType,
        data: { title: 'Archive fictive' },
        scorm_package_id: pkg.id,
      })
    ).data;
    expect(created.data).toMatchObject({ scorm_package_id: pkg.id });
    await request(`platform/entries/${created.id}`, 'PUT', {
      data: { title: 'SCORM modifié' },
      is_published: true,
    });
    expect((await request(`platform/entries/${created.id}`)).data.data).toEqual({
      title: 'SCORM modifié',
      scorm_package_id: pkg.id,
    });
    expect(
      (await request<Detail<ApiScormPackage>>(`platform/scorm-packages/${pkg.id}`)).data
        .content_entry_id,
    ).toBe(created.id);
    await expect(
      request(`platform/entries/${id.entry}/scorm-package`, 'POST', { scorm_package_id: pkg.id }),
    ).rejects.toMatchObject({ status: 422 });
    const before = await request(`platform/course-sections/${id.section}/entries`);
    await expect(
      request(`platform/course-sections/${id.section}/entries`, 'POST', {
        content_type_id: id.scormType,
        data: {},
        scorm_package_id: simulationId(999),
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(await request(`platform/course-sections/${id.section}/entries`)).toEqual(before);
  });

  it('launches only a constant inert inline SCORM page and persists scoped idempotent tracking/completion', async () => {
    resetSimulationData(Role.TRAINEE);
    const base = `enrollments/${id.scormEnrollment}/courses/${id.scormCourse}/entries/${id.scormEntry}/scorm`;
    const query = `?competency_id=${id.scormCompetency}`;
    const launch = (await request<Detail<ApiScormLaunch>>(`${base}/launch${query}`)).data;
    expect(launch).toMatchObject({
      content_entry_id: id.scormEntry,
      scorm_package_id: id.scormPackage,
      competency_id: id.scormCompetency,
      launch_url: SIMULATION_SCORM_LAUNCH,
    });
    const document = decodeURIComponent(launch.launch_url.split(',')[1]);
    expect(document).toContain("default-src 'none'");
    expect(document).not.toMatch(/https?:|<script|<iframe|<form|src=/);
    expect(
      (await request<Detail<ApiScormTrackingState>>(`${base}/tracking${query}`)).data.last_sequence,
    ).toBe(0);
    const commit = {
      competency_id: id.scormCompetency,
      commit_id: simulationId(990),
      sequence: 1,
      lesson_status: 'completed',
      score_raw: 100,
      session_time: 12,
      total_time: 12,
      cmi_data: { 'cmi.core.lesson_location': 'page-1', remote_url: 'https://remote.test/tracker' },
    };
    const first = await request<Detail<ApiScormTrackingState>>(`${base}/tracking`, 'PUT', commit);
    expect(first.data).toMatchObject({
      last_sequence: 1,
      total_time: 12,
      lesson_status: 'completed',
    });
    expect(first.data.cmi_data.remote_url).toBe('#simulation');
    expect(await request(`${base}/tracking`, 'PUT', commit)).toEqual(first);
    expect(await request(`${base}/tracking${query}`)).toEqual(first);
    expect(await request(`${base}/tracking/sequence${query}`)).toEqual({
      data: { last_sequence: 1 },
    });
    expect(
      (
        await request<Detail<ApiPortalLearningPathSummary>>(
          `enrollments/${id.scormEnrollment}/summary`,
        )
      ).data.progress.percent,
    ).toBe(100);
    expect(
      (await request<ApiMeEnrollmentsResponse>('me/enrollments')).data.find(
        (row) => row.id === id.scormEnrollment,
      )?.status,
    ).toBe('completed');
    await request(`${base}/tracking`, 'PUT', {
      ...commit,
      commit_id: simulationId(991),
      sequence: 2,
      total_time: 20,
    });
    expect(
      (await request<Detail<ApiScormTrackingState>>(`${base}/tracking`, 'PUT', commit)).data
        .total_time,
    ).toBe(20);
    await expect(request(`${base}/launch?competency_id=${id.competency}`)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      request(`${base}/tracking`, 'PUT', { ...commit, sequence: 3, total_time: -1 }),
    ).rejects.toMatchObject({ status: 422 });
    resetSimulationData(Role.TRAINEE);
    expect(
      (await request<Detail<ApiScormTrackingState>>(`${base}/tracking${query}`)).data.last_sequence,
    ).toBe(0);
  });

  it('enforces course-level module progression and updates evaluation access on every reread', async () => {
    const secondEntry = (
      await request(`platform/course-sections/${id.section}/entries`, 'POST', {
        content_type_id: id.contentType,
        data: { title: 'Deuxième contenu' },
        is_published: true,
      })
    ).data;
    const rule = (
      await request(`platform/learning-paths/${id.learningPath}/progression-rules`, 'POST', {
        source: { type: 'module', id: id.competency },
        condition: { type: 'module_completed', rule_type: 'any' },
        target_on_success: { type: 'evaluation', id: id.evaluation },
      })
    ).data;
    const read = async () =>
      (await request<Detail<ApiPortalLearningPathSummary>>(`enrollments/${id.enrollment}/summary`))
        .data;
    expect((await read()).final_evaluation?.accessible).toBe(false);
    await expect(
      request(`enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`, 'POST'),
    ).rejects.toMatchObject({ status: 403 });
    const complete = (entryId: string) =>
      request(
        `enrollments/${id.enrollment}/competencies/${id.competency}/courses/${id.course}/entries/${entryId}/complete`,
        'POST',
      );
    await complete(id.entry);
    // "any" means one whole course, not one entry of that course.
    expect((await read()).final_evaluation?.accessible).toBe(false);
    await complete(secondEntry.id);
    expect((await read()).final_evaluation?.accessible).toBe(true);
    await request(`platform/progression-rules/${rule.id}/deactivate`, 'PATCH');
    expect((await request(`platform/progression-rules/${rule.id}`)).data.is_active).toBe(false);
  });

  it('handles evaluation score/failure/exhaustion branches and deactivation without stale access', async () => {
    const target = (
      await request(`platform/learning-paths/${id.learningPath}/evaluations`, 'POST', {
        title: 'Révision démonstration',
        type: 'PARTIAL',
        question_bank_ids: [id.questionBank],
        question_count: 1,
      })
    ).data;
    // Use another module as a visible branch target.
    await request(`platform/learning-paths/${id.learningPath}/competencies`, 'POST', {
      competency_id: id.scormCompetency,
    });
    const rule = (
      await request(`platform/learning-paths/${id.learningPath}/progression-rules`, 'POST', {
        source: { type: 'evaluation', id: id.evaluation },
        condition: { type: 'evaluation_passed', min_score_percentage: 80 },
        target_on_success: { type: 'module', id: id.scormCompetency },
        target_on_failure: { type: 'evaluation', id: target.id },
        max_attempts: 2,
        target_on_exhausted: { type: 'module', id: id.scormCompetency },
      })
    ).data;
    const read = async () =>
      (await request<Detail<ApiPortalLearningPathSummary>>(`enrollments/${id.enrollment}/summary`))
        .data;
    expect(
      (await read()).modules.find((module) => module.id === id.scormCompetency)?.accessible,
    ).toBe(false);
    await expect(
      request(`enrollments/${id.enrollment}/evaluations/${target.id}/attempts`, 'POST'),
    ).rejects.toMatchObject({ status: 403 });
    for (let round = 0; round < 2; round++) {
      const attempt = (
        await request<Detail<ApiEvaluationAttempt>>(
          `enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`,
          'POST',
        )
      ).data;
      await request(
        `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`,
        'POST',
        { answer: false },
      );
      await request(`evaluation-attempts/${attempt.id}/submit`, 'POST');
      expect(
        (await read()).modules.find((module) => module.id === id.scormCompetency)?.accessible,
      ).toBe(round === 1);
      expect(
        (await read()).modules.find((module) => module.id === id.competency)?.evaluation
          ?.accessible,
      ).toBe(round === 0);
    }
    await expect(
      request(`enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`, 'POST'),
    ).rejects.toMatchObject({ status: 422 });
    const evaluations = await request<List>(`enrollments/${id.enrollment}/evaluations`);
    expect(evaluations.data.find((row) => row.id === id.evaluation)).toMatchObject({
      max_attempts: 2,
      attempts_remaining: 0,
    });
    await request(`platform/progression-rules/${rule.id}`, 'PATCH', {
      condition: { type: 'evaluation_completed' },
      target_on_success: { type: 'module', id: id.scormCompetency },
      target_on_failure: null,
      target_on_exhausted: null,
      max_attempts: null,
    });
    expect(
      (await read()).modules.find((module) => module.id === id.scormCompetency)?.accessible,
    ).toBe(true);
  });

  it('resolves uploaded media IDs for portal rendering and preserves profile photo rereads', async () => {
    const form = new FormData();
    form.append('file', new Blob(['not a real image']), 'demo.png');
    const uploaded = await handleSimulationRequest(`users/${id.learner}/profile-photo`, {
      method: 'POST',
      body: form,
    });
    const media = (uploaded.json as Detail).data;
    expect((await request(`users/${id.learner}`)).data.profile_photo).toEqual(media);
    const type = (
      await request('platform/content-types', 'POST', {
        title: 'Fichier démonstration',
        module_type: 'file',
        fields: [{ name: 'document', type: 'media', label: 'Document', required: true }],
      })
    ).data;
    const entry = (
      await request(`platform/course-sections/${id.section}/entries`, 'POST', {
        content_type_id: type.id,
        data: { document: media.id },
        is_published: true,
      })
    ).data;
    const portal = (
      await request(`enrollments/${id.enrollment}/courses/${id.course}/entries/${entry.id}`)
    ).data;
    expect(portal).toMatchObject({
      module_type: 'file',
      field_types: { document: 'media' },
      data: { document: { id: media.id, url: SIMULATION_IMAGE, mime_type: 'image/png' } },
    });
    expect((await request(`platform/entries/${entry.id}`)).data.data).toEqual({
      document: media.id,
    });
  });

  it('detaches SCORM packages and clears local tracking when their content is deleted', async () => {
    const base = `enrollments/${id.scormEnrollment}/courses/${id.scormCourse}/entries/${id.scormEntry}/scorm`;
    await request(`${base}/tracking`, 'PUT', {
      competency_id: id.scormCompetency,
      sequence: 1,
      commit_id: simulationId(900),
      lesson_status: 'completed',
    });
    await request(`platform/courses/${id.scormCourse}`, 'DELETE');
    expect(
      (await request<Detail<ApiScormPackage>>(`platform/scorm-packages/${id.scormPackage}`)).data
        .content_entry_id,
    ).toBeNull();
    await expect(
      request(`${base}/launch?competency_id=${id.scormCompetency}`),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('handles malformed requests, non-JSON uploads and cancellation locally', async () => {
    await expect(
      handleSimulationRequest('platform/courses', { method: 'POST', body: 'not json' }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(request('platform/courses', 'POST', {})).rejects.toMatchObject({ status: 422 });
    await expect(
      handleSimulationRequest('platform/media', { method: 'POST' }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(request('platform/courses', 'TRACE')).rejects.toMatchObject({ status: 501 });
    const controller = new AbortController();
    controller.abort();
    await expect(
      handleSimulationRequest('platform/courses', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('does not let returned objects mutate the fixture store', async () => {
    const course = (await request<Detail<ApiCourse>>(`platform/courses/${id.course}`)).data;
    course.full_name = 'Changed outside transport';
    const path = (
      await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.learningPath}`)
    ).data;
    path.competencies?.pop();
    expect(
      (await request<Detail<ApiCourse>>(`platform/courses/${id.course}`)).data.full_name,
    ).toContain('démonstration');
    expect(
      (await request<Detail<ApiLearningPath>>(`platform/learning-paths/${id.learningPath}`)).data
        .competencies,
    ).toHaveLength(1);
  });

  it('discards mutations, carts, orders, completion, attempts and shop data on reset/clear', async () => {
    const original = await request(`platform/courses/${id.course}`);
    await request(`platform/courses/${id.course}`, 'PATCH', {
      full_name: 'Modification démonstration',
    });
    await request('carts/items', 'POST', { learning_path_id: id.learningPath });
    await request('orders', 'POST', { payment_method: 'cash' });
    await request(
      `enrollments/${id.enrollment}/competencies/${id.competency}/courses/${id.course}/entries/${id.entry}/complete`,
      'POST',
    );
    await request(`enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`, 'POST');
    clearSimulationData();
    await expect(request('platform/courses')).rejects.toMatchObject({
      status: 409,
      message:
        'Les données de simulation ne sont plus disponibles. Rechargez la page puis réessayez.',
      json: { code: 'SIMULATION_INACTIVE' },
    });
    rememberShopData({ data: { id: 'ignored', price: 1, currency: 'EUR' } });
    resetSimulationData(Role.EDITOR);
    expect(await request(`platform/courses/${id.course}`)).toEqual(original);
    expect((await request<List>('orders')).data).toEqual([]);
    expect((await request<ApiCartResponse>('carts')).data.items).toEqual([]);
    expect(
      (await request<ApiMeEnrollmentsResponse>('me/enrollments')).data[0].progress_percent,
    ).toBe(0);
    expect(
      (await request<List>(`enrollments/${id.enrollment}/evaluations`)).data[0].attempts_used,
    ).toBe(0);
    await expect(
      request('carts/items', 'POST', { learning_path_id: 'ignored' }),
    ).rejects.toMatchObject({ status: 422 });
    resetSimulationData(Role.TRAINEE);
    expect((await request<List>('users')).data).toHaveLength(1);
  });

  it('publishes coverage and limitations instead of claiming unsupported features', () => {
    expect(SIMULATION_ROUTES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'platform/courses' }),
        expect.objectContaining({ path: 'carts/items' }),
        expect.objectContaining({ path: 'enrollments/:id/evaluations/:evaluationId/attempts' }),
      ]),
    );
    expect(SIMULATION_LIMITATIONS.join(' ')).toMatch(/Wallet[\s\S]*SCORM/);
  });
});
