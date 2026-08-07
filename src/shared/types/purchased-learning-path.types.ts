import type { ApiLearningPathImage } from "@/shared/types/learning-path.types";

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
  used: number;
  credits_available: number;
  enrollments_not_started_count: number;
  enrollments_in_progress_count: number;
  enrollments_completed_count: number;
  enrollments_expired_count: number;
  learning_path: ApiPurchasedLearningPathNested;
  created_at: string;
  updated_at: string;
}

export interface PurchasedLearningPathListParams {
  page?: number;
  per_page?: number;
}

export interface PurchasedLearningPathEnrollmentsParams {
  status?: string;
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
