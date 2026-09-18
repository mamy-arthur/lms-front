import DOMPurify from 'dompurify';
import { getHttpContentUrl } from '@/lib/utils';
import {
  newSimulationEntity,
  simulationId,
  SIMULATION_DATE,
  SIMULATION_IDS,
  type ResourceName,
  type SimulationData,
  type SimulationEntity,
} from './fixtures';

/** Owned by the caller, for one in-memory catalog/session only. */
export interface TrainingPreview {
  enrollmentPaths: Map<string, string>;
  /** Backend (not synthetic) learning-path IDs whose detail has been imported. */
  loadedPaths: Set<string>;
  pathIds: Map<string, string>;
  entityIds: Map<string, string>;
  /** Only SCORM entries imported through the authorized training graph. */
  scormEntries: Map<string, { pathId: string; entryId: string; packageId: string }>;
}

type Row = Record<string, unknown>;
const object = (value: unknown): Row =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.map(object) : []);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const identifier = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 100 &&
  !/[^a-zA-Z0-9-]/.test(value);
const nextId = (data: SimulationData): string => simulationId(data.sequence++);

// Both a reset list and an explicit boundary: no account, tenant, template or result imports.
const TRAINING_RESOURCES = [
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
] as const satisfies readonly ResourceName[];

/** Exact relative backend capability; no query, fragment, encoding, traversal or other origin. */
function mediaUrl(value: unknown, pathId: string, mediaId?: string): string {
  if (!identifier(pathId) || typeof value !== 'string') return '';
  const prefix = `/api/v1/role-simulation/training/learning-paths/${pathId}/media/`;
  const suffix = value.startsWith(prefix) ? value.slice(prefix.length) : '';
  return identifier(suffix) && (mediaId === undefined || suffix === mediaId) ? value : '';
}

/** Browser/client helper (jsdom in tests). Never falls back to unsanitized HTML on the server. */
function sanitizer(pathId: string) {
  if (typeof window === 'undefined') throw new Error('Training preview requires a DOM');
  // A private instance: do not add/remove hooks on RichTextRenderer's shared purifier.
  const purify = DOMPurify(window);
  if (!purify.isSupported) throw new Error('Training preview requires DOMPurify');
  purify.addHook('uponSanitizeAttribute', (node, event) => {
    if (event.attrName === 'src') {
      event.keepAttr = node.nodeName === 'IMG' && Boolean(mediaUrl(event.attrValue, pathId));
    }
  });
  const html = (value: string): string =>
    purify.sanitize(value, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'strong',
        'em',
        'b',
        'i',
        'u',
        's',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'div',
        'span',
        'sub',
        'sup',
        'hr',
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'caption',
        'img',
      ],
      ALLOWED_ATTR: ['src', 'alt', 'title', 'colspan', 'rowspan'],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
      // Disallow active containers and their contents, not just their opening/closing tags.
      FORBID_CONTENTS: [
        'script',
        'style',
        'iframe',
        'object',
        'embed',
        'form',
        'svg',
        'math',
        'template',
      ],
    });
  return (value: unknown, field = ''): unknown => {
    if (typeof value !== 'string') {
      return value === null ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
        ? value
        : null;
    }
    if (/(?:^|_)(?:url|src|href|poster|srcset)$/i.test(field)) return mediaUrl(value, pathId);
    // The portal also embeds *text* values starting with http. Empty, never '#simulation'.
    if (
      /^\s*(?:http|[a-z][a-z\d+.-]*:\/\/|javascript:|data:|blob:|file:|\/|\\|#|\.{1,2}\/)/i.test(
        value,
      )
    ) {
      return mediaUrl(value, pathId);
    }
    // Plain names/labels may equal real IDs or contain ampersands: do not remap or HTML-encode them.
    return /<[!/?a-z]/i.test(value) ? html(value) : value;
  };
}

type Sanitize = ReturnType<typeof sanitizer>;

/** Copy scalars only, never spread a backend entity (which could contain private expansions). */
function scalars(source: Row, fields: readonly string[], safe: Sanitize): Row {
  return Object.fromEntries(
    fields.filter((key) => key in source).map((key) => [key, safe(source[key], key)]),
  );
}

function localId(
  data: SimulationData,
  preview: TrainingPreview,
  scope: string,
  resource: string,
  realId: unknown,
): string {
  if (!identifier(realId)) return '';
  const key = `${scope}:${resource}:${realId}`;
  let id = preview.entityIds.get(key);
  if (!id) {
    id = nextId(data);
    preview.entityIds.set(key, id);
  }
  return id;
}

function upsert(data: SimulationData, resource: ResourceName, row: SimulationEntity): void {
  const index = data.resources[resource].findIndex((item) => item.id === row.id);
  if (index < 0) data.resources[resource].push(row);
  else data.resources[resource][index] = row;
}

function category(
  data: SimulationData,
  preview: TrainingPreview,
  resource: 'learning-path-categories' | 'course-categories' | 'competency-categories',
  source: Row,
  safe: Sanitize,
): Row {
  const id = localId(data, preview, '', resource, source.category_id);
  if (!id) return { category_id: null, category_name: null };
  const existing = data.resources[resource].find((row) => row.id === id);
  const name = text(safe(source.category_name)) || text(existing?.name);
  upsert(data, resource, {
    ...newSimulationEntity(resource, id),
    name,
    description: null,
  });
  return { category_id: id, category_name: name };
}

function image(
  data: SimulationData,
  preview: TrainingPreview,
  pathId: string,
  value: unknown,
): SimulationEntity | null {
  const source = object(value);
  if (!identifier(source.id)) return null;
  const url = mediaUrl(source.url, pathId, source.id);
  if (!url) return null;
  return {
    id: localId(data, preview, pathId, 'media', source.id),
    url,
    mime_type: text(source.mime_type),
  };
}

/** Replace only the fictional training graph; an empty catalog really is empty. No I/O. */
export function createTrainingPreview(
  data: SimulationData,
  paths: SimulationEntity[],
): TrainingPreview {
  // Check the client environment before resetting anything, including for an empty catalog.
  sanitizer('');
  const preview: TrainingPreview = {
    enrollmentPaths: new Map(),
    loadedPaths: new Set(),
    pathIds: new Map(),
    entityIds: new Map(),
    scormEntries: new Map(),
  };
  const replaced = new Set(data.resources['learning-paths'].map((row) => row.id));
  for (const resource of TRAINING_RESOURCES) data.resources[resource] = [];
  data.enrollments = [];
  data.purchases = [];
  data.attempts = [];
  data.completedEntries.clear();
  data.timeSessions.clear();
  data.scormPackages = [];
  data.scormTracking.clear();
  // Keep independently selected shop items/prices, but not dangling demo products.
  data.cart.items = data.cart.items.filter((item) => !replaced.has(item.learning_path_id));
  data.cart.total =
    Math.round(data.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) /
    100;

  for (const source of paths) {
    if (!identifier(source.id) || preview.pathIds.has(source.id)) continue;
    const safe = sanitizer(source.id);
    const id = localId(data, preview, '', 'learning-paths', source.id);
    const cover = image(data, preview, source.id, source.image);
    if (cover) upsert(data, 'media', cover);
    preview.pathIds.set(source.id, id);
    data.resources['learning-paths'].push({
      ...newSimulationEntity('learning-paths', id),
      name: '',
      description: null,
      duration: null,
      ...scalars(
        source,
        [
          'name',
          'description',
          'duration',
          'published_at',
          'competencies_count',
          'price',
          'currency',
          'validity',
        ],
        safe,
      ),
      ...category(data, preview, 'learning-path-categories', source, safe),
      image: cover,
      is_published: Boolean(source.published_at),
      is_sellable: false,
      show_in_shop: false,
    });
    const enrollmentId = nextId(data);
    data.enrollments.push({
      id: enrollmentId,
      learning_path_id: id,
      tenant_id: SIMULATION_IDS.tenant,
      assigned_by: SIMULATION_IDS.manager,
      learner_id: SIMULATION_IDS.learner,
      status: 'not_started',
      enrolled_at: SIMULATION_DATE,
      started_at: null,
      completed_at: null,
      failed_at: null,
      failure_reason: null,
      created_at: SIMULATION_DATE,
      updated_at: SIMULATION_DATE,
    });
    preview.enrollmentPaths.set(enrollmentId, source.id);
  }
  return preview;
}

/**
 * Merge training content only. IDs below a path are path-scoped, so shared real courses/media
 * cannot replace another preview's authorized URLs or invalidate its attempts/completions.
 * Catalog metadata is authoritative. Reimporting updates rows, never learner results.
 */
export function importTrainingPreview(
  data: SimulationData,
  preview: TrainingPreview,
  realPathId: string,
  resources: Partial<Record<ResourceName, SimulationEntity[]>>,
): void {
  const pathId = preview.pathIds.get(realPathId);
  const path = data.resources['learning-paths'].find((row) => row.id === pathId);
  const sourcePath = resources['learning-paths']?.find((row) => row.id === realPathId);
  if (!path || !sourcePath) throw new Error('Training preview path is absent from catalog/detail');
  const safe = sanitizer(realPathId);
  const id = (resource: string, value: unknown): string =>
    resource === 'learning-paths'
      ? (preview.pathIds.get(text(value)) ?? '')
      : localId(data, preview, realPathId, resource, value);
  const refs = (resource: string, value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => id(resource, item)).filter(Boolean) : [];
  const defaults = (resource: ResourceName, source: Row, fields: string[]): SimulationEntity => ({
    ...newSimulationEntity(resource, id(resource, source.id)),
    ...scalars(source, fields, safe),
  });
  const input = (resource: ResourceName): SimulationEntity[] =>
    (resources[resource] ?? []).filter((row) => identifier(row.id));
  const categorized = (resource: 'courses' | 'competencies', source: Row): Row => {
    const name = resource === 'courses' ? 'course-categories' : 'competency-categories';
    const metadata = input(name).find((row) => row.id === source.category_id);
    return category(
      data,
      preview,
      name,
      {
        category_id: source.category_id,
        category_name: source.category_name ?? metadata?.name,
      },
      safe,
    );
  };

  for (const source of input('media')) {
    const media = image(data, preview, realPathId, source);
    // Omit blocked media altogether: even an empty PDF URL could create a same-page iframe.
    if (media)
      upsert(data, 'media', {
        ...newSimulationEntity('media', media.id),
        ...scalars(source, ['original_name', 'size_bytes'], safe),
        ...media,
      });
  }
  for (const source of input('content-types')) {
    upsert(data, 'content-types', {
      ...defaults('content-types', source, [
        'module_type',
        'title',
        'description',
        'is_active',
        'version',
      ]),
      fields: rows(source.fields).map((field) => ({
        ...scalars(
          field,
          ['type', 'name', 'label', 'required', 'is_archived', 'max_size_mb', 'multiple'],
          safe,
        ),
        field_id: id('fields', field.field_id ?? field.id) || nextId(data),
        accept: Array.isArray(field.accept) ? field.accept.map((value) => text(safe(value))) : [],
      })),
    });
  }
  for (const source of input('courses')) {
    upsert(data, 'courses', {
      ...defaults('courses', source, ['full_name', 'short_name', 'visibility', 'description']),
      ...categorized('courses', source),
    });
  }
  for (const source of input('competencies')) {
    const courseIds = refs(
      'courses',
      source.course_ids ?? rows(source.courses).map((row) => row.course_id),
    );
    upsert(data, 'competencies', {
      ...defaults('competencies', source, ['shortname', 'description']),
      ...categorized('competencies', source),
      course_ids: courseIds,
      courses_count: courseIds.length,
      courses: courseIds.map((courseId, position) => {
        const course = data.resources.courses.find((row) => row.id === courseId);
        return {
          course_id: courseId,
          position,
          full_name: course?.full_name,
          category_name: course?.category_name,
        };
      }),
    });
  }
  for (const source of input('sections')) {
    upsert(data, 'sections', {
      ...defaults('sections', source, ['name', 'rank', 'is_hidden']),
      course_id: id('courses', source.course_id),
    });
  }
  for (const source of input('entries')) {
    const entryId = id('entries', source.id);
    const typeId = id('content-types', source.content_type_id);
    const type = data.resources['content-types'].find((row) => row.id === typeId);
    const sourceData = object(source.data);
    const fields: Row = {};
    // Only declared field data plus the conventional title, never arbitrary nested expansions.
    if ('title' in sourceData) fields.title = safe(sourceData.title);
    for (const field of rows(type?.fields)) {
      const name = text(field.name);
      if (
        !name ||
        ['__proto__', 'prototype', 'constructor'].includes(name) ||
        !(name in sourceData)
      )
        continue;
      const value = sourceData[name];
      if (field.type === 'media') {
        const resolve = (item: unknown): string | null => {
          const mediaId = id('media', typeof item === 'string' ? item : object(item).id);
          return data.resources.media.some((media) => media.id === mediaId) ? mediaId : null;
        };
        fields[name] = Array.isArray(value) ? value.map(resolve).filter(Boolean) : resolve(value);
      } else if (field.type === 'relation') {
        fields[name] = Array.isArray(value)
          ? refs('relations', value)
          : id('relations', typeof value === 'string' ? value : object(value).id) || null;
      } else if (
        type?.module_type === 'url' &&
        (field.type === 'url' ||
          (field.type === 'text' &&
            name !== 'title' &&
            (name === 'url' || /^\s*https?:/i.test(text(value)))))
      ) {
        // Only the URL module may embed a declared external web resource. Keep
        // richtext, arbitrary text and media under their existing stricter policy.
        const url = getHttpContentUrl(value);
        const host = url ? new URL(url).hostname.replace(/\.$/, '') : '';
        fields[name] =
          host && host !== window.location.hostname.replace(/\.$/, '') ? url : '';
      } else {
        fields[name] = field.type === 'url' ? mediaUrl(value, realPathId) : safe(value, name);
      }
    }
    if (type?.module_type === 'scorm' && identifier(sourceData.scorm_package_id)) {
      const packageId = id('scorm-packages', sourceData.scorm_package_id);
      fields.scorm_package_id = packageId;
      preview.scormEntries.set(entryId, {
        pathId: realPathId,
        entryId: source.id,
        packageId: sourceData.scorm_package_id,
      });
      if (!data.scormPackages.some((pkg) => pkg.id === packageId)) {
        data.scormPackages.push({
          id: packageId,
          content_entry_id: entryId,
          status: 'ready',
          title: text(fields.title) || 'SCORM démonstration',
          version: '1.2',
          launch_path: 'simulation.html',
          failure_reason: null,
          original_filename: 'scorm-demonstration.zip',
          size_bytes: 0,
          created_at: SIMULATION_DATE,
          updated_at: SIMULATION_DATE,
        });
      }
    }
    upsert(data, 'entries', {
      ...defaults('entries', source, ['rank', 'content_type_version', 'is_published']),
      course_section_id: id('sections', source.course_section_id),
      content_type_id: typeId,
      data: fields,
    });
  }
  for (const source of input('question-banks')) {
    upsert(data, 'question-banks', {
      ...defaults('question-banks', source, ['title', 'description', 'is_active']),
      learning_path_ids: refs('learning-paths', source.learning_path_ids),
    });
  }
  for (const source of input('quizzes')) {
    const quiz = defaults('quizzes', source, [
      'type',
      'question',
      'comment_if_correct',
      'comment_if_incorrect',
      'correct_answer',
    ]);
    quiz.question_bank_id = id('question-banks', source.question_bank_id);
    quiz.competency_id = id('competencies', source.competency_id) || null;
    if (Array.isArray(source.options))
      quiz.options = rows(source.options).map((option, index) => ({
        ...scalars(option, ['label', 'is_correct', 'weight_percentage'], safe),
        id: id(`quiz-options:${source.id}`, option.id ?? `option-${index}`),
      }));
    if (Array.isArray(source.pairs))
      quiz.pairs = rows(source.pairs).map((pair) => scalars(pair, ['left', 'right'], safe));
    upsert(data, 'quizzes', quiz);
  }
  for (const source of input('evaluations')) {
    if (source.learning_path_id && source.learning_path_id !== realPathId) continue;
    upsert(data, 'evaluations', {
      ...defaults('evaluations', source, [
        'title',
        'type',
        'question_count',
        'max_attempts',
        'position',
        'location_x',
        'location_y',
        'is_published',
      ]),
      learning_path_id: path.id,
      question_bank_ids: refs('question-banks', source.question_bank_ids),
      preceding_competency_id: id('competencies', source.preceding_competency_id) || null,
    });
  }
  const node = (value: unknown): Row | null => {
    const source = object(value);
    const resource =
      source.type === 'module'
        ? 'competencies'
        : source.type === 'evaluation'
          ? 'evaluations'
          : source.type === 'certificate'
            ? 'certificates'
            : null;
    const nodeId = resource ? id(resource, source.id) : '';
    return nodeId ? { type: source.type, id: nodeId } : null;
  };
  for (const source of input('progression-rules')) {
    if (source.learning_path_id && source.learning_path_id !== realPathId) continue;
    upsert(data, 'progression-rules', {
      ...defaults('progression-rules', source, ['max_attempts', 'is_active']),
      learning_path_id: path.id,
      source: node(source.source),
      condition: scalars(
        object(source.condition),
        ['type', 'rule_type', 'min_score_percentage'],
        safe,
      ),
      target_on_success: node(source.target_on_success),
      target_on_failure: node(source.target_on_failure),
      target_on_exhausted: node(source.target_on_exhausted),
    });
  }
  // Do not let a detail payload replace the catalog's title, category or authorized cover.
  path.competencies = rows(sourcePath.competencies)
    .map((link) => ({
      ...scalars(link, ['position', 'location_x', 'location_y'], safe),
      competency_id: id('competencies', link.competency_id),
    }))
    .filter((link) => link.competency_id);
  path.competencies_count = (path.competencies as Row[]).length;
  path.evaluations = data.resources.evaluations.filter((row) => row.learning_path_id === path.id);
  preview.loadedPaths.add(realPathId);
}
