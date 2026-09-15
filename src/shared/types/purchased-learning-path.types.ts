import type { EnrollmentStatus } from '@/shared/types/enrollment.types';
import type { ApiLearningPathImage } from '@/shared/types/learning-path.types';

export interface ApiPurchasedLearningPathNested {
  id: string;
  name: string;
  image: ApiLearningPathImage | null;
  category_id?: string | null;
  category_name?: string | null;
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
  enrollments_failed_count: number;
  learning_path: ApiPurchasedLearningPathNested;
  created_at: string;
  updated_at: string;
}

export interface PurchasedLearningPathListParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  category_ids?: string;
}

export interface PurchasedLearningPathEnrollmentsParams {
  status?: EnrollmentStatus;
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

export interface ApiPurchasedLearningPathLearner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo: { url: string } | null;
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    enrolled_at: string;
  } | null;
}

export interface ApiPurchasedLearningPathLearnersResponse {
  data: ApiPurchasedLearningPathLearner[];
  meta: { total: number; page: number; per_page: number };
}

export interface PurchasedLearningPathLearnersParams {
  page?: number;
  per_page?: number;
}
