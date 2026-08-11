import type { ApiLearningPathImage } from '@/shared/types/learning-path.types';

export interface ApiPurchasedLearningPathNested {
  id: string;
  name: string;
  image: ApiLearningPathImage | null;
}

export interface ApiPurchasedLearningPath {
  id: string;
  tenant_id: string;
  user_id: string;
  purchased: number;
  learning_path: ApiPurchasedLearningPathNested;
  created_at: string;
  updated_at: string;
}

export interface PurchasedLearningPathListParams {
  page?: number;
  per_page?: number;
}

export interface ApiPurchasedLearningPathsResponse {
  data: ApiPurchasedLearningPath[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}
