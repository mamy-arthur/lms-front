import type {
  ApiLearningPath,
  ApiLearningPathCategory,
} from '@/shared/types/learning-path.types';

export interface LearningPathImage {
  id: string;
  url: string;
  mimeType: string;
}

export interface LearningPathCompetency {
  competencyId: string;
  position: number;
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
  competencies: LearningPathCompetency[];
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
    competencies: api.competencies.map((c) => ({
      competencyId: c.competency_id,
      position: c.position,
    })),
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

export type {
  CreateLearningPathPayload,
  UpdateLearningPathPayload,
  CreateLearningPathCategoryPayload,
  UpdateLearningPathCategoryPayload,
} from '@/shared/types/learning-path.types';
