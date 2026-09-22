import { Role } from '@/shared/constants/roles';
import type { User } from '@/modules/admin/resources/users/types';
import type { Client } from '@/modules/admin/resources/clients';
import type { CompetencyApiResponse } from '@/modules/admin/resources/modules/types';
import type { ApiEvaluation } from '@/shared/api/evaluations.api';
import type { ApiCart } from '@/shared/types/cart.types';
import type { ApiContentEntry, ApiCourse, ApiCourseSection } from '@/shared/types/course.types';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import type { ApiEnrollment } from '@/shared/types/enrollment.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { ApiGroup } from '@/shared/types/group.types';
import type { ApiLearningPath } from '@/shared/types/learning-path.types';
import type { ApiOrder } from '@/shared/types/order.types';
import type { ApiQuestionBank, ApiQuizItem } from '@/shared/types/question-bank.types';
import type { ApiScormPackage } from '@/shared/api/scorm.api';
import type { ApiScormTrackingState } from '@/shared/api/portal-scorm.api';
import type { TwoFactorSettings } from '@/modules/admin/resources/two-factor/types';

/** Fixed UUIDs are deliberately unrelated to any real tenant or account. */
export const simulationId = (n: number): string =>
  `d3e00000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

export const simulationClientSlug = (name: string): string =>
  `demo-client-${Array.from(name.normalize('NFKC').trim().toLowerCase())
    .map((character) => character.codePointAt(0)!.toString(16))
    .join('-')}`;

export const SIMULATION_IDS = {
  tenant: simulationId(1),
  editor: simulationId(2),
  manager: simulationId(3),
  learner: simulationId(4),
  secondLearner: simulationId(5),
  admin: simulationId(6),
  client: simulationId(7),
  category: simulationId(10),
  learningPath: simulationId(20),
  secondLearningPath: simulationId(21),
  course: simulationId(30),
  section: simulationId(40),
  entry: simulationId(50),
  competency: simulationId(60),
  questionBank: simulationId(70),
  quiz: simulationId(80),
  evaluation: simulationId(90),
  contentType: simulationId(100),
  certificate: simulationId(110),
  mailTemplate: simulationId(120),
  group: simulationId(130),
  enrollment: simulationId(140),
  purchase: simulationId(150),
  cart: simulationId(160),
  scormCourse: simulationId(180),
  scormSection: simulationId(181),
  scormEntry: simulationId(182),
  scormType: simulationId(183),
  scormPackage: simulationId(184),
  scormCompetency: simulationId(185),
  scormEnrollment: simulationId(186),
} as const;

export const SIMULATION_DATE = '2026-09-18T09:00:00.000Z';
// A constant inert image: no object URLs, remote URLs, scripts, or uploaded file execution.
export const SIMULATION_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
/** Bundled, visible artwork for fictional formations, not a real tenant's media. */
export const SIMULATION_COVER_IMAGE = '/simulation/formation-cover.svg';
export const SIMULATION_HTML = '<p>Contenu fictif de démonstration. Aucune donnée réelle.</p>';
/** Fixed, scriptless iframe document: never an uploaded archive or a remote launch. */
export const SIMULATION_SCORM_LAUNCH = `data:text/html;charset=utf-8,${encodeURIComponent(
  '<!doctype html><html lang="fr"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; form-action \'none\'; base-uri \'none\'"><title>SCORM démonstration</title><h1>Lecteur SCORM — démonstration</h1><p>Contenu fictif local. Aucun fichier téléversé n’est exécuté.</p><p>Le suivi est simulé en mémoire, sans connexion à un serveur.</p></html>',
)}`;

export type SimulationEntity = { id: string; [key: string]: unknown };
export type ResourceName =
  | 'learning-paths'
  | 'learning-path-categories'
  | 'courses'
  | 'course-categories'
  | 'sections'
  | 'entries'
  | 'competencies'
  | 'competency-categories'
  | 'question-banks'
  | 'quizzes'
  | 'evaluations'
  | 'progression-rules'
  | 'users'
  | 'groups'
  | 'certificates'
  | 'template-mails'
  | 'content-types'
  | 'media'
  | 'tenants';

export interface SimulationPurchase {
  id: string;
  learning_path_id: string;
  purchased: number;
  created_at: string;
}

export interface SimulationData {
  role: Role;
  sequence: number;
  clients: Client[];
  resources: Record<ResourceName, SimulationEntity[]>;
  cart: ApiCart;
  orders: Array<ApiOrder & { items: ApiCart['items']; total: number; currency: string }>;
  enrollments: ApiEnrollment[];
  purchases: SimulationPurchase[];
  attempts: Array<ApiEvaluationAttempt & { enrollment_id: string }>;
  completedEntries: Set<string>;
  timeSessions: Map<string, Record<string, unknown>>;
  scormPackages: ApiScormPackage[];
  scormTracking: Map<string, ApiScormTrackingState>;
  twoFactorOverrides: Map<string, TwoFactorSettings['overrides']>;
  /** Catalog pricing and authorized cover only; never imports real learning content. */
  shopPrices: Map<string, { price: number; currency: string; image?: string }>;
}

const entity = <T extends { id: string }>(value: T): SimulationEntity => ({ ...value });

/** Defaults are independent of the seeds: creating a resource never copies its children. */
export function newSimulationEntity(resource: ResourceName, id: string): SimulationEntity {
  const common = { id, created_at: SIMULATION_DATE, updated_at: SIMULATION_DATE };
  const tenant = { tenant_id: SIMULATION_IDS.tenant };
  switch (resource) {
    case 'learning-paths':
      return {
        ...common,
        ...tenant,
        name: 'Parcours démonstration',
        description: SIMULATION_HTML,
        idnumber: `DEMO-${id.slice(-6)}`,
        category_id: null,
        price: 45,
        currency: 'EUR',
        image: null,
        published_at: null,
        validity: null,
        author_id: SIMULATION_IDS.editor,
        show_in_shop: false,
        is_published: false,
        is_sellable: false,
        duration: 30,
        competencies: [],
        evaluations: [],
        certificate: null,
        mail_template: null,
        is_locked: false,
      };
    case 'courses':
      return {
        ...common,
        ...tenant,
        created_by: SIMULATION_IDS.editor,
        full_name: 'Cours démonstration',
        short_name: 'Cours démonstration',
        id_number: null,
        category_id: null,
        category_name: null,
        visibility: 'DRAFT',
        description: SIMULATION_HTML,
        is_locked: false,
        lock_origins: [],
      };
    case 'learning-path-categories':
    case 'competency-categories':
    case 'course-categories':
      return {
        ...common,
        ...tenant,
        name: 'Catégorie démonstration',
        description: 'Catégorie fictive de démonstration',
        parent_id: null,
        children: [],
      };
    case 'sections':
      return {
        ...common,
        ...tenant,
        course_id: '',
        name: 'Section démonstration',
        rank: 0,
        is_hidden: false,
      };
    case 'entries':
      return {
        ...common,
        content_type_id: SIMULATION_IDS.contentType,
        course_section_id: '',
        rank: 0,
        content_type_version: 1,
        data: {},
        is_published: false,
      };
    case 'competencies':
      return {
        ...common,
        ...tenant,
        shortname: 'Module démonstration',
        idnumber: `DEMO-${id.slice(-6)}`,
        description: SIMULATION_HTML,
        category_id: null,
        category_name: null,
        courses_count: 0,
        courses: [],
        course_ids: [],
        is_locked: false,
        lock_origins: [],
      };
    case 'question-banks':
      return {
        ...common,
        title: 'Banque démonstration',
        description: 'Questions fictives de démonstration',
        idnumber: `DEMO-${id.slice(-6)}`,
        learning_path_ids: [],
        is_active: true,
      };
    case 'quizzes':
      return {
        ...common,
        question_bank_id: '',
        type: 'true_false',
        question: 'Ceci est une démonstration ?',
        idnumber: `DEMO-${id.slice(-6)}`,
        comment_if_correct: 'Bonne réponse de démonstration.',
        comment_if_incorrect: 'Réessayez dans cette démonstration.',
        competency_id: SIMULATION_IDS.competency,
        correct_answer: true,
      };
    case 'evaluations':
      return {
        ...common,
        learning_path_id: '',
        title: 'Évaluation démonstration',
        type: 'FINAL',
        question_bank_ids: [],
        question_count: 1,
        max_attempts: null,
        position: 0,
        location_x: null,
        location_y: null,
        preceding_competency_id: null,
        is_published: true,
        pool_size: 0,
        pool_insufficient: true,
      };
    case 'progression-rules':
      return {
        ...common,
        learning_path_id: '',
        source: null,
        condition: null,
        target_on_success: null,
        target_on_failure: null,
        max_attempts: null,
        target_on_exhausted: null,
        is_active: true,
      };
    case 'users':
      return {
        ...common,
        ...tenant,
        editor_id: SIMULATION_IDS.editor,
        client_id: SIMULATION_IDS.client,
        first_name: 'Alex',
        last_name: 'démonstration',
        full_name: 'Alex démonstration',
        email: `demo-${id.slice(-6)}@example.test`,
        role: Role.TRAINEE,
        is_active: true,
        profile_photo: null,
        address: null,
        zip_code: null,
        city: null,
        country: null,
        timezone: 'Europe/Paris',
        preferred_language: 'fr',
      };
    case 'groups':
      return {
        ...common,
        ...tenant,
        user_id: SIMULATION_IDS.manager,
        name: 'Groupe démonstration',
        members: [],
      };
    case 'certificates':
      return {
        ...common,
        ...tenant,
        name: 'Attestation démonstration',
        reference: `DEMO-${id.slice(-6)}`,
        status: true,
        setasdefault: false,
        body: SIMULATION_HTML,
      };
    case 'template-mails':
      return {
        ...common,
        ...tenant,
        name: 'Message démonstration',
        reference: `DEMO-${id.slice(-6)}`,
        status: true,
        subject: 'Bienvenue en démonstration',
        body: SIMULATION_HTML,
      };
    case 'content-types':
      return {
        ...common,
        module_type: 'page',
        title: 'Page démonstration',
        description: 'Type fictif de démonstration',
        is_active: true,
        status: 'active',
        version: 1,
        fields: [],
      };
    case 'media':
      return {
        ...common,
        url: SIMULATION_IMAGE,
        mime_type: 'image/png',
        original_name: 'image-demonstration.png',
        size_bytes: 68,
      };
    case 'tenants':
      return {
        ...common,
        name: 'Organisation démonstration',
        slug: 'demonstration',
        domain: 'demonstration.example.test',
        status: 'active',
        is_active: true,
        branding: {
          primary_color: '#2563eb',
          secondary_color: '#64748b',
          logo_url: SIMULATION_IMAGE,
          favicon_url: SIMULATION_IMAGE,
          fontFamily: 'Inter',
        },
        features: { certificates: true, liveSession: false, customDomain: false },
      };
  }
}

/** A fresh, fully disconnected graph for every role switch. No storage or browser globals. */
export function createSimulationFixtures(role: Role): SimulationData {
  const id = SIMULATION_IDS;
  const common = { created_at: SIMULATION_DATE, updated_at: SIMULATION_DATE };
  const users: User[] = [
    [id.admin, 'Admin', Role.SUPER_ADMIN],
    [id.editor, 'Éditeur', Role.EDITOR],
    [id.manager, 'Responsable', Role.CLIENT_MANAGER],
    [id.learner, 'Alex', Role.TRAINEE],
    [id.secondLearner, 'Sam', Role.TRAINEE],
  ].map(([userId, firstName, userRole]) => ({
    id: userId,
    tenant_id: id.tenant,
    editor_id: id.editor,
    client_id: userRole === Role.CLIENT_MANAGER || userRole === Role.TRAINEE ? id.client : null,
    first_name: firstName,
    last_name: 'démonstration',
    full_name: `${firstName} démonstration`,
    email: `demo-${userId.slice(-4)}@example.test`,
    role: userRole as Role,
    is_active: true,
    profile_photo: null,
    address: null,
    zip_code: null,
    city: null,
    country: null,
    timezone: 'Europe/Paris',
    preferred_language: 'fr',
    ...common,
  }));
  const visibleUsers = users.filter(
    (user) =>
      role === Role.SUPER_ADMIN ||
      (role === Role.EDITOR && user.role !== Role.SUPER_ADMIN) ||
      (role === Role.CLIENT_MANAGER && [Role.CLIENT_MANAGER, Role.TRAINEE].includes(user.role)) ||
      (role === Role.TRAINEE && user.id === id.learner),
  );
  const category = (resource: ResourceName) => ({
    ...newSimulationEntity(resource, id.category),
    name: 'Découverte démonstration',
  });
  const course = {
    id: id.course,
    tenant_id: id.tenant,
    created_by: id.editor,
    full_name: 'Premiers pas démonstration',
    short_name: 'Initiation démonstration',
    id_number: 'DEMO-COURS',
    category_id: id.category,
    category_name: 'Découverte démonstration',
    visibility: 'PUBLISHED',
    description: SIMULATION_HTML,
    is_locked: false,
    lock_origins: [],
    ...common,
  } satisfies ApiCourse;
  const competency = {
    id: id.competency,
    tenant_id: id.tenant,
    shortname: 'Découvrir démonstration',
    idnumber: 'DEMO-MODULE',
    description: SIMULATION_HTML,
    category_id: id.category,
    category_name: 'Découverte démonstration',
    courses_count: 1,
    course_ids: [id.course],
    courses: [
      {
        course_id: id.course,
        position: 0,
        full_name: course.full_name,
        category_name: course.category_name,
      },
    ],
    is_locked: false,
    lock_origins: [],
    ...common,
  } satisfies CompetencyApiResponse;
  const learningPath = {
    id: id.learningPath,
    tenant_id: id.tenant,
    name: 'Découverte guidée démonstration',
    description: SIMULATION_HTML,
    idnumber: 'DEMO-PARCOURS',
    category_id: id.category,
    category_name: 'Découverte démonstration',
    price: 45,
    currency: 'EUR',
    image: { id: simulationId(170), url: SIMULATION_COVER_IMAGE, mime_type: 'image/svg+xml' },
    published_at: SIMULATION_DATE,
    validity: null,
    author_id: id.editor,
    show_in_shop: true,
    is_published: true,
    is_sellable: true,
    duration: 30,
    competencies: [{ competency_id: id.competency, position: 0, location_x: 0, location_y: 150 }],
    evaluations: [],
    competencies_count: 1,
    mail_template: {
      id: id.mailTemplate,
      name: 'Bienvenue démonstration',
      location_x: 0,
      location_y: 0,
    },
    certificate: {
      id: id.certificate,
      name: 'Attestation démonstration',
      location_x: 0,
      location_y: 450,
    },
    is_locked: false,
    ...common,
  } satisfies ApiLearningPath;
  const section = {
    id: id.section,
    course_id: id.course,
    tenant_id: id.tenant,
    name: 'Introduction démonstration',
    rank: 0,
    is_hidden: false,
    ...common,
  } satisfies ApiCourseSection;
  const entry = {
    id: id.entry,
    course_section_id: id.section,
    content_type_id: id.contentType,
    rank: 0,
    content_type_version: 1,
    data: { title: 'Bienvenue démonstration', content: SIMULATION_HTML },
    is_published: true,
    ...common,
  } satisfies ApiContentEntry;
  const contentType = {
    id: id.contentType,
    module_type: 'page',
    title: 'Page démonstration',
    description: 'Page de texte fictif',
    is_active: true,
    version: 1,
    fields: [
      {
        field_id: simulationId(101),
        type: 'text',
        name: 'title',
        label: 'Titre',
        required: true,
        is_archived: false,
        accept: [],
        max_size_mb: null,
        multiple: false,
      },
      {
        field_id: simulationId(102),
        type: 'richtext',
        name: 'content',
        label: 'Contenu',
        required: true,
        is_archived: false,
        accept: [],
        max_size_mb: null,
        multiple: false,
      },
    ],
    ...common,
  } satisfies ContentTypeResource;
  const bank = {
    id: id.questionBank,
    title: 'Questions découverte démonstration',
    description: 'Banque fictive',
    idnumber: 'DEMO-BANQUE',
    learning_path_ids: [id.learningPath],
    is_active: true,
    ...common,
  } satisfies ApiQuestionBank;
  const quiz = {
    id: id.quiz,
    question_bank_id: id.questionBank,
    type: 'true_false',
    question: 'Ce parcours est-il une démonstration sans données réelles ?',
    idnumber: 'DEMO-QUESTION',
    comment_if_correct: 'Exactement !',
    comment_if_incorrect: 'Il s’agit bien d’une démonstration.',
    competency_id: id.competency,
    correct_answer: true,
    ...common,
  } satisfies ApiQuizItem;
  const evaluation = {
    id: id.evaluation,
    learning_path_id: id.learningPath,
    title: 'Bilan démonstration',
    type: 'FINAL',
    question_bank_ids: [id.questionBank],
    question_count: 1,
    max_attempts: null,
    position: 1,
    location_x: 0,
    location_y: 300,
    preceding_competency_id: id.competency,
    is_published: true,
    pool_size: 1,
    pool_insufficient: false,
    ...common,
  } satisfies ApiEvaluation;
  const group = {
    id: id.group,
    tenant_id: id.tenant,
    user_id: id.manager,
    name: 'Équipe démonstration',
    members: [{ id: simulationId(131), trainee_id: id.learner, created_at: SIMULATION_DATE }],
    ...common,
  } satisfies ApiGroup;
  const enrollment: ApiEnrollment = {
    id: id.enrollment,
    tenant_id: id.tenant,
    assigned_by: id.manager,
    learning_path_id: id.learningPath,
    learner_id: id.learner,
    status: 'not_started',
    enrolled_at: SIMULATION_DATE,
    started_at: null,
    completed_at: null,
    failure_reason: null,
    failed_at: null,
    ...common,
  };

  return {
    role,
    sequence: 1000,
    clients: [
      {
        id: id.client,
        tenant_id: id.tenant,
        name: 'Client démonstration',
        slug: simulationClientSlug('Client démonstration'),
        is_active: true,
        created_at: SIMULATION_DATE,
      },
    ],
    resources: {
      'learning-paths': [
        entity(learningPath),
        entity({
          ...learningPath,
          id: id.secondLearningPath,
          name: 'Approfondissement démonstration',
          idnumber: 'DEMO-PARCOURS-2',
          price: 75,
          competencies: [
            { competency_id: id.scormCompetency, position: 0, location_x: 0, location_y: 0 },
          ],
          competencies_count: 1,
          certificate: null,
          mail_template: null,
        }),
      ],
      'learning-path-categories': [category('learning-path-categories')],
      courses: [
        entity(course),
        entity({
          ...course,
          id: id.scormCourse,
          full_name: 'Lecteur SCORM démonstration',
          short_name: 'SCORM démonstration',
        }),
      ],
      'course-categories': [category('course-categories')],
      sections: [
        entity(section),
        entity({ ...section, id: id.scormSection, course_id: id.scormCourse }),
      ],
      entries: [
        entity(entry),
        entity({
          ...entry,
          id: id.scormEntry,
          course_section_id: id.scormSection,
          content_type_id: id.scormType,
          data: { title: 'SCORM démonstration', scorm_package_id: id.scormPackage },
        }),
      ],
      competencies: [
        entity(competency),
        entity({
          ...competency,
          id: id.scormCompetency,
          shortname: 'SCORM démonstration',
          course_ids: [id.scormCourse],
          courses: [],
        }),
      ],
      'competency-categories': [category('competency-categories')],
      'question-banks': [entity(bank)],
      quizzes: [entity(quiz)],
      evaluations: [entity(evaluation)],
      'progression-rules': [],
      users: visibleUsers.map(entity),
      groups: role === Role.TRAINEE ? [] : [entity(group)],
      certificates: [newSimulationEntity('certificates', id.certificate)],
      'template-mails': [newSimulationEntity('template-mails', id.mailTemplate)],
      'content-types': [
        entity(contentType),
        entity({
          ...contentType,
          id: id.scormType,
          module_type: 'scorm',
          title: 'SCORM démonstration',
          fields: [contentType.fields[0]],
        }),
      ],
      media: [newSimulationEntity('media', simulationId(170))],
      tenants: [newSimulationEntity('tenants', id.tenant)],
    },
    cart: {
      id: id.cart,
      tenant_id: id.tenant,
      user_id: role === Role.TRAINEE ? id.learner : role === Role.EDITOR ? id.editor : id.manager,
      status: 'active',
      currency: 'EUR',
      total: 0,
      items: [],
      ...common,
    },
    orders: [],
    enrollments: [
      enrollment,
      { ...enrollment, id: id.scormEnrollment, learning_path_id: id.secondLearningPath },
    ],
    purchases:
      role === Role.TRAINEE
        ? []
        : [
            {
              id: id.purchase,
              learning_path_id: id.learningPath,
              purchased: 12,
              created_at: SIMULATION_DATE,
            },
          ],
    attempts: [],
    completedEntries: new Set(),
    timeSessions: new Map(),
    shopPrices: new Map(),
    scormPackages: [
      {
        id: id.scormPackage,
        content_entry_id: id.scormEntry,
        status: 'ready',
        title: 'SCORM démonstration',
        version: '1.2',
        launch_path: 'simulation.html',
        failure_reason: null,
        original_filename: 'scorm-demonstration.zip',
        size_bytes: 0,
        ...common,
      },
    ],
    scormTracking: new Map(),
    twoFactorOverrides: new Map(),
  };
}
