import { Role } from '@/shared/constants/roles';
import { createTrainingSource, type TrainingReader } from '@/shared/simulation/training-source';
import type {
  ApiAttemptQuiz,
  EvaluationCompletionReason,
} from '@/shared/types/evaluation-attempt.types';
import type {
  ApiPortalEvalSummary,
  ApiPortalExecutionProjection,
  ApiPortalLearningPathSummary,
  ApiPortalSummaryModule,
  ApiProgressCounts,
} from '@/shared/types/portal.types';
import type { ApiExecutionSnapshot, ApiExecutionVisit } from '@/shared/types/progression.types';
import type { PaymentMethod } from '@/shared/types/order.types';
import type { ApiScormTrackingState } from '@/shared/api/portal-scorm.api';
import type { FormationDetail, FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import type {
  TwoFactorSettings,
  TwoFactorSettingsFields,
} from '@/modules/admin/resources/two-factor/types';
import type {
  ApiDashboardEnrollment,
  ApiDashboardFormation,
  ApiDashboardOverview,
} from '@/shared/types/dashboard.types';
import type {
  AttemptNodeStatus,
  EnrollmentAttemptCourse,
  EnrollmentAttemptNode,
  EnrollmentAttemptSummary,
} from '@/shared/types/enrollment-history.types';
import type {
  ApiClientDashboardStudent,
  ClientDashboardOverview,
} from '@/modules/portal/resources/dashboard/types';
import {
  createSimulationFixtures,
  newSimulationEntity,
  simulationId,
  SIMULATION_DATE,
  SIMULATION_IDS,
  SIMULATION_IMAGE,
  SIMULATION_COVER_IMAGE,
  SIMULATION_SCORM_LAUNCH,
  type ResourceName,
  type SimulationData,
  type SimulationEntity,
  type SimulationPurchase,
} from './fixtures';

export interface SimulationResponse {
  status: number;
  headers: Headers;
  body: string;
  json: unknown;
}

type JsonObject = Record<string, unknown>;
type SimulationAttempt = SimulationData['attempts'][number];
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RouteSpec = {
  resource: ResourceName;
  bare?: boolean;
  detailOnly?: boolean;
  methods?: readonly Method[];
};

/** Exact roots, not an open-ended proxy. Adding a business resource requires an explicit entry. */
const RESOURCE_ROUTES: Record<string, RouteSpec> = {
  'platform/learning-paths': { resource: 'learning-paths' },
  'platform/learning-path-categories': { resource: 'learning-path-categories' },
  'platform/courses': { resource: 'courses' },
  'platform/course-categories': { resource: 'course-categories' },
  'platform/entries': { resource: 'entries', detailOnly: true },
  'platform/competencies': { resource: 'competencies' },
  'platform/competency-categories': { resource: 'competency-categories' },
  'platform/question-banks': { resource: 'question-banks', bare: true },
  'platform/quizzes': { resource: 'quizzes', bare: true, detailOnly: true },
  'platform/evaluations': { resource: 'evaluations', detailOnly: true },
  'platform/progression-rules': { resource: 'progression-rules', detailOnly: true },
  'platform/users': { resource: 'users' },
  users: { resource: 'users' },
  groups: { resource: 'groups' },
  'platform/certificates': { resource: 'certificates' },
  certificates: { resource: 'certificates' },
  'platform/template-mails': { resource: 'template-mails' },
  'template-mails': { resource: 'template-mails' },
  'platform/content-types': { resource: 'content-types' },
  'platform/media': { resource: 'media', detailOnly: true, methods: ['GET', 'DELETE'] },
  'platform/tenants': { resource: 'tenants' },
};

/** Machine-readable coverage manifest. Paths are relative to /api/v1. */
export const SIMULATION_ROUTES = [
  ...Object.entries(RESOURCE_ROUTES).flatMap(([path, spec]) => [
    ...(!spec.detailOnly ? [{ methods: ['GET', 'POST'], path }] : []),
    { methods: spec.methods ?? ['GET', 'PATCH', 'PUT', 'DELETE'], path: `${path}/:id` },
  ]),
  { methods: ['GET', 'POST'], path: 'platform/courses/:courseId/sections' },
  { methods: ['GET', 'PATCH', 'PUT', 'DELETE'], path: 'platform/courses/:courseId/sections/:id' },
  { methods: ['POST'], path: 'platform/courses/:courseId/sections/reorder' },
  { methods: ['PATCH'], path: 'platform/courses/:courseId/sections/:id/visibility' },
  { methods: ['GET', 'POST'], path: 'platform/course-sections/:sectionId/entries' },
  { methods: ['POST'], path: 'platform/entries/:id/move' },
  { methods: ['GET'], path: 'platform/competencies/:id/overview' },
  { methods: ['POST'], path: 'platform/competencies/:id/duplicate' },
  { methods: ['GET'], path: 'platform/learning-path-competencies' },
  { methods: ['POST'], path: 'platform/learning-paths/:id/competencies' },
  { methods: ['PATCH', 'DELETE'], path: 'platform/learning-paths/:id/competencies/:competencyId' },
  { methods: ['POST', 'DELETE'], path: 'platform/learning-paths/:id/{mail-template,certificate}' },
  { methods: ['PATCH'], path: 'platform/learning-paths/:id/{mail-template,certificate}/location' },
  { methods: ['GET', 'POST'], path: 'platform/learning-paths/:id/{evaluations,progression-rules}' },
  { methods: ['GET'], path: 'platform/learning-paths/:id/evaluations/pool-check' },
  { methods: ['GET', 'POST'], path: 'platform/question-banks/:id/quizzes' },
  { methods: ['PATCH'], path: 'platform/{question-banks,progression-rules}/:id/deactivate' },
  { methods: ['POST'], path: '{platform/,}{certificates,template-mails}/:id/duplicate' },
  { methods: ['POST'], path: '{platform/,}certificates/:id/preview' },
  { methods: ['GET'], path: '{platform/,}template-variables' },
  { methods: ['GET'], path: 'platform/{field-types,media-mime-types}' },
  { methods: ['POST'], path: 'platform/{media,inline-media}' },
  {
    methods: ['POST'],
    path: 'platform/{learning-paths,competencies,certificates,template-mails}/media',
  },
  { methods: ['POST'], path: '{certificates,template-mails}/media' },
  { methods: ['POST'], path: '{platform/,}users/:id/profile-photo' },
  { methods: ['POST'], path: 'groups/:id/members' },
  { methods: ['DELETE'], path: 'groups/:id/members/:traineeId' },
  { methods: ['GET'], path: 'purchased-learning-paths' },
  { methods: ['GET'], path: 'purchased-learning-paths/:id/{learners,enrollments/history}' },
  { methods: ['GET', 'POST'], path: 'enrollments' },
  { methods: ['GET'], path: 'me/enrollments' },
  { methods: ['GET'], path: 'my-learning-paths' },
  { methods: ['GET'], path: 'enrollments/:id/{summary,evaluations}' },
  { methods: ['GET'], path: 'enrollments/:id/courses/:courseId/entries/:entryId' },
  {
    methods: ['POST'],
    path: 'enrollments/:id/competencies/:competencyId/courses/:courseId/entries/:entryId/complete',
  },
  {
    methods: ['PUT'],
    path: 'enrollments/:id/courses/:courseId/entries/:entryId/time-sessions/:sessionId',
  },
  { methods: ['POST'], path: 'enrollments/:id/evaluations/:evaluationId/attempts' },
  { methods: ['POST'], path: 'enrollments/:id/evaluations/:evaluationId/attempts/session' },
  { methods: ['GET'], path: 'evaluation-attempts/:id' },
  { methods: ['POST'], path: 'evaluation-attempts/:id/quizzes/:attemptQuizId/answer' },
  { methods: ['POST'], path: 'evaluation-attempts/:id/submit' },
  { methods: ['GET'], path: 'carts' },
  { methods: ['POST'], path: 'carts/items' },
  { methods: ['PATCH', 'DELETE'], path: 'carts/items/:id' },
  { methods: ['GET', 'POST'], path: 'orders' },
  { methods: ['GET'], path: 'orders/:id' },
  { methods: ['GET'], path: 'tenant/current' },
  { methods: ['GET', 'POST'], path: 'courses' },
  { methods: ['GET', 'PUT', 'DELETE'], path: 'courses/:id' },
  { methods: ['GET'], path: 'trainees' },
  { methods: ['GET'], path: 'trainees/:id' },
  { methods: ['GET'], path: '{admin/,}evaluation-notes/formations' },
  { methods: ['GET'], path: '{admin/,}evaluation-notes/formations/:id' },
  { methods: ['GET'], path: 'reports' },
  { methods: ['POST'], path: '{platform/,}auth/{forgot-password,reset-password}' },
  { methods: ['PATCH'], path: '{platform/,}users/:id/password' },
  { methods: ['POST'], path: '{platform/,}users/:id/reset-two-factor' },
  { methods: ['GET', 'PUT'], path: 'platform/two-factor-settings' },
  { methods: ['GET', 'PUT'], path: 'platform/tenants/:id/two-factor-settings' },
  { methods: ['GET'], path: 'platform/tenants/:id/template-mails' },
  { methods: ['POST'], path: 'platform/scorm-packages' },
  { methods: ['GET'], path: 'platform/scorm-packages/:id' },
  { methods: ['POST'], path: 'platform/entries/:id/scorm-package' },
  { methods: ['GET'], path: 'enrollments/:id/courses/:courseId/entries/:entryId/scorm/launch' },
  {
    methods: ['GET', 'PUT'],
    path: 'enrollments/:id/courses/:courseId/entries/:entryId/scorm/tracking',
  },
  {
    methods: ['GET'],
    path: 'enrollments/:id/courses/:courseId/entries/:entryId/scorm/tracking/sequence',
  },
  { methods: ['GET'], path: 'dashboard/client/overview' },
  { methods: ['GET'], path: 'dashboard/client/students' },
  { methods: ['GET'], path: 'platform/dashboard/overview' },
  { methods: ['GET'], path: 'platform/dashboard/formations' },
  { methods: ['GET'], path: 'platform/dashboard/formations/:id/enrollments' },
  { methods: ['GET'], path: '{platform/,}enrollments/:id/history' },
  { methods: ['GET'], path: '{platform/,}enrollments/:id/history/attempts/:attemptId' },
] as const;

export const SIMULATION_LIMITATIONS = [
  'Login/logout/session replacement, auth identity/challenges, role-simulation and impersonation remain forbidden; the session owner handles them. Password/reset/2FA settings are visual local success only; no secrets are retained or security changed.',
  'Shop transport belongs to the caller. rememberShopData retains public listing data (product IDs, names, prices, currencies, categories and authorized shop covers) for the local cart and purchases, never training content. A real product bought locally is listed as a purchase and can be assigned to learners, who cannot follow it: its content is never loaded.',
  'Wallet, invoices and the dashboard messaging dialog currently use direct frontend mocks/callbacks, not messaging API calls; those UI behaviors are outside this engine.',
  'Fictional SCORM stays inert. Authorized Client/Editor trainee training previews launch the actual package through dedicated signed GETs, with a disposable no-I/O SCORM adapter and no tracking, time or completion writes. Package scripts follow the existing SCORM trust/CSP model; third-party telemetry is not prevented.',
  'Uploads return an inert inline placeholder, not the uploaded file. Template preview never executes HTML or sends email.',
  'Progression recomputes course-level all/any, evaluation completion/score and failure/exhaustion branches from current local completions/latest attempts. Evaluation deadlines use the local clock and finalize on attempt requests only, not a background scheduler. Visits remain synthetic, without full backend rounds/replay or certificate issuance. Quiz scoring is exact-match, not weighted. Reports are fictional summaries only.',
  'No payments, mail delivery, DNS changes, browser persistence or network fallback exist. Authorized training definitions/media are read-only exceptions for Client/Editor trainee previews; enrollments and results stay local.',
] as const;

let state: SimulationData | null = null;
let training: { key: string; source: ReturnType<typeof createTrainingSource> } | null = null;
// Stable, synthetic visit IDs belong to this in-memory data set, never to real enrollments.
const executionIds = new WeakMap<SimulationData, Map<string, string>>();
// Data sets modified by a local write; a fresh data set (reset/clear) starts unchanged.
const changedData = new WeakSet<SimulationData>();

export function resetSimulationData(role: Role): void {
  if (!Object.values(Role).includes(role)) throw new Error('Invalid simulation role');
  training = null;
  state = createSimulationFixtures(role);
}

/** True once the user has changed the demo data: reloading the page would discard it. */
export function hasSimulationChanges(): boolean {
  return state !== null && changedData.has(state);
}

/** The session owner must check local readiness after server confirmation, not just the UI role. */
export function hasSimulationData(role: Role): boolean {
  return state?.role === role;
}

export function clearSimulationData(): void {
  training = null;
  state = null;
}

/** Called only after the server has confirmed the real actor's simulation context. */
export function configureSimulationTraining(key: string | null, read: TrainingReader): void {
  if (key === null) {
    training = null;
    return;
  }
  if (training?.key === key) return;
  if (!state || state.role !== Role.TRAINEE) return;
  if (training) resetSimulationData(Role.TRAINEE);
  const data = state!;
  const context: NonNullable<typeof training> = {
    key,
    source: createTrainingSource(data, read, () => state === data && training === context),
  };
  training = context;
}

const object = (value: unknown): JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};
const objects = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.map(object) : []);
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const number = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const nextId = (data: SimulationData): string => simulationId(data.sequence++);

const shortText = (value: unknown, max: number): string | null => {
  const trimmed = text(value).trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
};

/**
 * Never imports the public shop object into any business fixture graph. Only
 * its public listing data (price, name, category, authorized cover) is kept,
 * so a product bought in the simulated checkout can be displayed as a local
 * purchase; its training content is never fetched nor stored.
 */
export function rememberShopData(json: unknown, url = ''): void {
  if (!state) return;
  const payload = object(json).data ?? json;
  const rows = Array.isArray(payload) ? payload : [payload];
  if (/\/shop\/learning-path-categories(?:\?|$)/.test(url)) {
    for (const candidate of rows) {
      const category = object(candidate);
      const name = shortText(category.name, 255);
      if (typeof category.id === 'string' && category.id.length <= 100 && name) {
        state.shopCategories.set(category.id, name);
      }
    }
    return;
  }
  for (const candidate of rows) {
    const product = object(candidate);
    const price = typeof product.price === 'string' ? Number(product.price) : product.price;
    if (
      typeof product.id === 'string' &&
      product.id.length <= 100 &&
      typeof price === 'number' &&
      Number.isFinite(price) &&
      price >= 0 &&
      typeof product.currency === 'string' &&
      /^[A-Z]{3}$/.test(product.currency)
    ) {
      const cover = object(product.image).url;
      // Only the dedicated, same-origin, per-product endpoint may load a real cover.
      const expectedCover = `/api/v1/role-simulation/shop/learning-paths/${product.id}/image`;
      const image =
        /^[a-zA-Z0-9-]+$/.test(product.id) && cover === expectedCover
          ? expectedCover
          : SIMULATION_COVER_IMAGE;
      const categoryId =
        typeof product.category_id === 'string' && product.category_id.length <= 100
          ? product.category_id
          : null;
      state.shopPrices.set(product.id, {
        price,
        currency: product.currency,
        image,
        name: shortText(product.name, 255) ?? undefined,
        category_id: categoryId,
      });
      // A list/detail refresh may change the cover of an already selected product.
      state.cart.items
        .filter((item) => item.learning_path_id === product.id)
        .forEach((item) => {
          item.image = image;
        });
    }
  }
}

function response(json: unknown, status = 200): SimulationResponse {
  const body = status === 204 ? '' : JSON.stringify(json);
  return {
    status,
    headers: new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Learneo-Simulation': 'true',
    }),
    body,
    // Callers must not obtain mutable references to our state.
    json: status === 204 ? null : (JSON.parse(body) as unknown),
  };
}

function fail(status: number, message: string, code = 'SIMULATION_ERROR'): never {
  throw Object.assign(new Error(message), response({ message, code, simulation: true }, status));
}
function unsupported(method: string, path: string): never {
  return fail(
    501,
    `Simulation locale : route non prise en charge (${method} /${path}). Aucun appel réseau effectué.`,
    'SIMULATION_ROUTE_UNSUPPORTED',
  );
}
function invalid(message: string): never {
  return fail(422, `Simulation : ${message}`, 'SIMULATION_VALIDATION');
}
function find(data: SimulationData, resource: ResourceName, id: string): SimulationEntity {
  return (
    data.resources[resource].find((row) => row.id === id) ??
    fail(404, `Simulation : ${resource}/${id} introuvable.`, 'SIMULATION_NOT_FOUND')
  );
}

function readBody(body: RequestInit['body']): JsonObject {
  if (body == null || body === '') return {};
  if (typeof body !== 'string') invalid('Un objet JSON est attendu sur cette route.');
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    invalid('JSON invalide.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('Le corps doit être un objet JSON.');
  return value as JsonObject;
}

/** Reject executable/remote asset values when storing user-edited content too. */
function safeValue(value: unknown, field = ''): unknown {
  if (typeof value === 'string') {
    if (
      /(?:^|_)(?:url|src|href|poster)$/.test(field) ||
      /^\s*(?:https?:|\/\/|javascript:|blob:|data:)/i.test(value)
    ) {
      return value === SIMULATION_IMAGE || value === SIMULATION_COVER_IMAGE ? value : '#simulation';
    }
    const inert = value
      .replace(/(?:src|srcset|href|poster)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/<\/?(?:script|iframe|object|embed|link|style)\b[^>]*>/gi, '')
      .replace(/\s(?:on\w+|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // Escape all markup, then restore only a small set of attribute-free inert tags.
    // This is intentionally not a general HTML sanitizer or a file preview facility.
    return inert
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /&lt;(\/?)(p|br|h[1-6]|strong|em|b|i|u|s|ul|ol|li|blockquote|pre|code)\s*\/?&gt;/gi,
        '<$1$2>',
      );
  }
  if (Array.isArray(value)) return value.map((item) => safeValue(item, field));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(object(value))
        .filter(([key]) => !['__proto__', 'prototype', 'constructor'].includes(key))
        .map(([key, item]) => [key, safeValue(item, key)]),
    );
  return value;
}

const FIELDS: Record<ResourceName, readonly string[]> = {
  'learning-paths': [
    'name',
    'description',
    'category_id',
    'price',
    'currency',
    'image',
    'published_at',
    'show_in_shop',
    'duration',
    'validity',
    'competency_ids',
  ],
  'learning-path-categories': ['name', 'description'],
  courses: ['full_name', 'short_name', 'category_id', 'visibility', 'description'],
  'course-categories': ['name', 'description', 'parent_id'],
  sections: ['name', 'is_hidden'],
  entries: ['content_type_id', 'data', 'is_published'],
  competencies: ['shortname', 'description', 'category_id', 'course_ids'],
  'competency-categories': ['name', 'description', 'parent_id'],
  'question-banks': ['title', 'description', 'learning_path_ids'],
  quizzes: [
    'type',
    'question',
    'comment_if_correct',
    'comment_if_incorrect',
    'competency_id',
    'options',
    'correct_answer',
    'pairs',
  ],
  evaluations: [
    'title',
    'type',
    'question_bank_ids',
    'question_count',
    'time_limit_minutes',
    'max_attempts',
    'location_x',
    'location_y',
    'is_published',
  ],
  'progression-rules': [
    'source',
    'condition',
    'target_on_success',
    'target_on_failure',
    'max_attempts',
    'target_on_exhausted',
  ],
  users: [
    'first_name',
    'last_name',
    'email',
    'role',
    'is_active',
    'address',
    'zip_code',
    'city',
    'country',
    'timezone',
    'preferred_language',
    'profile_photo_media_id',
  ],
  groups: ['name'],
  certificates: ['name', 'status', 'setasdefault', 'body'],
  'template-mails': ['name', 'subject', 'status', 'body'],
  'content-types': ['module_type', 'title', 'description', 'fields'],
  media: [],
  tenants: ['name', 'slug', 'status', 'is_active', 'branding', 'features'],
};

function updateEntity(
  data: SimulationData,
  resource: ResourceName,
  row: SimulationEntity,
  payload: JsonObject,
): SimulationEntity {
  const patch = Object.fromEntries(
    FIELDS[resource].filter((key) => key in payload).map((key) => [key, safeValue(payload[key])]),
  );
  const result: SimulationEntity = { ...row, ...patch, updated_at: SIMULATION_DATE };
  for (const key of ['course_ids', 'competency_ids', 'learning_path_ids', 'question_bank_ids']) {
    if (
      key in patch &&
      (!Array.isArray(patch[key]) ||
        strings(patch[key]).length !== (patch[key] as unknown[]).length)
    ) {
      invalid(`${key} doit être une liste d’identifiants.`);
    }
  }
  for (const key of ['name', 'title', 'full_name', 'short_name', 'shortname', 'question']) {
    if (key in patch && !text(patch[key]).trim()) invalid(`${key} est requis.`);
  }
  for (const key of ['is_active', 'is_hidden', 'is_published', 'show_in_shop', 'setasdefault']) {
    if (key in patch && typeof patch[key] !== 'boolean') invalid(`${key} doit être un booléen.`);
  }
  if (
    'price' in patch &&
    patch.price !== null &&
    (typeof patch.price !== 'number' || number(patch.price, -1) < 0)
  ) {
    invalid('Le prix doit être un nombre positif ou nul.');
  }
  if (resource === 'users') {
    if (!Object.values(Role).includes(result.role as Role)) invalid('Rôle inconnu.');
    result.full_name = `${text(result.first_name)} ${text(result.last_name)}`.trim();
    if ('profile_photo_media_id' in patch)
      result.profile_photo = patch.profile_photo_media_id
        ? find(data, 'media', text(patch.profile_photo_media_id))
        : null;
    delete result.profile_photo_media_id;
  }
  if (resource === 'learning-paths') {
    if ('competency_ids' in patch) {
      result.competencies = strings(patch.competency_ids).map((id, position) => {
        find(data, 'competencies', id);
        return { competency_id: id, position, location_x: null, location_y: null };
      });
      delete result.competency_ids;
    }
    if ('image' in patch)
      result.image = patch.image ? find(data, 'media', text(patch.image)) : null;
    result.is_published = Boolean(result.published_at);
    result.is_sellable = result.is_published && result.show_in_shop === true;
  }
  if (resource === 'competencies')
    strings(result.course_ids).forEach((id) => find(data, 'courses', id));
  if (resource === 'question-banks')
    strings(result.learning_path_ids).forEach((id) => find(data, 'learning-paths', id));
  if (resource === 'evaluations') {
    strings(result.question_bank_ids).forEach((id) => find(data, 'question-banks', id));
    if (!['FINAL', 'PARTIAL'].includes(text(result.type))) invalid('Type d’évaluation inconnu.');
    if (!Number.isInteger(result.question_count) || number(result.question_count) < 1)
      invalid('question_count doit être positif.');
    if (
      result.time_limit_minutes != null &&
      (!Number.isInteger(result.time_limit_minutes) ||
        number(result.time_limit_minutes) < 1 ||
        number(result.time_limit_minutes) > 2147483647)
    )
      invalid('time_limit_minutes doit être un entier positif ou null.');
    result.time_limit_minutes ??= null;
    if (
      result.max_attempts !== null &&
      (!Number.isInteger(result.max_attempts) || number(result.max_attempts) < 1)
    )
      invalid('max_attempts doit être positif.');
  }
  if (resource === 'entries') {
    const type = find(data, 'content-types', text(result.content_type_id));
    if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data))
      invalid('data doit être un objet.');
    // The editor saves field data immediately after attaching a package; preserve the server-owned link.
    if (type.module_type === 'scorm') {
      const attached = data.scormPackages.find((pkg) => pkg.content_entry_id === row.id);
      const fields = { ...object(result.data) };
      delete fields.scorm_package_id;
      result.data = { ...fields, ...(attached ? { scorm_package_id: attached.id } : {}) };
    }
    result.content_type_version = type.version;
  }
  if (resource === 'progression-rules') {
    const path = find(data, 'learning-paths', text(result.learning_path_id));
    const validateNode = (value: unknown) => {
      const node = object(value);
      if (
        node.type === 'module' &&
        objects(path.competencies).some((link) => link.competency_id === node.id)
      )
        return;
      if (
        node.type === 'evaluation' &&
        data.resources.evaluations.some(
          (evaluation) => evaluation.id === node.id && evaluation.learning_path_id === path.id,
        )
      )
        return;
      if (node.type === 'certificate' && object(path.certificate).id === node.id && node.id) return;
      invalid('Le nœud doit appartenir à ce parcours.');
    };
    validateNode(result.source);
    validateNode(result.target_on_success);
    if (result.target_on_failure !== null) validateNode(result.target_on_failure);
    if (result.target_on_exhausted !== null) validateNode(result.target_on_exhausted);
    const condition = object(result.condition);
    if (object(result.source).type === 'module') {
      if (
        condition.type !== 'module_completed' ||
        !['all', 'any'].includes(text(condition.rule_type))
      )
        invalid('Condition de module invalide.');
    } else if (object(result.source).type === 'evaluation') {
      if (!['evaluation_completed', 'evaluation_passed'].includes(text(condition.type)))
        invalid('Condition d’évaluation invalide.');
      if (
        condition.type === 'evaluation_passed' &&
        (typeof condition.min_score_percentage !== 'number' ||
          number(condition.min_score_percentage, -1) < 0 ||
          number(condition.min_score_percentage) > 100)
      )
        invalid('Seuil invalide.');
    } else invalid('La source doit être un module ou une évaluation.');
    if (
      result.max_attempts !== null &&
      (!Number.isInteger(result.max_attempts) || number(result.max_attempts) < 1)
    )
      invalid('max_attempts doit être positif.');
  }
  if (resource === 'quizzes') {
    if (!['true_false', 'single_choice', 'multiple_choice', 'matching'].includes(text(result.type)))
      invalid('Type de question inconnu.');
    if (result.competency_id) find(data, 'competencies', text(result.competency_id));
    if (result.type === 'single_choice' || result.type === 'multiple_choice') {
      if (objects(result.options).length < 2) invalid('Deux options au minimum sont requises.');
      const correct = objects(result.options).filter((option) => option.is_correct === true).length;
      if (!correct || (result.type === 'single_choice' && correct !== 1))
        invalid('Le nombre de bonnes réponses est invalide.');
      result.options = objects(result.options).map((option) => ({
        ...option,
        id: text(option.id) || nextId(data),
      }));
    }
    if (result.type === 'true_false' && typeof result.correct_answer !== 'boolean')
      invalid('Une réponse booléenne est requise.');
    if (result.type === 'matching' && objects(result.pairs).length === 0)
      invalid('Des paires sont requises.');
  }
  if (resource === 'content-types') {
    if (!['page', 'file', 'folder', 'url', 'media', 'scorm'].includes(text(result.module_type)))
      invalid('module_type inconnu.');
    if (!Array.isArray(result.fields)) invalid('fields doit être une liste.');
    result.fields = objects(result.fields).map((field) => {
      const id = text(field.field_id) || text(field.id) || nextId(data);
      return {
        required: false,
        is_archived: false,
        accept: [],
        max_size_mb: null,
        multiple: false,
        ...field,
        id,
        field_id: id,
      };
    });
    if ('fields' in patch)
      result.version =
        number(row.version, 1) +
        (data.resources['content-types'].some((item) => item.id === row.id) ? 1 : 0);
  }
  if (result.category_id) {
    const categoryResource =
      resource === 'learning-paths'
        ? 'learning-path-categories'
        : resource === 'competencies'
          ? 'competency-categories'
          : 'course-categories';
    result.category_name = find(data, categoryResource, text(result.category_id)).name;
  }
  return result;
}

function pool(data: SimulationData, evaluation: JsonObject): SimulationEntity[] {
  return data.resources.quizzes.filter((quiz) =>
    strings(evaluation.question_bank_ids).includes(text(quiz.question_bank_id)),
  );
}

function decorate(
  data: SimulationData,
  resource: ResourceName,
  row: SimulationEntity,
): SimulationEntity {
  if (['learning-paths', 'courses', 'competencies'].includes(resource)) {
    const categories =
      resource === 'learning-paths'
        ? 'learning-path-categories'
        : resource === 'competencies'
          ? 'competency-categories'
          : 'course-categories';
    row = {
      ...row,
      category_name:
        data.resources[categories].find((category) => category.id === row.category_id)?.name ??
        null,
    };
  }
  if (resource === 'learning-paths') {
    const linkedTemplate = (field: string, resource: 'certificates' | 'template-mails') => {
      const link = object(row[field]);
      const template = data.resources[resource].find((item) => item.id === link.id);
      return template ? { ...link, name: template.name } : null;
    };
    return {
      ...row,
      competencies_count: objects(row.competencies).length,
      certificate: linkedTemplate('certificate', 'certificates'),
      mail_template: linkedTemplate('mail_template', 'template-mails'),
      evaluations: data.resources.evaluations.filter(
        (evaluation) => evaluation.learning_path_id === row.id,
      ),
    };
  }
  if (resource === 'competencies') {
    const courses = strings(row.course_ids).flatMap((id, position) => {
      const course = data.resources.courses.find((item) => item.id === id);
      return course
        ? [
            {
              course_id: id,
              position,
              full_name: course.full_name,
              category_name: course.category_name ?? null,
            },
          ]
        : [];
    });
    return { ...row, courses, courses_count: courses.length };
  }
  if (resource === 'evaluations') {
    const count = pool(data, row).length;
    return { ...row, pool_size: count, pool_insufficient: count < number(row.question_count) };
  }
  return row;
}

function listResponse(rows: readonly JsonObject[], params: URLSearchParams): SimulationResponse {
  let filtered = [...rows];
  const q = params.get('q')?.toLocaleLowerCase();
  if (q)
    filtered = filtered.filter((row) =>
      [
        row.name,
        row.title,
        row.full_name,
        row.shortname,
        row.question,
        row.email,
        row.first_name,
        row.last_name,
        object(row.learning_path).name,
      ].some((value) => text(value).toLocaleLowerCase().includes(q)),
    );
  const filters: Record<string, string> = {
    ids: 'id',
    category_ids: 'category_id',
    category_id: 'category_id',
    roles: 'role',
    types: 'type',
    competency_ids: 'competency_id',
    competency_id: 'competency_id',
    tenant_id: 'tenant_id',
  };
  for (const [param, field] of Object.entries(filters)) {
    const value = params.get(param);
    if (value)
      filtered = filtered.filter((row) =>
        value.split(',').includes(text(row[field] ?? object(row.learning_path)[field])),
      );
  }
  const active = params.get('is_active');
  if (active !== null)
    filtered = filtered.filter((row) => Boolean(row.is_active) === ['true', '1'].includes(active));
  const status = params.get('status');
  if (status)
    filtered = filtered.filter((row) =>
      typeof row.status === 'boolean'
        ? row.status === (status === 'active')
        : row.status === status,
    );
  const learningPath = params.get('learning_path_id');
  if (learningPath)
    filtered = filtered.filter(
      (row) =>
        strings(row.learning_path_ids).includes(learningPath) ||
        row.learning_path_id === learningPath,
    );
  const sort = params.get('sort_by');
  if (sort)
    filtered.sort((a, b) => {
      const left = a[sort] ?? (sort === 'title' ? object(a.learning_path).name : undefined);
      const right = b[sort] ?? (sort === 'title' ? object(b.learning_path).name : undefined);
      const direction = (params.get('sort_dir') ?? params.get('sort_order')) === 'desc' ? -1 : 1;
      return (
        direction *
        (typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left ?? '').localeCompare(String(right ?? ''), 'fr'))
      );
    });
  const perPage = Math.min(
    1000,
    Math.max(
      1,
      Number(params.get('per_page') ?? params.get('page_size') ?? params.get('limit') ?? 25) || 25,
    ),
  );
  // User/template data tables send zero-based page with page_size. Laravel uses one-based per_page.
  const rawPage = Number(params.get('page') ?? (params.has('page_size') ? 0 : 1)) || 0;
  const page = Math.max(1, Math.floor(rawPage + (params.has('page_size') ? 1 : 0)));
  return response({
    data: filtered.slice((page - 1) * perPage, page * perPage),
    total: filtered.length,
    meta: {
      total: filtered.length,
      page,
      current_page: page,
      per_page: perPage,
      last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
      competency_ids: [...new Set(filtered.map((row) => row.competency_id).filter(Boolean))],
    },
  });
}

/** Remove children/references as well as the row so subsequent reads remain coherent. */
function removeEntity(data: SimulationData, resource: ResourceName, id: string): void {
  data.resources[resource] = data.resources[resource].filter((row) => row.id !== id);
  if (resource.endsWith('-categories')) {
    const related =
      resource === 'learning-path-categories'
        ? 'learning-paths'
        : resource === 'competency-categories'
          ? 'competencies'
          : 'courses';
    data.resources[related].forEach((row) => {
      if (row.category_id === id) {
        row.category_id = null;
        row.category_name = null;
      }
    });
  }
  if (resource === 'courses') {
    data.resources.sections
      .filter((row) => row.course_id === id)
      .forEach((row) => removeEntity(data, 'sections', row.id));
    data.resources.competencies.forEach((row) => {
      row.course_ids = strings(row.course_ids).filter((value) => value !== id);
    });
  }
  if (resource === 'sections')
    data.resources.entries
      .filter((row) => row.course_section_id === id)
      .forEach((row) => removeEntity(data, 'entries', row.id));
  if (resource === 'entries') {
    data.scormPackages
      .filter((pkg) => pkg.content_entry_id === id)
      .forEach((pkg) => {
        pkg.content_entry_id = null;
      });
    for (const key of data.scormTracking.keys())
      if (key.endsWith(`:${id}`)) data.scormTracking.delete(key);
    for (const key of data.completedEntries)
      if (key.endsWith(`:${id}`)) data.completedEntries.delete(key);
  }
  if (resource === 'competencies')
    data.resources['learning-paths'].forEach((row) => {
      row.competencies = objects(row.competencies).filter((item) => item.competency_id !== id);
    });
  if (resource === 'question-banks')
    data.resources.quizzes = data.resources.quizzes.filter((row) => row.question_bank_id !== id);
  if (resource === 'competencies' || resource === 'evaluations' || resource === 'certificates') {
    data.resources['progression-rules'] = data.resources['progression-rules'].filter(
      (rule) =>
        ![
          rule.source,
          rule.target_on_success,
          rule.target_on_failure,
          rule.target_on_exhausted,
        ].some((node) => object(node).id === id),
    );
  }
  if (resource === 'evaluations')
    data.attempts = data.attempts.filter((attempt) => attempt.evaluation_id !== id);
  if (resource === 'users') {
    data.resources.groups.forEach((row) => {
      row.members = objects(row.members).filter((member) => member.trainee_id !== id);
    });
    data.enrollments = data.enrollments.filter((row) => row.learner_id !== id);
  }
  if (resource === 'learning-paths') {
    data.enrollments = data.enrollments.filter((row) => row.learning_path_id !== id);
    data.purchases = data.purchases.filter((row) => row.learning_path_id !== id);
    data.resources.evaluations = data.resources.evaluations.filter(
      (row) => row.learning_path_id !== id,
    );
    data.resources['progression-rules'] = data.resources['progression-rules'].filter(
      (row) => row.learning_path_id !== id,
    );
  }
  if (resource === 'certificates' || resource === 'template-mails') {
    const field = resource === 'certificates' ? 'certificate' : 'mail_template';
    data.resources['learning-paths'].forEach((row) => {
      if (object(row[field]).id === id) row[field] = null;
    });
  }
}

function crud(
  data: SimulationData,
  spec: RouteSpec,
  id: string | undefined,
  method: Method,
  payload: JsonObject,
  params: URLSearchParams,
  scope: JsonObject = {},
): SimulationResponse {
  const { resource, bare } = spec;
  if (spec.methods && !spec.methods.includes(method)) return unsupported(method, resource);
  const scoped = (row: SimulationEntity) =>
    Object.entries(scope).every(([key, value]) => row[key] === value);
  const wrap = (row: SimulationEntity, status = 200) =>
    response(
      bare ? decorate(data, resource, row) : { data: decorate(data, resource, row) },
      status,
    );
  if (!id && method === 'GET') {
    const rows = data.resources[resource]
      .filter(scoped)
      .map((row) => decorate(data, resource, row));
    if (resource === 'sections' || resource === 'entries')
      rows.sort((a, b) => number(a.rank) - number(b.rank));
    return listResponse(rows, params);
  }
  if (!id && method === 'POST') {
    const required: Partial<Record<ResourceName, string[]>> = {
      'learning-paths': ['name'],
      courses: ['full_name', 'short_name'],
      sections: ['name'],
      entries: ['content_type_id', 'data'],
      competencies: ['shortname'],
      quizzes: ['type', 'question'],
      'question-banks': ['title'],
      evaluations: ['title', 'type', 'question_bank_ids'],
      users: ['first_name', 'last_name', 'email'],
      groups: ['name'],
      certificates: ['name', 'body'],
      'template-mails': ['name', 'subject', 'body'],
      'content-types': ['title', 'module_type', 'fields'],
      'progression-rules': ['source', 'condition', 'target_on_success'],
    };
    for (const field of required[resource] ?? ['name']) {
      if (!(field in payload) || payload[field] === null || payload[field] === '')
        invalid(`${field} est requis.`);
    }
    const row = updateEntity(
      data,
      resource,
      {
        ...newSimulationEntity(resource, nextId(data)),
        ...scope,
        ...(resource === 'sections' || resource === 'entries'
          ? { rank: data.resources[resource].filter(scoped).length }
          : {}),
      },
      payload,
    );
    if (resource === 'evaluations') {
      const path = find(data, 'learning-paths', text(row.learning_path_id));
      row.position =
        Math.max(
          -1,
          ...data.resources.evaluations.filter(scoped).map((item) => number(item.position)),
        ) + 1;
      row.preceding_competency_id =
        row.type === 'PARTIAL'
          ? (objects(path.competencies)
              .sort((a, b) => number(a.position) - number(b.position))
              .at(-1)?.competency_id ?? null)
          : null;
    }
    if (resource === 'entries' && payload.scorm_package_id)
      attachScorm(data, row, text(payload.scorm_package_id));
    data.resources[resource].push(row);
    return wrap(row, 201);
  }
  if (!id) unsupported(method, resource);
  const row = find(data, resource, id);
  if (!scoped(row)) fail(404, 'Simulation : ressource absente de ce parent.');
  if (method === 'GET') return wrap(row);
  if (method === 'PATCH' || method === 'PUT') {
    const updated = updateEntity(data, resource, row, payload);
    data.resources[resource][data.resources[resource].indexOf(row)] = updated;
    return wrap(updated);
  }
  if (method === 'DELETE') {
    if (
      resource === 'content-types' &&
      data.resources.entries.some((entry) => entry.content_type_id === id)
    ) {
      fail(409, 'Simulation : ce type est utilisé par un contenu.');
    }
    removeEntity(data, resource, id);
    return response(null, 204);
  }
  return unsupported(method, resource);
}

function upload(data: SimulationData, body: RequestInit['body']): SimulationResponse {
  if (typeof FormData === 'undefined' || !(body instanceof FormData))
    invalid('Un formulaire multipart est attendu.');
  const file = body.get('file');
  if (!file || typeof file === 'string') invalid('Le fichier est requis.');
  const media = {
    ...newSimulationEntity('media', nextId(data)),
    original_name: file.name || 'fichier-demonstration',
    size_bytes: file.size,
  };
  data.resources.media.push(media);
  return response({ data: media }, 201);
}

function progress(completed: number, total: number): ApiProgressCounts {
  return { completed, total, percent: total ? Math.round((completed * 100) / total) : 0 };
}

function enrollment(data: SimulationData, id: string) {
  return (
    data.enrollments.find((row) => row.id === id) ??
    fail(404, 'Simulation : inscription introuvable.')
  );
}

function simulationExecutionId(
  data: SimulationData,
  enrollmentId: string,
  type: 'module' | 'evaluation',
  nodeId: string,
): string {
  let ids = executionIds.get(data);
  if (!ids) {
    ids = new Map();
    executionIds.set(data, ids);
  }
  const key = `${enrollmentId}:${type}:${nodeId}`;
  let id = ids.get(key);
  if (!id) {
    id = nextId(data);
    ids.set(key, id);
  }
  return id;
}

/** Project the local engine into the player's execution contract, not a real server visit. */
function simulationNode(
  data: SimulationData,
  enrollmentId: string,
  type: 'module' | 'evaluation',
  nodeId: string,
  counts: ApiProgressCounts,
): ApiPortalExecutionProjection {
  const completed = counts.total > 0 && counts.completed === counts.total;
  const visit: ApiExecutionVisit = {
    id: simulationExecutionId(data, enrollmentId, type, nodeId),
    node_type: type,
    node_id: nodeId,
    visit_number: 1,
    // The local engine starts accessible nodes immediately; no real /start request is needed.
    status: completed ? 'completed' : 'in_progress',
    validation_round_id: null,
    score: null,
    result: null,
    available_at: SIMULATION_DATE,
    started_at: SIMULATION_DATE,
    completed_at: completed ? SIMULATION_DATE : null,
  };
  return {
    type,
    max_attempts: null,
    current: !completed,
    actionable: !completed,
    readable: true,
    required_to_repeat: false,
    historical_completed: completed,
    current_score: null,
    current_result: null,
    current_execution: visit,
    round: null,
    rounds: [],
    history: [visit],
    next_action: completed ? null : type === 'module' ? 'complete_content' : 'start_evaluation',
  };
}

function summary(data: SimulationData, enrollmentId: string): ApiPortalLearningPathSummary {
  const registration = enrollment(data, enrollmentId);
  const path = find(data, 'learning-paths', registration.learning_path_id);
  const completed = (competencyId: string, entryId: string) =>
    data.completedEntries.has(`${enrollmentId}:${competencyId}:${entryId}`);
  const evaluationSummary = (evaluation: SimulationEntity): ApiPortalEvalSummary => {
    const attempts = data.attempts.filter(
      (attempt) =>
        attempt.enrollment_id === enrollmentId && attempt.evaluation_id === evaluation.id,
    );
    const last = attempts.filter((attempt) => attempt.status === 'completed').at(-1);
    const counts = progress(last ? 1 : 0, 1);
    const rule = data.resources['progression-rules'].find(
      (row) =>
        row.learning_path_id === path.id &&
        row.is_active &&
        object(row.source).type === 'evaluation' &&
        object(row.source).id === evaluation.id,
    );
    const condition = object(rule?.condition);
    const maxAttempts = attemptLimit(data, evaluation);
    const threshold = number(condition.min_score_percentage, 70);
    const projection = simulationNode(data, enrollmentId, 'evaluation', evaluation.id, counts);
    return {
      ...projection,
      id: evaluation.id,
      title: text(evaluation.title),
      time_limit_minutes: evaluationTimeLimit(evaluation),
      evaluation_type: evaluation.type === 'PARTIAL' ? 'PARTIAL' : 'FINAL',
      accessible: true,
      completed: !!last,
      score: last?.score ?? null,
      current_score: last?.score ?? null,
      current_result: last ? (number(last.score) >= threshold ? 'passed' : 'failed') : null,
      max_attempts: maxAttempts,
      condition: {
        type:
          condition.type === 'evaluation_completed' ? 'evaluation_completed' : 'evaluation_passed',
        min_score_percentage: threshold,
      },
      progress: counts,
      coverage: counts,
    };
  };
  const modules: ApiPortalSummaryModule[] = objects(path.competencies).flatMap((link) => {
    const competency = data.resources.competencies.find((row) => row.id === link.competency_id);
    if (!competency) return [];
    const courses = strings(competency.course_ids)
      .flatMap((courseId) => {
        const course = data.resources.courses.find((row) => row.id === courseId);
        if (!course) return [];
        return [
          {
            id: course.id,
            name: text(course.full_name),
            sections: data.resources.sections
              .filter((section) => section.course_id === courseId && !section.is_hidden)
              .sort((a, b) => number(a.rank) - number(b.rank))
              .map((section) => {
                const entries = data.resources.entries
                  .filter((entry) => entry.course_section_id === section.id && entry.is_published)
                  .sort((a, b) => number(a.rank) - number(b.rank))
                  .map((entry) => ({
                    id: entry.id,
                    title: text(object(entry.data).title) || 'Contenu démonstration',
                    completed: completed(competency.id, entry.id),
                    historical_completed: completed(competency.id, entry.id),
                    ...(training?.source.isReadOnlyScorm(entry.id) ? { read_only: true } : {}),
                  }));
                const counts = progress(
                  entries.filter((entry) => entry.completed).length,
                  entries.length,
                );
                return {
                  id: section.id,
                  name: text(section.name),
                  frozen: false,
                  content_entries: entries,
                  progress: counts,
                  coverage: counts,
                };
              }),
          },
        ];
      })
      .map((course) => {
        const entries = course.sections.flatMap((section) => section.content_entries);
        const counts = progress(entries.filter((entry) => entry.completed).length, entries.length);
        return {
          ...course,
          accessible: true,
          actionable: counts.completed < counts.total,
          progress: counts,
          coverage: counts,
        };
      });
    const entries = courses.flatMap((course) =>
      course.sections.flatMap((section) => section.content_entries),
    );
    const evaluation = data.resources.evaluations.find(
      (row) =>
        row.learning_path_id === path.id &&
        row.type === 'PARTIAL' &&
        row.is_published &&
        (row.preceding_competency_id === competency.id ||
          data.resources['progression-rules'].some(
            (rule) =>
              rule.is_active &&
              rule.learning_path_id === path.id &&
              object(rule.source).id === competency.id &&
              object(rule.target_on_success).id === row.id,
          )),
    );
    const counts = progress(entries.filter((entry) => entry.completed).length, entries.length);
    return [
      {
        ...simulationNode(data, enrollmentId, 'module', competency.id, counts),
        id: competency.id,
        name: text(competency.shortname),
        accessible: true,
        courses,
        progress: counts,
        coverage: counts,
        evaluation: evaluation ? evaluationSummary(evaluation) : null,
      },
    ];
  });
  const finals = data.resources.evaluations.filter(
    (row) => row.learning_path_id === path.id && row.type === 'FINAL' && row.is_published,
  );
  const finalEvaluations = finals.map(evaluationSummary);
  const evaluations = [
    ...modules.flatMap((module) => (module.evaluation ? [module.evaluation] : [])),
    ...finalEvaluations,
  ];
  const accessible = progressionAccess(data, enrollmentId, path.id, modules);
  const nodes = [...modules, ...evaluations];
  for (const node of nodes) {
    node.accessible = accessible.has(`${node.type}:${node.id}`);
    node.readable = node.accessible;
    node.actionable = node.accessible && node.actionable;
    node.current = node.actionable;
    if (!node.actionable) node.next_action = null;
    if (!node.readable) {
      node.current_execution = null;
      node.history = [];
    }
  }
  for (const module of modules) {
    for (const course of module.courses) {
      course.accessible = module.readable;
      course.actionable = module.actionable && course.actionable;
    }
  }
  const counts = progress(
    modules.reduce((sum, module) => sum + module.progress.completed, 0) +
      evaluations.filter((evaluation) => evaluation.completed).length,
    modules.reduce((sum, module) => sum + module.progress.total, 0) + evaluations.length,
  );
  const attempts = data.attempts.filter((attempt) => attempt.enrollment_id === enrollmentId);
  const execution: ApiExecutionSnapshot = {
    // A local stand-in for a definition; never a real frozen definition or enrollment.
    definition_id: registration.id,
    state_revision:
      1 +
      counts.completed +
      attempts.length +
      attempts.filter((attempt) => attempt.status === 'completed').length,
    status:
      counts.total > 0 && counts.completed === counts.total ? 'completed' : registration.status,
    current_execution: nodes.find((node) => node.actionable)?.current_execution ?? null,
    nodes: Object.fromEntries(
      nodes.map((node) => [
        `${node.type}:${node.id}`,
        {
          ...node,
          progress: { completed: node.progress.completed, total: node.progress.total },
          coverage: {
            completed: node.coverage.completed,
            total: node.coverage.total,
            percentage: node.coverage.percent,
          },
        },
      ]),
    ),
    pending_validation_rounds: {},
    progress: { completed: counts.completed, total: counts.total },
    coverage: { completed: counts.completed, total: counts.total, percentage: counts.percent },
    completed_counts: { historical: counts.completed, active_route: counts.completed },
    unlimited_attempts: evaluations.some((evaluation) => evaluation.max_attempts === null),
  };
  return {
    id: path.id,
    name: text(path.name),
    modules,
    final_evaluation: finalEvaluations[0] ?? null,
    final_evaluations: finalEvaluations,
    progress: counts,
    coverage: counts,
    definition_id: execution.definition_id,
    state_revision: execution.state_revision,
    status: execution.status,
    current_execution: execution.current_execution,
    completed_counts: execution.completed_counts,
    execution,
  };
}

function progressionAccess(
  data: SimulationData,
  enrollmentId: string,
  pathId: string,
  modules: ApiPortalLearningPathSummary['modules'],
): Set<string> {
  const evaluations = data.resources.evaluations.filter(
    (row) => row.learning_path_id === pathId && row.is_published,
  );
  const rules = data.resources['progression-rules'].filter(
    (rule) => rule.learning_path_id === pathId && rule.is_active,
  );
  const nodeKey = (node: unknown) => `${text(object(node).type)}:${text(object(node).id)}`;
  const targeted = new Set(
    rules.flatMap((rule) =>
      [rule.target_on_success, rule.target_on_failure, rule.target_on_exhausted]
        .filter(Boolean)
        .map(nodeKey),
    ),
  );
  // Mirrors the frozen server definition: the nodes form an ordered list whose
  // first element is the entry point of the path. Being some rule's target only
  // says where a branch lands, never whether a node opens the path. Without this,
  // a remediation branch pointing back at the first module locks it, and no rule
  // can ever fire since every source is then unreachable: the whole path stays
  // closed and the learner cannot open a single content.
  const ordered = [
    ...modules.map((module) => `module:${module.id}`),
    ...evaluations.map((evaluation) => `evaluation:${evaluation.id}`),
  ];
  const accessible = new Set(ordered.filter((key) => !targeted.has(key)));
  const entry = ordered[0];
  if (entry !== undefined) accessible.add(entry);
  // Fixed point, bounded by the graph size: cycles never recurse or unlock themselves.
  for (let pass = 0; pass <= rules.length; pass++) {
    let changed = false;
    for (const rule of rules) {
      if (!accessible.has(nodeKey(rule.source))) continue;
      const source = object(rule.source);
      const condition = object(rule.condition);
      let target: unknown;
      if (source.type === 'module') {
        const courses = modules.find((module) => module.id === source.id)?.courses ?? [];
        const completedCourses = courses.map((course) => {
          const entries = course.sections.flatMap((section) => section.content_entries);
          return entries.length > 0 && entries.every((entry) => entry.completed);
        });
        if (
          completedCourses.length &&
          (condition.rule_type === 'any'
            ? completedCourses.some(Boolean)
            : completedCourses.every(Boolean))
        )
          target = rule.target_on_success;
      } else {
        const attempts = data.attempts.filter(
          (attempt) =>
            attempt.enrollment_id === enrollmentId &&
            attempt.evaluation_id === source.id &&
            attempt.status === 'completed',
        );
        const last = attempts.at(-1);
        if (last) {
          const passed =
            condition.type === 'evaluation_completed' ||
            number(last.score) >= number(condition.min_score_percentage);
          target = passed
            ? rule.target_on_success
            : rule.max_attempts !== null && attempts.length >= number(rule.max_attempts)
              ? rule.target_on_exhausted
              : rule.target_on_failure;
        }
      }
      if (target && !accessible.has(nodeKey(target))) {
        accessible.add(nodeKey(target));
        changed = true;
      }
    }
    if (!changed) break;
  }
  return accessible;
}

function refreshEnrollment(data: SimulationData, id: string): void {
  const row = enrollment(data, id);
  const counts = summary(data, id).progress;
  row.started_at ??= SIMULATION_DATE;
  row.status = counts.total > 0 && counts.completed === counts.total ? 'completed' : 'in_progress';
  row.completed_at = row.status === 'completed' ? SIMULATION_DATE : null;
  row.updated_at = SIMULATION_DATE;
}

/** Never trusts an unknown status string: unmatched values are silently dropped, not thrown. */
function statusCounts(
  rows: readonly { status: string }[],
): Record<'completed' | 'in_progress' | 'not_started' | 'failed' | 'expired', number> {
  const counts = { completed: 0, in_progress: 0, not_started: 0, failed: 0, expired: 0 };
  for (const row of rows) if (row.status in counts) counts[row.status as keyof typeof counts]++;
  return counts;
}

function trackedSeconds(data: SimulationData, keyPrefix: string): number {
  let total = 0;
  for (const [key, session] of data.timeSessions)
    if (key.startsWith(keyPrefix)) total += number(session.time_spent);
  return total;
}

function courseStatus(
  counts: ApiProgressCounts,
): 'completed' | 'in_progress' | 'not_started' | 'no_content' {
  if (counts.total === 0) return 'no_content';
  if (counts.completed === counts.total) return 'completed';
  return counts.completed > 0 ? 'in_progress' : 'not_started';
}

function moduleDisplayStatus(module: ApiPortalSummaryModule): AttemptNodeStatus {
  if (module.progress.total > 0 && module.progress.completed === module.progress.total)
    return 'completed';
  return module.readable ? (module.progress.completed > 0 ? 'in_progress' : 'available') : 'locked';
}

function evaluationDisplayStatus(evaluation: ApiPortalEvalSummary): AttemptNodeStatus {
  if (evaluation.completed) return evaluation.current_result === 'passed' ? 'completed' : 'failed';
  return evaluation.readable ? 'available' : 'locked';
}

/**
 * A single synthetic segment per enrollment: this engine never models retries,
 * carried-over attempts or interruptions, unlike the real attempt history.
 */
function attemptNodes(data: SimulationData, enrollmentId: string): EnrollmentAttemptNode[] {
  const overview = summary(data, enrollmentId);
  const modules: EnrollmentAttemptNode[] = overview.modules.map((module, index) => ({
    type: 'module',
    key: `module:${module.id}`,
    title: module.name,
    position: index + 1,
    display_status: moduleDisplayStatus(module),
    blocked_by: null,
    carried_over_from: null,
    // Time is only tracked per competency here, so a module's courses share its total.
    tracked_time_seconds: trackedSeconds(data, `${enrollmentId}:${module.id}:`),
    courses: module.courses.map((course, courseIndex): EnrollmentAttemptCourse => ({
      id: course.id,
      title: course.name ?? '',
      position: courseIndex + 1,
      status: courseStatus(course.progress),
      progress: { total: course.progress.total, completed: course.progress.completed },
      tracked_time_seconds: trackedSeconds(data, `${enrollmentId}:${module.id}:`),
    })),
    result: null,
    score: null,
    round_number: null,
    attempts_used: null,
    max_attempts: null,
    started_at: module.current_execution?.started_at ?? null,
    completed_at: module.current_execution?.completed_at ?? null,
    elapsed_seconds: null,
  }));
  const evaluations: EnrollmentAttemptNode[] = overview.final_evaluations.map(
    (evaluation, index) => ({
      type: 'evaluation',
      key: `evaluation:${evaluation.id}`,
      title: evaluation.title,
      position: modules.length + index + 1,
      display_status: evaluationDisplayStatus(evaluation),
      blocked_by: null,
      carried_over_from: null,
      // Only tracked module time counts here, matching the intended default (no evaluation open time).
      tracked_time_seconds: 0,
      courses: [],
      result: evaluation.completed
        ? evaluation.current_result === 'passed'
          ? 'passed'
          : 'failed'
        : null,
      score: evaluation.score,
      round_number: evaluation.completed ? 1 : null,
      attempts_used: data.attempts.filter(
        (attempt) =>
          attempt.enrollment_id === enrollmentId && attempt.evaluation_id === evaluation.id,
      ).length,
      max_attempts: evaluation.max_attempts,
      started_at: evaluation.current_execution?.started_at ?? null,
      completed_at: evaluation.current_execution?.completed_at ?? null,
      elapsed_seconds: null,
    }),
  );
  return [...modules, ...evaluations];
}

/** This engine never fails or expires an enrollment, so only these two statuses are ever emitted. */
function attemptSummaries(data: SimulationData, enrollmentId: string): EnrollmentAttemptSummary[] {
  const row = enrollment(data, enrollmentId);
  if (!row.started_at) return [];
  return [
    {
      // Hyphen-only: the real hook's isValidId (^[a-zA-Z0-9_-]+$) would silently skip a colon-joined id.
      id: `${enrollmentId}-attempt-1`,
      attempt_number: 1,
      status: row.status === 'completed' ? 'completed' : 'in_progress',
      available_at: row.enrolled_at,
      started_at: row.started_at,
      ended_at: row.completed_at,
      interruption_reason: null,
      time_spent_seconds: trackedSeconds(data, `${enrollmentId}:`),
    },
  ];
}

function clientOverview(data: SimulationData): ClientDashboardOverview {
  const rows = data.enrollments.filter((row) => row.assigned_by === SIMULATION_IDS.manager);
  const counts = statusCounts(rows);
  return {
    learning_paths: new Set(rows.map((row) => row.learning_path_id)).size,
    enrollments: { ...counts, total: rows.length },
  };
}

function clientStudent(
  data: SimulationData,
  row: SimulationData['enrollments'][number],
): ApiClientDashboardStudent {
  const learner = data.resources.users.find((user) => user.id === row.learner_id);
  const path = data.resources['learning-paths'].find((item) => item.id === row.learning_path_id);
  return {
    id: row.id,
    learner: {
      id: row.learner_id,
      first_name: shortText(learner?.first_name, 255),
      last_name: shortText(learner?.last_name, 255),
      email: shortText(learner?.email, 255),
    },
    learning_path: { id: row.learning_path_id, name: text(path?.name) },
    status: row.status,
    progress_percent: summary(data, row.id).progress.percent,
    enrolled_at: row.enrolled_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    ended_at: row.completed_at ?? row.failed_at,
    expires_at: null,
  };
}

function clientStudentsPage(data: SimulationData, params: URLSearchParams): SimulationResponse {
  const rows = data.enrollments.filter((row) => row.assigned_by === SIMULATION_IDS.manager);
  const perPage = Math.max(1, Math.min(100, Number(params.get('per_page')) || 20));
  const page = Math.max(1, Number(params.get('page')) || 1);
  return response({
    data: rows.slice((page - 1) * perPage, page * perPage).map((row) => clientStudent(data, row)),
    meta: { total: rows.length, page, per_page: perPage },
  });
}

function editorOverview(data: SimulationData): ApiDashboardOverview {
  const paths = data.resources['learning-paths'];
  const now = Date.parse(SIMULATION_DATE);
  const published = paths.filter(
    (path) => typeof path.published_at === 'string' && Date.parse(path.published_at) <= now,
  ).length;
  return {
    catalog: { total: paths.length, published, unpublished: paths.length - published },
    students: {
      unique_students: new Set(data.enrollments.map((row) => row.learner_id)).size,
      total_enrollments: data.enrollments.length,
      status_counts: statusCounts(data.enrollments),
    },
  };
}

function formationRow(data: SimulationData, path: SimulationEntity): ApiDashboardFormation {
  const rows = data.enrollments.filter((row) => row.learning_path_id === path.id);
  const counts = statusCounts(rows);
  return {
    id: path.id,
    name: text(path.name),
    is_published:
      typeof path.published_at === 'string' &&
      Date.parse(path.published_at) <= Date.parse(SIMULATION_DATE),
    total_enrollments: rows.length,
    completion_rate: rows.length ? Math.round((100 * counts.completed) / rows.length) : 0,
    status_counts: counts,
  };
}

function formationsPage(data: SimulationData, params: URLSearchParams): SimulationResponse {
  const rows = data.resources['learning-paths'].map((path) => formationRow(data, path));
  const q = params.get('q')?.toLocaleLowerCase();
  const filtered = q ? rows.filter((row) => row.name.toLocaleLowerCase().includes(q)) : rows;
  const sortBy = params.get('sort_by');
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'completion'
      ? a.completion_rate - b.completion_rate
      : sortBy === 'failed'
        ? (b.status_counts.failed ?? 0) - (a.status_counts.failed ?? 0)
        : b.total_enrollments - a.total_enrollments,
  );
  const perPage = Math.max(1, Number(params.get('per_page')) || 20);
  const page = Math.max(1, Number(params.get('page')) || 1);
  return response({
    data: sorted.slice((page - 1) * perPage, page * perPage),
    meta: { total: sorted.length, page, per_page: perPage },
  });
}

function dashboardEnrollmentRow(
  data: SimulationData,
  row: SimulationData['enrollments'][number],
): ApiDashboardEnrollment {
  const learner = data.resources.users.find((user) => user.id === row.learner_id);
  return {
    id: row.id,
    learner: {
      id: row.learner_id,
      first_name: shortText(learner?.first_name, 255),
      last_name: shortText(learner?.last_name, 255),
      email: shortText(learner?.email, 255),
    },
    status: row.status,
    enrolled_at: row.enrolled_at,
    started_at: row.started_at,
    ended_at: row.completed_at ?? row.failed_at,
    expires_at: null,
    attempts_count: data.attempts.filter((attempt) => attempt.enrollment_id === row.id).length,
    time_spent_seconds: trackedSeconds(data, `${row.id}:`),
  };
}

function formationEnrollmentsPage(
  data: SimulationData,
  formationId: string,
  params: URLSearchParams,
): SimulationResponse {
  const path = find(data, 'learning-paths', formationId);
  const base = data.enrollments.filter((row) => row.learning_path_id === path.id);
  const summaryCounts = statusCounts(base);
  const status = params.get('status');
  const q = params.get('q')?.toLocaleLowerCase();
  const rows = base
    .filter((row) => !status || row.status === status)
    .filter((row) => {
      if (!q) return true;
      const learner = data.resources.users.find((user) => user.id === row.learner_id);
      return [learner?.first_name, learner?.last_name, learner?.email].some((value) =>
        text(value).toLocaleLowerCase().includes(q),
      );
    });
  const perPage = Math.max(1, Number(params.get('per_page')) || 20);
  const page = Math.max(1, Number(params.get('page')) || 1);
  return response({
    data: rows
      .slice((page - 1) * perPage, page * perPage)
      .map((row) => dashboardEnrollmentRow(data, row)),
    meta: {
      total: rows.length,
      page,
      per_page: perPage,
      summary: { total: base.length, status_counts: summaryCounts },
      formation: { duration_minutes: typeof path.duration === 'number' ? path.duration : null },
    },
  });
}

function handleDashboard(
  data: SimulationData,
  path: string,
  method: Method,
  params: URLSearchParams,
): SimulationResponse | undefined {
  if (path === 'dashboard/client/overview') {
    if (method !== 'GET') return unsupported(method, path);
    return response({ data: clientOverview(data) });
  }
  if (path === 'dashboard/client/students') {
    if (method !== 'GET') return unsupported(method, path);
    return clientStudentsPage(data, params);
  }
  if (path === 'platform/dashboard/overview') {
    if (method !== 'GET') return unsupported(method, path);
    return response({ data: editorOverview(data) });
  }
  if (path === 'platform/dashboard/formations') {
    if (method !== 'GET') return unsupported(method, path);
    return formationsPage(data, params);
  }
  const enrollmentsMatch = /^platform\/dashboard\/formations\/([^/]+)\/enrollments$/.exec(path);
  if (enrollmentsMatch) {
    if (method !== 'GET') return unsupported(method, path);
    return formationEnrollmentsPage(data, enrollmentsMatch[1], params);
  }
  return undefined;
}

function handleEnrollmentHistory(
  data: SimulationData,
  path: string,
  method: Method,
  params: URLSearchParams,
): SimulationResponse | undefined {
  const match = /^(?:platform\/)?enrollments\/([^/]+)\/history(?:\/attempts\/([^/]+))?$/.exec(path);
  if (!match) return undefined;
  if (method !== 'GET') return unsupported(method, path);
  const row = enrollment(data, match[1]);
  const attempts = attemptSummaries(data, row.id);
  if (match[2]) {
    const attempt = attempts.find((item) => item.id === match[2]);
    if (!attempt) fail(404, 'Simulation : tentative introuvable.', 'SIMULATION_NOT_FOUND');
    return response({ data: { attempt, nodes: attemptNodes(data, row.id) } });
  }
  const perPage = Math.max(1, Number(params.get('per_page')) || 20);
  const page = Math.max(1, Number(params.get('page')) || 1);
  return response({
    data: {
      enrollment: {
        id: row.id,
        learner_id: row.learner_id,
        learning_path_id: row.learning_path_id,
        status: row.status,
      },
      attempts: attempts.slice((page - 1) * perPage, page * perPage),
    },
    meta: { total: attempts.length, page, per_page: perPage },
  });
}

function validateEntry(
  data: SimulationData,
  enrollmentId: string,
  courseId: string,
  entryId: string,
  competencyId?: string,
): SimulationEntity {
  const row = find(data, 'entries', entryId);
  if (find(data, 'sections', text(row.course_section_id)).course_id !== courseId)
    fail(404, 'Simulation : contenu absent du cours.');
  const modules = summary(data, enrollmentId).modules;
  if (
    !modules.some(
      (module) =>
        (!competencyId || module.id === competencyId) &&
        module.courses.some(
          (course) =>
            course.id === courseId &&
            course.sections.some((section) =>
              section.content_entries.some((entry) => entry.id === entryId),
            ),
        ),
    )
  )
    fail(404, 'Simulation : contenu absent de cette inscription.');
  if (
    !modules.some(
      (module) =>
        module.accessible &&
        (!competencyId || module.id === competencyId) &&
        module.courses.some((course) => course.id === courseId),
    )
  )
    fail(403, 'Simulation : terminez les prérequis de ce module.');
  return row;
}

function handleCart(
  data: SimulationData,
  path: string,
  method: Method,
  payload: JsonObject,
): SimulationResponse {
  const cart = data.cart;
  const result = () => {
    cart.total =
      Math.round(cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
    return response({ data: cart });
  };
  if (path === 'carts' && method === 'GET') return result();
  if (path === 'carts/items' && method === 'POST') {
    const productId = text(payload.learning_path_id);
    const fixture = data.resources['learning-paths'].find((row) => row.id === productId);
    const product =
      data.shopPrices.get(productId) ??
      (fixture
        ? {
            price: number(fixture.price),
            currency: text(fixture.currency) || 'EUR',
            image: text(object(fixture.image).url) || SIMULATION_COVER_IMAGE,
          }
        : undefined);
    if (!product)
      invalid(
        'Produit non connu. Ouvrez sa fiche boutique avant de l’ajouter au panier de démonstration.',
      );
    if (cart.items.length && product.currency !== cart.currency)
      invalid('Les devises du panier doivent être identiques.');
    cart.currency = product.currency;
    const existing = cart.items.find((item) => item.learning_path_id === productId);
    if (existing) existing.quantity += 1;
    else
      cart.items.push({
        id: nextId(data),
        cart_id: cart.id,
        learning_path_id: productId,
        name: fixture
          ? text(fixture.name)
          : (data.shopPrices.get(productId)?.name ?? 'Produit boutique démonstration'),
        image: product.image ?? SIMULATION_COVER_IMAGE,
        price: product.price,
        currency: product.currency,
        quantity: 1,
        created_at: SIMULATION_DATE,
        updated_at: SIMULATION_DATE,
      });
    return result();
  }
  const match = /^carts\/items\/([^/]+)$/.exec(path);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    const item = cart.items.find((row) => row.id === match[1]);
    if (!item) fail(404, 'Simulation : ligne du panier introuvable.');
    if (method === 'DELETE') cart.items = cart.items.filter((row) => row.id !== item.id);
    else {
      if (
        !Number.isInteger(payload.quantity) ||
        number(payload.quantity) < 1 ||
        number(payload.quantity) > 10000
      ) {
        invalid('La quantité doit être un entier entre 1 et 10000.');
      }
      item.quantity = number(payload.quantity);
    }
    return result();
  }
  return unsupported(method, path);
}

function handleOrders(
  data: SimulationData,
  path: string,
  method: Method,
  payload: JsonObject,
  params: URLSearchParams,
): SimulationResponse {
  if (path === 'orders' && method === 'GET')
    return listResponse(
      data.orders.map((row) => ({ ...row })),
      params,
    );
  const match = /^orders\/([^/]+)$/.exec(path);
  if (match && method === 'GET')
    return response({
      data:
        data.orders.find((order) => order.id === match[1]) ??
        fail(404, 'Simulation : commande introuvable.'),
    });
  if (path === 'orders' && method === 'POST') {
    if (!['card', 'bank_transfer', 'cash'].includes(text(payload.payment_method)))
      invalid('Moyen de paiement invalide.');
    if (!data.cart.items.length) invalid('Le panier est vide.');
    const order = {
      id: nextId(data),
      payment_method: payload.payment_method as PaymentMethod,
      status: 'completed',
      created_at: SIMULATION_DATE,
      updated_at: SIMULATION_DATE,
      total: data.cart.total,
      currency: data.cart.currency,
      items: data.cart.items.map((item) => ({ ...item })),
    };
    data.orders.push(order);
    // Every bought product becomes a local purchase. A real shop product only
    // carries its public listing data (name, cover, category): its training
    // content is never imported, so assigning it only simulates the assignment.
    for (const item of order.items) {
      const fixture = data.resources['learning-paths'].some(
        (row) => row.id === item.learning_path_id,
      );
      const shop = data.shopPrices.get(item.learning_path_id);
      if (!fixture && !shop) continue;
      const purchase = data.purchases.find((row) => row.learning_path_id === item.learning_path_id);
      if (purchase) purchase.purchased += item.quantity;
      else
        data.purchases.push({
          id: nextId(data),
          learning_path_id: item.learning_path_id,
          purchased: item.quantity,
          created_at: SIMULATION_DATE,
          ...(fixture
            ? {}
            : {
                product: {
                  name: item.name,
                  // Already validated by rememberShopData: the authorized cover or local artwork.
                  image: shop?.image ?? SIMULATION_COVER_IMAGE,
                  category_id: shop?.category_id ?? null,
                },
              }),
        });
    }
    data.cart.items = [];
    data.cart.total = 0;
    return response({ data: order }, 201);
  }
  return unsupported(method, path);
}

/** The fictional path, or the public shop listing of a real product bought during the simulation. */
function purchasedLearningPath(
  data: SimulationData,
  purchase: SimulationPurchase,
): SimulationEntity {
  if (!purchase.product) {
    return decorate(
      data,
      'learning-paths',
      find(data, 'learning-paths', purchase.learning_path_id),
    );
  }
  const { name, image, category_id } = purchase.product;
  return {
    id: purchase.learning_path_id,
    name,
    image: { id: purchase.learning_path_id, url: image, mime_type: '' },
    category_id,
    category_name: category_id ? (data.shopCategories.get(category_id) ?? null) : null,
  };
}

function handlePurchases(
  data: SimulationData,
  path: string,
  method: Method,
  params: URLSearchParams,
): SimulationResponse {
  if (method !== 'GET') return unsupported(method, path);
  if (path === 'purchased-learning-paths')
    return listResponse(
      data.purchases.map((purchase) => {
        const learningPath = purchasedLearningPath(data, purchase);
        const registrations = data.enrollments.filter(
          (row) => row.learning_path_id === purchase.learning_path_id,
        );
        return {
          ...purchase,
          tenant_id: SIMULATION_IDS.tenant,
          user_id: SIMULATION_IDS.manager,
          used: registrations.length,
          credits_available: Math.max(0, purchase.purchased - registrations.length),
          learning_path: {
            id: learningPath.id,
            name: learningPath.name,
            image: learningPath.image,
            category_id: learningPath.category_id,
            category_name: learningPath.category_name,
          },
          ...Object.fromEntries(
            ['not_started', 'in_progress', 'completed', 'expired', 'failed'].map((status) => [
              `enrollments_${status}_count`,
              registrations.filter((row) => row.status === status).length,
            ]),
          ),
          updated_at: SIMULATION_DATE,
        };
      }),
      params,
    );
  const match = /^purchased-learning-paths\/([^/]+)\/(learners|enrollments\/history)$/.exec(path);
  if (!match) return unsupported(method, path);
  const purchase = data.purchases.find(
    (row) => row.id === match[1] || row.learning_path_id === match[1],
  );
  if (!purchase) fail(404, 'Simulation : achat introuvable.');
  const registrations = data.enrollments.filter(
    (row) => row.learning_path_id === purchase.learning_path_id,
  );
  if (match[2] === 'learners')
    return listResponse(
      data.resources.users
        .filter((row) => row.role === Role.TRAINEE)
        .map((user) => ({
          ...user,
          enrollment: registrations.find((row) => row.learner_id === user.id) ?? null,
        })),
      params,
    );
  return listResponse(
    registrations.map((row) => ({
      ...row,
      expires_at: null,
      learner: data.resources.users.find((user) => user.id === row.learner_id) ?? null,
    })),
    params,
  );
}

function createEnrollments(data: SimulationData, payload: JsonObject): SimulationResponse {
  const pathId = text(payload.learning_path_id);
  // A purchase is what grants assignment, for a fictional path as for a real
  // shop product bought locally (whose content is never loaded: the assignment
  // only consumes local credits and lists the learners).
  const purchase = data.purchases.find((row) => row.learning_path_id === pathId);
  if (!purchase) invalid('Aucun crédit local pour ce parcours.');
  const learnerIds = new Set(strings(payload.learner_ids));
  for (const id of strings(payload.group_ids)) {
    objects(find(data, 'groups', id).members).forEach((member) =>
      learnerIds.add(text(member.trainee_id)),
    );
  }
  if (!learnerIds.size) invalid('Choisissez au moins un apprenant ou un groupe.');
  for (const id of learnerIds)
    if (find(data, 'users', id).role !== Role.TRAINEE)
      invalid('Un utilisateur sélectionné n’est pas apprenant.');
  const existing = data.enrollments.filter((row) => row.learning_path_id === pathId);
  const skipped = [...learnerIds].filter((id) =>
    existing.some(
      (row) => row.learner_id === id && row.status !== 'expired' && row.status !== 'failed',
    ),
  );
  const newIds = [...learnerIds].filter((id) => !skipped.includes(id));
  if (existing.length + newIds.length > purchase.purchased)
    invalid('Crédits de démonstration insuffisants.');
  const created = newIds.map((learnerId) => ({
    id: nextId(data),
    tenant_id: SIMULATION_IDS.tenant,
    assigned_by: SIMULATION_IDS.manager,
    learning_path_id: pathId,
    learner_id: learnerId,
    status: 'not_started' as const,
    enrolled_at: SIMULATION_DATE,
    started_at: null,
    completed_at: null,
    failure_reason: null,
    failed_at: null,
    created_at: SIMULATION_DATE,
    updated_at: SIMULATION_DATE,
  }));
  data.enrollments.push(...created);
  return response(
    {
      message: 'Inscriptions de démonstration créées.',
      data: created,
      meta: {
        enrolled_count: created.length,
        skipped_count: skipped.length,
        skipped_learner_ids: skipped,
      },
    },
    201,
  );
}

function attemptLimit(data: SimulationData, evaluation: SimulationEntity): number | null {
  const limits = [
    evaluation.max_attempts,
    ...data.resources['progression-rules']
      .filter(
        (rule) =>
          rule.is_active &&
          object(rule.source).type === 'evaluation' &&
          object(rule.source).id === evaluation.id,
      )
      .map((rule) => rule.max_attempts),
  ].filter((value): value is number => typeof value === 'number' && value > 0);
  return limits.length ? Math.min(...limits) : null;
}

function evaluationTimeLimit(evaluation: SimulationEntity): number | null {
  const minutes = number(evaluation.time_limit_minutes);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 2147483647 ? minutes : null;
}

function attemptConflict(message: string): never {
  throw Object.assign(
    new Error(message),
    response({ message, error_code: 'execution_conflict', simulation: true }, 409),
  );
}

function requireAttemptUuid(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
  )
    invalid(`${field} doit être un UUID.`);
  return value;
}

function attemptDue(attempt: SimulationAttempt, now: Date): boolean {
  return (
    attempt.status === 'in_progress' &&
    attempt.expires_at != null &&
    now.getTime() >= Date.parse(attempt.expires_at)
  );
}

function attemptResponse(
  data: SimulationData,
  attempt: SimulationAttempt,
  now: Date,
  status = 200,
): SimulationResponse {
  return response(
    {
      data: { ...attempt, server_now: now.toISOString() },
      ...(attempt.status === 'completed'
        ? { execution: summary(data, attempt.enrollment_id).execution }
        : {}),
    },
    status,
  );
}

/** One finalization path for submit, poll, session resolution and late answers. */
function finalizeAttempt(
  data: SimulationData,
  attempt: SimulationAttempt,
  requestedReason: EvaluationCompletionReason,
  now: Date,
): void {
  if (attempt.status === 'completed') return;
  const reason = attemptDue(attempt, now) ? 'timeout' : requestedReason;
  if (reason === 'timeout' && !attemptDue(attempt, now))
    attemptConflict('Simulation : l’échéance de cette évaluation n’est pas atteinte.');
  if (
    reason === 'manual' &&
    attempt.quizzes.some(
      (quiz) =>
        quiz.submitted_answer == null ||
        (quiz.type === 'matching' &&
          objects(object(quiz.submitted_answer).pairs).length !== quiz.left_values?.length),
    )
  )
    fail(409, 'Simulation : répondez à toutes les questions avant de soumettre.');

  attempt.score = Math.round(
    (attempt.quizzes.filter((quiz) => isCorrect(data, quiz)).length * 100) /
      Math.max(1, attempt.quizzes.length),
  );
  attempt.status = 'completed';
  attempt.completion_reason = reason;
  attempt.completed_at = reason === 'timeout' ? attempt.expires_at! : now.toISOString();
  refreshEnrollment(data, attempt.enrollment_id);
  changedData.add(data);
}

function resolveAttemptSession(
  data: SimulationData,
  attempt: SimulationAttempt,
  pageSessionId: string | null,
  now: Date,
): void {
  if (attempt.status === 'completed') return;
  if (attemptDue(attempt, now)) {
    finalizeAttempt(data, attempt, 'timeout', now);
  } else if (attempt.page_session_id != null) {
    if (pageSessionId === null)
      attemptConflict('Simulation : la session de page est requise pour cette évaluation.');
    if (pageSessionId !== attempt.page_session_id)
      finalizeAttempt(data, attempt, 'page_reload', now);
  }
}

function evaluationVisit(
  data: SimulationData,
  enrollmentId: string,
  evaluationId: string,
  executionId?: string,
) {
  const registration = enrollment(data, enrollmentId);
  const evaluation = find(data, 'evaluations', evaluationId);
  if (evaluation.learning_path_id !== registration.learning_path_id || !evaluation.is_published)
    fail(404, 'Simulation : évaluation indisponible.');
  const tree = summary(data, enrollmentId);
  const node = tree.execution.nodes[`evaluation:${evaluationId}`];
  const localExecutionId = simulationExecutionId(data, enrollmentId, 'evaluation', evaluationId);
  if (executionId !== undefined && executionId !== localExecutionId)
    attemptConflict('Simulation : cette visite ne correspond pas à l’évaluation.');
  const previous = data.attempts.filter(
    (attempt) =>
      attempt.enrollment_id === enrollmentId &&
      attempt.evaluation_id === evaluationId &&
      (attempt.node_execution_id == null || attempt.node_execution_id === localExecutionId),
  );
  return { evaluation, tree, node, previous, executionId: localExecutionId };
}

/** A POST lookup is not a start: neither the attempt budget nor progression changes. */
function attemptSession(
  data: SimulationData,
  enrollmentId: string,
  evaluationId: string,
  payload: JsonObject,
): SimulationResponse {
  const executionId = requireAttemptUuid(payload.node_execution_id, 'node_execution_id');
  const pageSessionId = requireAttemptUuid(payload.page_session_id, 'page_session_id');
  const visit = evaluationVisit(data, enrollmentId, evaluationId, executionId);
  const attempt = visit.previous.at(-1);
  if (!visit.node?.readable && attempt?.status !== 'completed')
    attemptConflict('Simulation : cette visite n’est pas accessible.');
  if (!attempt) return response({ data: null });
  const now = new Date();
  resolveAttemptSession(data, attempt, pageSessionId, now);
  return attemptResponse(data, attempt, now);
}

function startAttempt(
  data: SimulationData,
  enrollmentId: string,
  evaluationId: string,
  payload: JsonObject,
): SimulationResponse {
  const pageSessionId =
    payload.page_session_id == null
      ? null
      : requireAttemptUuid(payload.page_session_id, 'page_session_id');
  // Old fixture callers omit the entire context. A protected call must supply it.
  const hasContext =
    pageSessionId !== null ||
    'node_execution_id' in payload ||
    'expected_state_revision' in payload;
  const requestedExecutionId = hasContext
    ? requireAttemptUuid(payload.node_execution_id, 'node_execution_id')
    : undefined;
  if (
    hasContext &&
    (!Number.isInteger(payload.expected_state_revision) ||
      number(payload.expected_state_revision, -1) < 0)
  )
    invalid('expected_state_revision doit être un entier positif ou nul.');
  const { evaluation, tree, node, previous, executionId } = evaluationVisit(
    data,
    enrollmentId,
    evaluationId,
    requestedExecutionId,
  );
  const latest = previous.at(-1);
  const now = new Date();
  // Match StartEvaluationAttemptUseCase: replay protected attempts BEFORE revision/current guards.
  if (
    latest?.page_session_id != null &&
    (latest.status === 'in_progress' || latest.page_session_id === pageSessionId)
  ) {
    resolveAttemptSession(data, latest, pageSessionId, now);
    return attemptResponse(data, latest, now);
  }
  if (latest?.page_session_id != null && pageSessionId === null)
    attemptConflict('Simulation : la session de page est requise pour cette évaluation.');
  if (!node?.readable) fail(403, 'Simulation : terminez les prérequis de cette évaluation.');
  if (hasContext && (!node.actionable || tree.state_revision !== payload.expected_state_revision))
    attemptConflict('Simulation : la visite ou la révision de cette évaluation a changé.');
  const ongoing = previous.find((attempt) => attempt.status === 'in_progress');
  if (ongoing) {
    resolveAttemptSession(data, ongoing, pageSessionId, now);
    return attemptResponse(data, ongoing, now);
  }
  const limit = attemptLimit(data, evaluation);
  if (limit !== null && previous.length >= limit) {
    if (hasContext) fail(409, 'Simulation : nombre maximal de tentatives atteint.');
    invalid('Nombre maximal de tentatives atteint.');
  }
  const questionPool = pool(data, evaluation);
  if (questionPool.length < number(evaluation.question_count))
    invalid('La banque de questions locale est insuffisante.');
  const quizzes: ApiAttemptQuiz[] = questionPool
    .slice(0, number(evaluation.question_count))
    .map((quiz, position) => ({
      id: nextId(data),
      quiz_id: quiz.id,
      position,
      points: 1,
      type: quiz.type as ApiAttemptQuiz['type'],
      question: text(quiz.question),
      ...(Array.isArray(quiz.options)
        ? {
            options: objects(quiz.options).map((option) => ({
              id: text(option.id),
              label: text(option.label),
            })),
          }
        : {}),
      ...(Array.isArray(quiz.pairs)
        ? {
            left_values: objects(quiz.pairs).map((pair) => text(pair.left)),
            right_values: objects(quiz.pairs).map((pair) => text(pair.right)),
          }
        : {}),
      submitted_answer: null,
      answer_revision: 0,
    }));
  const timeLimitMinutes = evaluationTimeLimit(evaluation);
  const attempt: SimulationAttempt = {
    id: nextId(data),
    enrollment_id: enrollmentId,
    evaluation_id: evaluationId,
    node_execution_id: executionId,
    // The existing local progression engine has synthetic visits, not backend validation rounds.
    validation_round_id: null,
    status: 'in_progress' as const,
    score: null,
    started_at: now.toISOString(),
    completed_at: null,
    time_limit_minutes: timeLimitMinutes,
    expires_at:
      timeLimitMinutes === null
        ? null
        : new Date(now.getTime() + timeLimitMinutes * 60_000).toISOString(),
    completion_reason: null,
    page_session_id: pageSessionId,
    quizzes,
  };
  data.attempts.push(attempt);
  refreshEnrollment(data, enrollmentId);
  changedData.add(data);
  return attemptResponse(data, attempt, now, 201);
}

function saveAttemptAnswer(
  data: SimulationData,
  attempt: SimulationAttempt,
  attemptQuizId: string,
  payload: JsonObject,
): void {
  if ('page_session_id' in payload) requireAttemptUuid(payload.page_session_id, 'page_session_id');
  if (attempt.page_session_id != null) {
    if (payload.page_session_id == null || payload.answer_revision == null)
      invalid('La session de page et la révision de réponse sont requises.');
    if (payload.page_session_id !== attempt.page_session_id)
      attemptConflict('Simulation : cette évaluation appartient à une autre session de page.');
  }
  if (
    'answer_revision' in payload &&
    (!Number.isInteger(payload.answer_revision) ||
      number(payload.answer_revision) < 1 ||
      number(payload.answer_revision) > 2147483647)
  )
    invalid('answer_revision doit être un entier positif.');
  if ('clear' in payload && typeof payload.clear !== 'boolean')
    invalid('clear doit être un booléen.');
  const quiz = attempt.quizzes.find((row) => row.id === attemptQuizId);
  if (!quiz) fail(404, 'Simulation : question absente de la tentative.');
  const revision = number(payload.answer_revision, (quiz.answer_revision ?? 0) + 1);
  if (revision <= (quiz.answer_revision ?? 0)) return;

  let answer: JsonObject | null = null;
  if (payload.clear !== true) {
    if (quiz.type === 'true_false') {
      if (typeof payload.answer !== 'boolean') invalid('Une réponse booléenne est requise.');
      answer = { answer: payload.answer };
    } else if (quiz.type === 'matching') {
      const pairs = objects(payload.pairs);
      if (
        !Array.isArray(payload.pairs) ||
        (attempt.page_session_id == null && pairs.length !== quiz.left_values?.length) ||
        pairs.some(
          (pair) =>
            typeof pair.left !== 'string' ||
            typeof pair.right !== 'string' ||
            !quiz.left_values?.includes(pair.left) ||
            !quiz.right_values?.includes(pair.right),
        ) ||
        new Set(pairs.map((pair) => pair.left)).size !== pairs.length ||
        new Set(pairs.map((pair) => pair.right)).size !== pairs.length
      )
        invalid('Paires invalides.');
      answer = { pairs: pairs.map((pair) => ({ left: pair.left, right: pair.right })) };
    } else {
      const selected = strings(payload.selected_option_ids);
      if (
        !Array.isArray(payload.selected_option_ids) ||
        selected.length !== payload.selected_option_ids.length ||
        selected.length === 0 ||
        (quiz.type === 'single_choice' && selected.length !== 1) ||
        new Set(selected).size !== selected.length ||
        selected.some((id) => !quiz.options?.some((option) => option.id === id))
      )
        invalid('Options invalides.');
      answer = { selected_option_ids: selected };
    }
  }
  // Only normalized answer fields are retained; metadata/unknown fields are never quiz answers.
  quiz.submitted_answer = safeValue(answer);
  quiz.answer_revision = revision;
  changedData.add(data);
}

function isCorrect(data: SimulationData, quiz: ApiAttemptQuiz): boolean {
  if (quiz.submitted_answer == null) return false;
  const question = find(data, 'quizzes', quiz.quiz_id);
  const answer = object(quiz.submitted_answer);
  if (question.type === 'true_false') return answer.answer === question.correct_answer;
  if (question.type === 'matching') {
    const pairs = objects(question.pairs);
    const supplied = objects(answer.pairs);
    return (
      pairs.length === supplied.length &&
      pairs.every((pair) =>
        supplied.some((item) => item.left === pair.left && item.right === pair.right),
      )
    );
  }
  const expected = objects(question.options)
    .filter((option) => option.is_correct)
    .map((option) => text(option.id))
    .sort();
  return (
    JSON.stringify(expected) ===
    JSON.stringify([...new Set(strings(answer.selected_option_ids))].sort())
  );
}

function legacyCourse(row: SimulationEntity): SimulationEntity {
  return {
    ...row,
    fullName: row.full_name,
    shortName: row.short_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    identifier: row.id_number,
    visible: row.visibility === 'PUBLISHED',
    isLocked: row.is_locked,
    lockOrigins: row.lock_origins,
  };
}

function handleLegacy(
  data: SimulationData,
  path: string,
  method: Method,
  payload: JsonObject,
  params: URLSearchParams,
): SimulationResponse | undefined {
  const match = /^(courses|trainees)(?:\/([^/]+))?$/.exec(path);
  if (!match) return undefined;
  const [, resource, id] = match;
  if (resource === 'trainees') {
    if (method !== 'GET') return unsupported(method, path);
    const rows = data.resources.users
      .filter((user) => user.role === Role.TRAINEE)
      .map((user) => ({
        ...user,
        name: user.full_name,
        tenantId: user.tenant_id,
        isActive: user.is_active,
        createdAt: user.created_at,
        enrolledCourses: data.enrollments.filter((row) => row.learner_id === user.id).length,
      }));
    if (id)
      return response(
        rows.find((row) => row.id === id) ?? fail(404, 'Simulation : apprenant introuvable.'),
      );
    return listResponse(rows, params);
  }
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return unsupported(method, path);
  const fields: Record<string, string> = {
    fullName: 'full_name',
    shortName: 'short_name',
    categoryId: 'category_id',
  };
  const converted = { ...payload };
  for (const [from, to] of Object.entries(fields))
    if (from in payload) converted[to] = payload[from];
  if ('visible' in payload && !('visibility' in payload))
    converted.visibility = payload.visible ? 'PUBLISHED' : 'DRAFT';
  if (!id && method === 'GET')
    return listResponse(
      data.resources.courses.map((row) => legacyCourse(decorate(data, 'courses', row))),
      params,
    );
  const result = crud(data, { resource: 'courses', bare: true }, id, method, converted, params);
  return result.status === 204
    ? result
    : response(legacyCourse(result.json as SimulationEntity), result.status);
}

/** Notes are derived from the same attempts/enrollments as the learner player, never parallel mock scores. */
function formationNotes(data: SimulationData, pathId: string): FormationDetail {
  const path = decorate(data, 'learning-paths', find(data, 'learning-paths', pathId));
  const evaluations = data.resources.evaluations.filter((row) => row.learning_path_id === pathId);
  return {
    id: path.id,
    name: text(path.name),
    coverImage: SIMULATION_COVER_IMAGE,
    category: text(path.category_name),
    evaluations: evaluations.map((row) => ({ id: row.id, label: text(row.title) })),
    rows: data.enrollments
      .filter((row) => row.learning_path_id === pathId)
      .map((registration) => {
        const user = find(data, 'users', registration.learner_id);
        return {
          id: registration.id,
          traineeId: user.id,
          traineeName: text(user.full_name),
          clientId: SIMULATION_IDS.tenant,
          clientName: text(data.resources.tenants[0].name),
          formationId: path.id,
          formationName: text(path.name),
          formationCoverImage: SIMULATION_COVER_IMAGE,
          formationCategory: text(path.category_name),
          evaluations: evaluations.map((evaluation) => {
            const attempt = data.attempts
              .filter(
                (row) =>
                  row.enrollment_id === registration.id &&
                  row.evaluation_id === evaluation.id &&
                  row.status === 'completed',
              )
              .at(-1);
            return {
              id: evaluation.id,
              label: text(evaluation.title),
              pointsEarned: attempt?.score ?? 0,
              pointsMax: 100,
            };
          }),
        };
      }),
  };
}

function handleNotes(
  data: SimulationData,
  path: string,
  method: Method,
  params: URLSearchParams,
): SimulationResponse | undefined {
  const match = /^(?:admin\/)?evaluation-notes\/formations(?:\/([^/]+))?$/.exec(path);
  if (!match) return undefined;
  if (method !== 'GET') return unsupported(method, path);
  if (match[1]) return response({ data: formationNotes(data, match[1]) });
  const details = data.resources['learning-paths'].map((row) => formationNotes(data, row.id));
  const q = params.get('q')?.toLocaleLowerCase();
  const rows: FormationSummary[] = details
    .filter(
      (detail) =>
        (!params.get('tenant_id') || params.get('tenant_id') === SIMULATION_IDS.tenant) &&
        (!q ||
          [detail.name, ...detail.rows.map((row) => row.traineeName)].some((value) =>
            value.toLocaleLowerCase().includes(q),
          )),
    )
    .map((detail) => {
      const scores = detail.rows.map((row) =>
        row.evaluations.length
          ? row.evaluations.reduce((sum, item) => sum + item.pointsEarned, 0) /
            row.evaluations.length
          : 0,
      );
      return {
        id: detail.id,
        name: detail.name,
        coverImage: detail.coverImage,
        category: detail.category,
        traineeCount: detail.rows.length,
        evaluationCount: detail.evaluations.length,
        avgScore: scores.length
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0,
        successRate: scores.length
          ? Math.round((scores.filter((score) => score >= 50).length * 100) / scores.length)
          : 0,
      };
    });
  return response({
    data: rows,
    total: rows.length,
    clients: [{ id: SIMULATION_IDS.tenant, name: data.resources.tenants[0].name }],
  });
}

const TWO_FACTOR_DEFAULTS: TwoFactorSettingsFields = {
  enabled: false,
  code_length: 6,
  ttl_minutes: 10,
  resend_cooldown_seconds: 60,
  max_attempts: 5,
  lockout_threshold: 5,
  trusted_device_days: 30,
  template_mail_id: null,
};
const TWO_FACTOR_RANGES: Record<string, readonly [number, number]> = {
  code_length: [6, 10],
  ttl_minutes: [1, 60],
  resend_cooldown_seconds: [15, 600],
  max_attempts: [1, 20],
  lockout_threshold: [1, 50],
  trusted_device_days: [1, 365],
};

function handleSecuritySettings(
  data: SimulationData,
  path: string,
  method: Method,
  payload: JsonObject,
): SimulationResponse | undefined {
  // These are form acknowledgements, not authentication. Do not copy their payload into ANY state or response.
  if (/^(?:platform\/)?auth\/(forgot-password|reset-password)$/.test(path)) {
    if (method !== 'POST') return unsupported(method, path);
    return response({
      message:
        'Simulation : demande traitée localement, aucun mot de passe modifié ni e-mail envoyé.',
      simulation: true,
    });
  }
  let match = /^(?:platform\/)?users\/([^/]+)\/(password|reset-two-factor)$/.exec(path);
  if (match) {
    if (
      (match[2] === 'password' && method !== 'PATCH') ||
      (match[2] === 'reset-two-factor' && method !== 'POST')
    )
      return unsupported(method, path);
    find(data, 'users', match[1]);
    return response({
      message: 'Simulation : modification visuelle enregistrée. La sécurité réelle est inchangée.',
      simulation: true,
    });
  }
  match = /^platform\/(?:tenants\/([^/]+)\/)?two-factor-settings$/.exec(path);
  if (!match) return undefined;
  const tenantId = match[1] ?? null;
  if (tenantId) find(data, 'tenants', tenantId);
  const scope = tenantId ?? 'global';
  const empty = Object.fromEntries(
    Object.keys(TWO_FACTOR_DEFAULTS).map((key) => [key, null]),
  ) as TwoFactorSettings['overrides'];
  const overrides = { ...(data.twoFactorOverrides.get(scope) ?? empty) };
  if (method === 'PUT') {
    for (const key of Object.keys(TWO_FACTOR_DEFAULTS) as (keyof TwoFactorSettingsFields)[]) {
      if (!(key in payload)) continue;
      const value = payload[key];
      if (value !== null) {
        if (key === 'enabled' && typeof value !== 'boolean')
          invalid('enabled doit être un booléen.');
        if (key === 'template_mail_id') find(data, 'template-mails', text(value));
        const range = TWO_FACTOR_RANGES[key];
        if (
          range &&
          (!Number.isInteger(value) || number(value, -1) < range[0] || number(value) > range[1])
        )
          invalid(`${key} hors limites.`);
      }
      Object.assign(overrides, { [key]: value });
    }
    data.twoFactorOverrides.set(scope, overrides);
  } else if (method !== 'GET') return unsupported(method, path);
  const effective = { ...TWO_FACTOR_DEFAULTS };
  for (const source of [tenantId ? data.twoFactorOverrides.get('global') : undefined, overrides]) {
    for (const [key, value] of Object.entries(source ?? {}))
      if (value !== null) Object.assign(effective, { [key]: value });
  }
  return response({
    data: {
      tenant_id: tenantId,
      overrides,
      effective,
      updated_by: data.twoFactorOverrides.has(scope) ? data.cart.user_id : null,
      updated_at: data.twoFactorOverrides.has(scope) ? SIMULATION_DATE : null,
    } satisfies TwoFactorSettings,
  });
}

function scormPackage(data: SimulationData, id: string) {
  return (
    data.scormPackages.find((row) => row.id === id) ??
    fail(404, 'Simulation : package SCORM introuvable.')
  );
}

function attachScorm(data: SimulationData, entry: SimulationEntity, packageId: string): void {
  const pkg = scormPackage(data, packageId);
  if (find(data, 'content-types', text(entry.content_type_id)).module_type !== 'scorm')
    invalid('Un contenu SCORM est requis.');
  if (pkg.content_entry_id && pkg.content_entry_id !== entry.id)
    invalid('Ce package est déjà rattaché.');
  data.scormPackages
    .filter((row) => row.content_entry_id === entry.id)
    .forEach((row) => {
      row.content_entry_id = null;
    });
  pkg.content_entry_id = entry.id;
  entry.data = { ...object(entry.data), scorm_package_id: pkg.id };
}

function uploadScorm(data: SimulationData, body: RequestInit['body']): SimulationResponse {
  if (typeof FormData === 'undefined' || !(body instanceof FormData))
    invalid('Un formulaire multipart est attendu.');
  const file = body.get('file');
  if (!file || typeof file === 'string') invalid('Le fichier est requis.');
  // Only metadata. Never read, extract, persist or execute the supplied bytes.
  const pkg = {
    id: nextId(data),
    content_entry_id: null,
    status: 'ready' as const,
    title: 'SCORM démonstration',
    version: '1.2' as const,
    launch_path: 'simulation.html',
    failure_reason: null,
    original_filename: text(safeValue(file.name)),
    size_bytes: file.size,
    created_at: SIMULATION_DATE,
    updated_at: SIMULATION_DATE,
  };
  data.scormPackages.push(pkg);
  return response({ data: pkg }, 201);
}

function handleScorm(
  data: SimulationData,
  path: string,
  method: Method,
  payload: JsonObject,
  params: URLSearchParams,
): SimulationResponse | undefined {
  let match = /^platform\/scorm-packages\/([^/]+)$/.exec(path);
  if (match && method === 'GET') return response({ data: scormPackage(data, match[1]) });
  match = /^platform\/entries\/([^/]+)\/scorm-package$/.exec(path);
  if (match && method === 'POST') {
    const entry = find(data, 'entries', match[1]);
    attachScorm(data, entry, text(payload.scorm_package_id));
    return response({ data: entry });
  }
  match =
    /^enrollments\/([^/]+)\/courses\/([^/]+)\/entries\/([^/]+)\/scorm\/(launch|tracking|tracking\/sequence)$/.exec(
      path,
    );
  if (!match) return undefined;
  const [, enrollmentId, courseId, entryId, action] = match;
  if (method !== 'GET' && !(action === 'tracking' && method === 'PUT'))
    return unsupported(method, path);
  const competencyId =
    method === 'PUT' ? text(payload.competency_id) : (params.get('competency_id') ?? '');
  if (!competencyId) invalid('competency_id est requis.');
  const entry = validateEntry(data, enrollmentId, courseId, entryId, competencyId);
  const pkg = scormPackage(data, text(object(entry.data).scorm_package_id));
  if (pkg.content_entry_id !== entryId) fail(404, 'Simulation : package absent de ce contenu.');
  const nodeExecutionId = simulationExecutionId(data, enrollmentId, 'module', competencyId);
  if (action === 'launch')
    return response({
      data: {
        enrollment_id: enrollmentId,
        competency_id: competencyId,
        content_entry_id: entryId,
        scorm_package_id: pkg.id,
        version: pkg.version,
        launch_path: 'simulation.html',
        launch_url: SIMULATION_SCORM_LAUNCH,
        node_execution_id: nodeExecutionId,
      },
    });
  const key = `${enrollmentId}:${competencyId}:${entryId}`;
  const current: ApiScormTrackingState = data.scormTracking.get(key) ?? {
    enrollment_id: enrollmentId,
    competency_id: competencyId,
    content_entry_id: entryId,
    node_execution_id: nodeExecutionId,
    lesson_status: 'not_attempted',
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
  if (action === 'tracking/sequence')
    return response({
      data: {
        last_sequence: current.last_sequence,
        enrollment_id: enrollmentId,
        competency_id: competencyId,
        node_execution_id: nodeExecutionId,
      },
    });
  if (method === 'GET') return response({ data: current });
  // Real preview packages are read-only even if a stale caller tries a local commit.
  if (training?.source.isReadOnlyScorm(entryId)) return response({ data: current });
  if (
    !text(payload.commit_id) ||
    !Number.isInteger(payload.sequence) ||
    number(payload.sequence) < 1
  )
    invalid('Commit SCORM invalide.');
  // Retries and late commits cannot double-count time or regress completion.
  if (
    current.last_commit_id === payload.commit_id ||
    number(payload.sequence) <= current.last_sequence
  )
    return response({ data: current });
  if (
    ![
      'not_attempted',
      'incomplete',
      'completed',
      'passed',
      'failed',
      'browsed',
      'unknown',
    ].includes(text(payload.lesson_status))
  )
    invalid('Statut SCORM invalide.');
  for (const field of ['session_time', 'total_time', 'score_raw', 'score_min', 'score_max']) {
    if (
      field in payload &&
      (typeof payload[field] !== 'number' ||
        !Number.isFinite(payload[field]) ||
        (field.endsWith('time') && number(payload[field]) < 0))
    )
      invalid(`${field} invalide.`);
  }
  const next: ApiScormTrackingState = {
    ...current,
    lesson_status: payload.lesson_status as ApiScormTrackingState['lesson_status'],
    last_sequence: number(payload.sequence),
    last_commit_id: text(safeValue(payload.commit_id)).slice(0, 128),
    session_time: number(payload.session_time, current.session_time),
    total_time: Math.max(current.total_time, number(payload.total_time, current.total_time)),
    score_raw: typeof payload.score_raw === 'number' ? payload.score_raw : current.score_raw,
    score_min: typeof payload.score_min === 'number' ? payload.score_min : current.score_min,
    score_max: typeof payload.score_max === 'number' ? payload.score_max : current.score_max,
    cmi_data:
      'cmi_data' in payload ? object(safeValue(object(payload.cmi_data))) : current.cmi_data,
    updated_at: SIMULATION_DATE,
  };
  data.scormTracking.set(key, next);
  if (['completed', 'passed'].includes(next.lesson_status)) data.completedEntries.add(key);
  refreshEnrollment(data, enrollmentId);
  return response({ data: next });
}

/** A local transport, NOT a proxy. Errors reject with the same status/json shape as httpClient. */
/**
 * Local business API. A successful write marks the current data set as
 * changed (failures throw), so the UI can warn before a reload discards it.
 */
export async function handleSimulationRequest(
  url: string,
  options: RequestInit = {},
): Promise<SimulationResponse> {
  const data = state;
  const result = await dispatchSimulationRequest(url, options);
  // Attempt handlers mark only actual mutations (including expiry during GET).
  // Session lookups and completed/stale replays must remain read-only.
  const path = new URL(url, 'https://simulation.example.test/').pathname;
  const attemptRoute =
    /\/(?:evaluation-attempts\/|enrollments\/[^/]+\/evaluations\/[^/]+\/attempts(?:\/|$))/.test(
      path,
    );
  if (
    data &&
    state === data &&
    !attemptRoute &&
    (options.method ?? 'GET').toUpperCase() !== 'GET'
  ) {
    changedData.add(data);
  }
  return result;
}

async function dispatchSimulationRequest(
  url: string,
  options: RequestInit,
): Promise<SimulationResponse> {
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  let parsed: URL;
  try {
    parsed = new URL(url, 'https://simulation.example.test/');
  } catch {
    return fail(400, 'Simulation : URL invalide.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol))
    return fail(400, 'Simulation : protocole interdit.');
  const path = parsed.pathname.replace(/^\/api\/v1(?:\/|$)/, '/').replace(/^\/+|\/+$/g, '');
  const method = (options.method ?? 'GET').toUpperCase() as Method;
  const passwordForm = /^(?:platform\/)?auth\/(forgot-password|reset-password)$/.test(path);
  if (
    (!passwordForm &&
      /^(?:platform\/)?(?:auth(?:\/|$)|impersonations?(?:\/|$)|role-simulation(?:\/|$))/.test(
        path,
      )) ||
    /(?:^|\/)(?:logout|login)(?:\/|$)/.test(path)
  ) {
    return fail(
      403,
      'Simulation : opération de session réservée au gestionnaire d’authentification.',
      'SIMULATION_AUTH_FORBIDDEN',
    );
  }
  const data = state;
  if (!data)
    return fail(
      409,
      'Les données de simulation ne sont plus disponibles. Rechargez la page puis réessayez.',
      'SIMULATION_INACTIVE',
    );
  if (training) {
    await training.source.prepare(path, options.signal);
    if (state !== data)
      throw new DOMException('Changement de contexte de simulation', 'AbortError');
  }
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return unsupported(method, path);
  const params = parsed.searchParams;

  const previewLaunch =
    /^enrollments\/([^/]+)\/courses\/([^/]+)\/entries\/([^/]+)\/scorm\/launch$/.exec(path);
  if (training && previewLaunch && method === 'GET') {
    const [, enrollmentId, courseId, entryId] = previewLaunch;
    const competencyId = params.get('competency_id') ?? '';
    if (!competencyId) invalid('competency_id est requis.');
    const entry = validateEntry(data, enrollmentId, courseId, entryId, competencyId);
    const pkg = scormPackage(data, text(object(entry.data).scorm_package_id));
    if (pkg.content_entry_id !== entryId) fail(404, 'Simulation : package absent de ce contenu.');
    const launch = await training.source.launchScorm(enrollmentId, entryId, options.signal);
    if (state !== data)
      throw new DOMException('Changement de contexte de simulation', 'AbortError');
    return response({
      data: {
        ...launch,
        enrollment_id: enrollmentId,
        competency_id: competencyId,
        content_entry_id: entryId,
        scorm_package_id: pkg.id,
        node_execution_id: simulationExecutionId(data, enrollmentId, 'module', competencyId),
      },
    });
  }

  if (path === 'platform/scorm-packages' && method === 'POST')
    return uploadScorm(data, options.body);

  if (
    method === 'POST' &&
    /^(?:platform\/(?:media|inline-media|(?:learning-paths|competencies|certificates|template-mails)\/media)|(?:certificates|template-mails)\/media)$/.test(
      path,
    )
  ) {
    return upload(data, options.body);
  }
  let match = /^(?:platform\/)?users\/([^/]+)\/profile-photo$/.exec(path);
  if (match && method === 'POST') {
    const user = find(data, 'users', match[1]);
    const result = upload(data, options.body);
    user.profile_photo = object(result.json).data;
    return result;
  }
  const payload = readBody(options.body);
  const localForm = handleSecuritySettings(data, path, method, payload);
  if (localForm) return localForm;
  const legacy = handleLegacy(data, path, method, payload, params);
  if (legacy) return legacy;
  const notes = handleNotes(data, path, method, params);
  if (notes) return notes;
  const scorm = handleScorm(data, path, method, payload, params);
  if (scorm) return scorm;
  const dashboard = handleDashboard(data, path, method, params);
  if (dashboard) return dashboard;
  const enrollmentHistory = handleEnrollmentHistory(data, path, method, params);
  if (enrollmentHistory) return enrollmentHistory;

  if (/^carts(?:\/|$)/.test(path)) return handleCart(data, path, method, payload);
  if (/^orders(?:\/|$)/.test(path)) return handleOrders(data, path, method, payload, params);
  if (/^purchased-learning-paths(?:\/|$)/.test(path))
    return handlePurchases(data, path, method, params);
  if (path === 'enrollments') {
    if (method === 'GET')
      return listResponse(
        data.enrollments.map((row) => ({ ...row })),
        params,
      );
    if (method === 'POST') return createEnrollments(data, payload);
  }
  if (['me/enrollments', 'my-learning-paths'].includes(path) && method === 'GET') {
    return listResponse(
      data.enrollments
        .filter((row) => row.learner_id === SIMULATION_IDS.learner)
        .map((row) => {
          const learningPath = decorate(
            data,
            'learning-paths',
            find(data, 'learning-paths', row.learning_path_id),
          );
          return {
            ...row,
            progress_percent: summary(data, row.id).progress.percent,
            learning_path: {
              id: learningPath.id,
              name: learningPath.name,
              description: learningPath.description,
              image: learningPath.image,
              duration: learningPath.duration,
              category_id: learningPath.category_id,
              category_learning_path: learningPath.category_id
                ? { id: learningPath.category_id, name: learningPath.category_name }
                : null,
              totalModules: training
                ? number(find(data, 'learning-paths', row.learning_path_id).competencies_count)
                : objects(learningPath.competencies).length,
            },
          };
        }),
      params,
    );
  }
  match = /^enrollments\/([^/]+)\/(summary|evaluations)$/.exec(path);
  if (match && method === 'GET') {
    const registration = enrollment(data, match[1]);
    if (match[2] === 'summary') return response({ data: summary(data, registration.id) });
    return response({
      data: data.resources.evaluations
        .filter((row) => row.learning_path_id === registration.learning_path_id && row.is_published)
        .map((row) => {
          const attempts = data.attempts.filter(
            (attempt) =>
              attempt.enrollment_id === registration.id && attempt.evaluation_id === row.id,
          );
          const limit = attemptLimit(data, row);
          return {
            id: row.id,
            title: row.title,
            type: row.type,
            question_count: row.question_count,
            time_limit_minutes: evaluationTimeLimit(row),
            allow_review: true,
            max_attempts: limit,
            attempts_used: attempts.length,
            attempts_remaining: limit === null ? null : Math.max(0, limit - attempts.length),
            last_attempt_status: attempts.at(-1)?.status ?? null,
          };
        }),
    });
  }
  match =
    /^enrollments\/([^/]+)\/courses\/([^/]+)\/entries\/([^/]+)(?:\/time-sessions\/([^/]+))?$/.exec(
      path,
    );
  if (match && ((!match[4] && method === 'GET') || (match[4] && method === 'PUT'))) {
    const entry = validateEntry(
      data,
      match[1],
      match[2],
      match[3],
      match[4] ? text(payload.competency_id) : undefined,
    );
    if (match[4]) {
      if (!payload.competency_id || number(payload.time_spent, -1) < 0)
        invalid('Période de consultation invalide.');
      if (training?.source.isReadOnlyScorm(match[3])) return response(null, 204);
      data.timeSessions.set(`${match[1]}:${text(payload.competency_id)}:${match[3]}:${match[4]}`, {
        competency_id: text(payload.competency_id),
        started_at: text(safeValue(payload.started_at)),
        ended_at: text(safeValue(payload.ended_at)),
        time_spent: number(payload.time_spent),
      });
      refreshEnrollment(data, match[1]);
      return response(null, 204);
    }
    const contentType = find(data, 'content-types', text(entry.content_type_id));
    const fields = { ...object(entry.data) };
    for (const field of objects(contentType.fields)) {
      if (field.type !== 'media') continue;
      const name = text(field.name);
      const resolve = (value: unknown) =>
        data.resources.media.find(
          (media) => media.id === (typeof value === 'string' ? value : object(value).id),
        ) ?? null;
      fields[name] = Array.isArray(fields[name])
        ? (fields[name] as unknown[]).map(resolve).filter(Boolean)
        : resolve(fields[name]);
    }
    return response({
      data: {
        ...entry,
        data: fields,
        module_type: contentType.module_type,
        field_types: Object.fromEntries(
          objects(contentType.fields).map((field) => [text(field.name), field.type]),
        ),
      },
    });
  }
  match =
    /^enrollments\/([^/]+)\/competencies\/([^/]+)\/courses\/([^/]+)\/entries\/([^/]+)\/complete$/.exec(
      path,
    );
  if (match && method === 'POST') {
    validateEntry(data, match[1], match[3], match[4], match[2]);
    // Includes manual SCORM completion: only synthetic, in-memory enrollment
    // state changes. The package's tracking, scores and time remain discarded.
    data.completedEntries.add(`${match[1]}:${match[2]}:${match[4]}`);
    refreshEnrollment(data, match[1]);
    return response({ data: summary(data, match[1]).execution });
  }
  match = /^enrollments\/([^/]+)\/evaluations\/([^/]+)\/attempts(?:\/(session))?$/.exec(path);
  if (match && method === 'POST')
    return match[3]
      ? attemptSession(data, match[1], match[2], payload)
      : startAttempt(data, match[1], match[2], payload);
  match = /^evaluation-attempts\/([^/]+)$/.exec(path);
  if (match && method === 'GET') {
    const attemptId = match[1];
    const attempt = data.attempts.find((row) => row.id === attemptId);
    if (!attempt) fail(404, 'Simulation : tentative introuvable.');
    const now = new Date();
    if (attemptDue(attempt, now)) finalizeAttempt(data, attempt, 'timeout', now);
    return attemptResponse(data, attempt, now);
  }
  match = /^evaluation-attempts\/([^/]+)\/(?:quizzes\/([^/]+)\/answer|(submit))$/.exec(path);
  if (match && method === 'POST') {
    const [, attemptId, attemptQuizId, submit] = match;
    const attempt = data.attempts.find((row) => row.id === attemptId);
    if (!attempt) fail(404, 'Simulation : tentative introuvable.');
    const reason = payload.reason ?? 'manual';
    // page_reload exclu comme côté backend : seul le serveur le décide, via la
    // résolution de session. L'accepter ici laissait sauter le contrôle manual.
    if (submit && !['manual', 'timeout'].includes(text(reason)))
      invalid('Motif de finalisation inconnu.');
    const now = new Date();
    // Completed/due answers replay the whole attempt, never save a late draft.
    if (attemptDue(attempt, now)) finalizeAttempt(data, attempt, 'timeout', now);
    if (attempt.status !== 'completed') {
      if (attemptQuizId) saveAttemptAnswer(data, attempt, attemptQuizId, payload);
      else finalizeAttempt(data, attempt, reason as EvaluationCompletionReason, now);
    }
    return attemptResponse(data, attempt, now);
  }

  match = /^platform\/courses\/([^/]+)\/sections(?:\/([^/]+))?(?:\/(visibility))?$/.exec(path);
  if (match) {
    const [, courseId, sectionId, action] = match;
    find(data, 'courses', courseId);
    if (sectionId === 'reorder' && method === 'POST' && !action) {
      const rows = data.resources.sections.filter((row) => row.course_id === courseId);
      const ids = strings(payload.section_ids);
      if (
        ids.length !== rows.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !rows.some((row) => row.id === id))
      )
        invalid('La liste doit contenir toutes les sections du cours.');
      ids.forEach((id, rank) => {
        find(data, 'sections', id).rank = rank;
      });
      return response(null, 204);
    }
    if (action && method !== 'PATCH') return unsupported(method, path);
    return crud(data, { resource: 'sections' }, sectionId, method, payload, params, {
      course_id: courseId,
    });
  }
  match = /^platform\/course-sections\/([^/]+)\/entries$/.exec(path);
  if (match) {
    find(data, 'sections', match[1]);
    return crud(data, { resource: 'entries' }, undefined, method, payload, params, {
      course_section_id: match[1],
    });
  }
  match = /^platform\/entries\/([^/]+)\/move$/.exec(path);
  if (match && method === 'POST') {
    const entry = find(data, 'entries', match[1]);
    const target = find(data, 'sections', text(payload.course_section_id));
    if (target.course_id !== find(data, 'sections', text(entry.course_section_id)).course_id)
      invalid('Déplacement hors du cours interdit.');
    const rows = data.resources.entries
      .filter((row) => row.course_section_id === target.id && row.id !== entry.id)
      .sort((a, b) => number(a.rank) - number(b.rank));
    if (
      !Number.isInteger(payload.position) ||
      number(payload.position, -1) < 0 ||
      number(payload.position) > rows.length
    )
      invalid('Position invalide.');
    const source = entry.course_section_id;
    entry.course_section_id = target.id;
    rows.splice(number(payload.position), 0, entry);
    rows.forEach((row, rank) => {
      row.rank = rank;
    });
    if (source !== target.id)
      data.resources.entries
        .filter((row) => row.course_section_id === source)
        .sort((a, b) => number(a.rank) - number(b.rank))
        .forEach((row, rank) => {
          row.rank = rank;
        });
    return response(null, 204);
  }
  match = /^platform\/question-banks\/([^/]+)\/quizzes$/.exec(path);
  if (match) {
    find(data, 'question-banks', match[1]);
    return crud(data, { resource: 'quizzes', bare: true }, undefined, method, payload, params, {
      question_bank_id: match[1],
    });
  }
  match =
    /^platform\/learning-paths\/([^/]+)\/(evaluations|progression-rules)(?:\/(pool-check))?$/.exec(
      path,
    );
  if (match) {
    find(data, 'learning-paths', match[1]);
    if (match[3]) {
      if (method !== 'GET' || match[2] !== 'evaluations') return unsupported(method, path);
      const bankIds = (params.get('question_bank_ids') ?? '').split(',').filter(Boolean);
      const competencyIds = (params.get('competency_ids') ?? '').split(',').filter(Boolean);
      const byBank = Object.fromEntries(
        bankIds.map((id) => {
          const rows = data.resources.quizzes.filter(
            (quiz) =>
              quiz.question_bank_id === id &&
              (!competencyIds.length || competencyIds.includes(text(quiz.competency_id))),
          );
          return [id, { total: rows.length, available: rows.length }];
        }),
      );
      const total = Object.values(byBank).reduce((sum, count) => sum + count.total, 0);
      return response({ total, available: total, by_bank: byBank });
    }
    return crud(
      data,
      { resource: match[2] as 'evaluations' | 'progression-rules' },
      undefined,
      method,
      payload,
      params,
      { learning_path_id: match[1] },
    );
  }
  match = /^platform\/(question-banks|progression-rules)\/([^/]+)\/deactivate$/.exec(path);
  if (match && method === 'PATCH') {
    const row = find(data, match[1] as ResourceName, match[2]);
    row.is_active = false;
    return response(match[1] === 'question-banks' ? row : { data: row });
  }
  match = /^platform\/learning-paths\/([^/]+)\/competencies(?:\/([^/]+))?$/.exec(path);
  if (match) {
    const [, learningPathId, competencyId] = match;
    const row = find(data, 'learning-paths', learningPathId);
    const links = objects(row.competencies);
    if (!competencyId && method === 'POST') {
      const id = find(data, 'competencies', text(payload.competency_id)).id;
      if (!links.some((link) => link.competency_id === id))
        links.push({
          competency_id: id,
          position: links.length,
          location_x: payload.location_x ?? null,
          location_y: payload.location_y ?? null,
        });
      row.competencies = links;
      return response({ data: decorate(data, 'learning-paths', row) });
    }
    if (competencyId && (method === 'PATCH' || method === 'DELETE')) {
      const link = links.find((item) => item.competency_id === competencyId);
      if (!link) fail(404, 'Simulation : module non lié.');
      if (method === 'DELETE') {
        row.competencies = links.filter((item) => item !== link);
        return response(null, 204);
      }
      link.location_x = payload.location_x ?? null;
      link.location_y = payload.location_y ?? null;
      return response({ data: decorate(data, 'learning-paths', row) });
    }
    return unsupported(method, path);
  }
  match = /^platform\/learning-paths\/([^/]+)\/(mail-template|certificate)(?:\/(location))?$/.exec(
    path,
  );
  if (match) {
    const row = find(data, 'learning-paths', match[1]);
    const field = match[2] === 'mail-template' ? 'mail_template' : 'certificate';
    if (method === 'DELETE' && !match[3]) {
      row[field] = null;
      return response(null, 204);
    }
    if (method === 'POST' && !match[3]) {
      const target = find(
        data,
        field === 'certificate' ? 'certificates' : 'template-mails',
        text(payload[`${field}_id`]),
      );
      row[field] = {
        id: target.id,
        name: target.name,
        location_x: payload.location_x ?? null,
        location_y: payload.location_y ?? null,
      };
      return response({ data: decorate(data, 'learning-paths', row) });
    }
    if (method === 'PATCH' && match[3]) {
      if (!row[field]) fail(404, 'Simulation : modèle non lié.');
      row[field] = {
        ...object(row[field]),
        location_x: payload.location_x ?? null,
        location_y: payload.location_y ?? null,
      };
      return response({ data: decorate(data, 'learning-paths', row) });
    }
    return unsupported(method, path);
  }
  if (path === 'platform/learning-path-competencies' && method === 'GET')
    return response({
      data: data.resources.competencies.map((row) => ({
        id: row.id,
        shortname: row.shortname,
        category_id: row.category_id,
        courses: strings(row.course_ids).map((id) => ({ id })),
        courses_count: strings(row.course_ids).length,
        is_linked: data.resources['learning-paths'].some((path) =>
          objects(path.competencies).some((link) => link.competency_id === row.id),
        ),
      })),
    });
  match = /^platform\/competencies\/([^/]+)\/overview$/.exec(path);
  if (match && method === 'GET') {
    const row = find(data, 'competencies', match[1]);
    const courses = data.resources.courses
      .filter((course) => strings(row.course_ids).includes(course.id))
      .map((course) => ({ id: course.id, shortname: course.short_name }));
    const paths = data.resources['learning-paths']
      .filter((path) => objects(path.competencies).some((link) => link.competency_id === row.id))
      .map((path) => ({ id: path.id, name: path.name }));
    return response({
      data: {
        ...row,
        courses,
        learning_paths: paths,
        course_count: courses.length,
        learning_path_count: paths.length,
      },
    });
  }
  match =
    /^(platform\/competencies|(?:platform\/)?(?:certificates|template-mails))\/([^/]+)\/duplicate$/.exec(
      path,
    );
  if (match && method === 'POST') {
    const resource = RESOURCE_ROUTES[match[1]].resource;
    const original = find(data, resource, match[2]);
    const clone = JSON.parse(JSON.stringify(original)) as SimulationEntity;
    clone.id = nextId(data);
    clone.reference = `DEMO-${clone.id.slice(-6)}`;
    if (resource === 'competencies') {
      clone.shortname =
        text(payload.shortname) || `${text(original.shortname)} — copie démonstration`;
      clone.idnumber = `DEMO-${clone.id.slice(-6)}`;
    } else clone.name = `${text(original.name)} — copie démonstration`;
    data.resources[resource].push(clone);
    return response({ data: decorate(data, resource, clone) }, 201);
  }
  match = /^(?:platform\/)?certificates\/([^/]+)\/preview$/.exec(path);
  if (match && method === 'POST') {
    const certificate = find(data, 'certificates', match[1]);
    let body = text(certificate.body);
    const resolved = payload.resolve_variables === true;
    if (resolved) {
      const user = find(data, 'users', text(payload.user_id) || data.cart.user_id);
      const course = find(data, 'courses', text(payload.course_id) || SIMULATION_IDS.course);
      const variables: Record<string, unknown> = {
        'user.fullName': user.full_name,
        'user.firstName': user.first_name,
        'user.lastName': user.last_name,
        'user.email': user.email,
        'course.fullName': course.full_name,
        'course.shortName': course.short_name,
        'tenant.name': data.resources.tenants[0].name,
        'certificate.name': certificate.name,
        'certificate.reference': certificate.reference,
      };
      body = body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (placeholder, key: string) =>
        key in variables ? text(safeValue(variables[key])) : placeholder,
      );
    }
    return response({ data: { body: safeValue(body), resolved } });
  }
  match = /^groups\/([^/]+)\/members(?:\/([^/]+))?$/.exec(path);
  if (match) {
    const group = find(data, 'groups', match[1]);
    const members = objects(group.members);
    if (!match[2] && method === 'POST') {
      const user = find(data, 'users', text(payload.trainee_id));
      if (user.role !== Role.TRAINEE) invalid('Le membre doit être un apprenant.');
      if (!members.some((member) => member.trainee_id === user.id))
        members.push({
          id: nextId(data),
          trainee_id: user.id,
          created_at: SIMULATION_DATE,
        });
      group.members = members;
      return response({ data: group });
    }
    if (match[2] && method === 'DELETE') {
      const traineeId = match[2];
      if (!members.some((member) => member.trainee_id === traineeId))
        fail(404, 'Simulation : membre introuvable.');
      group.members = members.filter((member) => member.trainee_id !== traineeId);
      return response(null, 204);
    }
    return unsupported(method, path);
  }
  if (method === 'GET') {
    match = /^platform\/tenants\/([^/]+)\/template-mails$/.exec(path);
    if (match) {
      find(data, 'tenants', match[1]);
      return listResponse(data.resources['template-mails'], params);
    }
    if (path === 'reports')
      return listResponse(
        data.resources['learning-paths'].map((row) => ({
          id: row.id,
          title: `Rapport démonstration — ${text(row.name)}`,
          type: 'progression',
          tenantId: SIMULATION_IDS.tenant,
          createdAt: SIMULATION_DATE,
        })),
        params,
      );
    if (path === 'tenant/current') return response({ data: data.resources.tenants[0] });
    if (path === 'platform/field-types')
      return response({
        data: [
          'text',
          'textarea',
          'richtext',
          'number',
          'date',
          'select',
          'checkbox',
          'media',
          'relation',
        ],
      });
    if (path === 'platform/media-mime-types')
      return response({
        data: ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4', 'audio/mpeg'],
      });
    if (['platform/template-variables', 'template-variables'].includes(path))
      return response({
        data: {
          user: [
            {
              key: '{{user.fullName}}',
              label: 'Nom complet démonstration',
              category: 'user',
              template_type: 'both',
            },
          ],
          course: [
            {
              key: '{{course.fullName}}',
              label: 'Cours démonstration',
              category: 'course',
              template_type: 'both',
            },
          ],
          tenant: [
            {
              key: '{{tenant.name}}',
              label: 'Organisation démonstration',
              category: 'tenant',
              template_type: 'both',
            },
          ],
          ...(params.get('template_type') === 'mail'
            ? {}
            : {
                certificate: [
                  {
                    key: '{{certificate.name}}',
                    label: 'Attestation démonstration',
                    category: 'certificate',
                    template_type: 'attestation',
                  },
                ],
              }),
        },
      });
  }
  // Generic behavior is only reachable through exact, explicit resource roots above.
  for (const [root, spec] of Object.entries(RESOURCE_ROUTES)) {
    if (path === root && !spec.detailOnly)
      return crud(data, spec, undefined, method, payload, params);
    if (path.startsWith(`${root}/`)) {
      const id = path.slice(root.length + 1);
      if (
        id &&
        !id.includes('/') &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      ) {
        return crud(data, spec, id, method, payload, params);
      }
    }
  }
  return unsupported(method, path);
}
