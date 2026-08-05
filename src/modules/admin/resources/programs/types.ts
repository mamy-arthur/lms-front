import type { Edge, Node } from '@xyflow/react';
import type { StepNodeData, EdgeRuleData } from './components/ProgramFlow';

// ─── Legacy form values (formerly in ProgramFormPanel) ───────────────────────

export type ProgramFormValues = {
  name: string;
  description: string;
  visible: boolean;
  deadline: Date | null | undefined;
  category: string;
  image: string | null;
  publishedAt: Date | null | undefined;
  author: string;
  cost: string;
  currency: string;
};

// ─── Legacy flow types (ProgramFlow) ─────────────────────────────────────────

export type StoredFlowData = {
  nodes: Node<StepNodeData, 'programStep'>[];
  edges: Edge<EdgeRuleData>[];
  nodeOrder: string[];
};

export type StoredProgram = {
  id: string;
  status: 'Publié' | 'Brouillon' | 'Archivé';
  formValues: ProgramFormValues;
  flow: StoredFlowData;
  createdAt: string;
  updatedAt: string;
};

// ─── Learning Path domain types ───────────────────────────────────────────────

export type {
  ApiLearningPath,
  ApiLearningPathCategory,
  ApiLearningPathImage,
  ApiLearningPathCompetency,
  ApiLearningPathEvaluation,
  ApiUploadedMedia,
  CreateLearningPathPayload,
  UpdateLearningPathPayload,
  CreateLearningPathCategoryPayload,
  UpdateLearningPathCategoryPayload,
  LinkCompetencyPayload,
} from '@/shared/types/learning-path.types';

import type {
  ApiLearningPath,
  ApiLearningPathCategory,
  ApiLearningPathEvaluation,
} from '@/shared/types/learning-path.types';

export interface LearningPathImage {
  id: string;
  url: string;
  mimeType: string;
}

export interface LearningPathCompetency {
  competencyId: string;
  position: number;
  locationX: number | null;
  locationY: number | null;
}

export interface LearningPathEvaluation {
  id: string;
  title: string;
  position: number;
  precedingCompetencyId: string | null;
}

export interface LearningPath {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  idnumber: string | null;
  categoryId: string | null;
  price: number | null;
  currency: string | null;
  image: LearningPathImage | null;
  publishedAt: string | null;
  authorId: string | null;
  showInShop: boolean;
  isPublished: boolean;
  isSellable: boolean;
  /** Durée estimée du parcours en minutes */
  duration: number | null;
  competencies: LearningPathCompetency[];
  evaluations: LearningPathEvaluation[];
  /** Mail template attached as the first node — id + name only, null if none attached yet. */
  mailTemplate?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathCategory {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizeLearningPath(api: ApiLearningPath): LearningPath {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    name: api.name,
    description: api.description,
    idnumber: api.idnumber,
    categoryId: api.category_id,
    price: api.price,
    currency: api.currency,
    image: api.image
      ? { id: api.image.id, url: api.image.url, mimeType: api.image.mime_type }
      : null,
    publishedAt: api.published_at,
    authorId: api.author_id,
    showInShop: api.show_in_shop,
    isPublished: api.is_published,
    isSellable: api.is_sellable,
    duration: api.duration ?? null,
    competencies: api.competencies.map((c) => ({
      competencyId: c.competency_id,
      position: c.position,
      locationX: c.location_x ?? null,
      locationY: c.location_y ?? null,
    })),
    evaluations: (api.evaluations ?? []).map((e: ApiLearningPathEvaluation) => ({
      id: e.id,
      title: e.title,
      position: e.position,
      precedingCompetencyId: e.preceding_competency_id,
    })),
    mailTemplate: api.mail_template ?? null,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function normalizeLearningPathCategory(api: ApiLearningPathCategory): LearningPathCategory {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    name: api.name,
    description: api.description,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}
