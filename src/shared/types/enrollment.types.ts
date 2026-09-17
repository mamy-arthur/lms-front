export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'expired' | 'failed';

export interface ApiEnrollment {
  id: string;
  tenant_id: string;
  assigned_by: string;
  learning_path_id: string;
  learner_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentsListParams {
  page?: number;
  per_page?: number;
}

export interface ApiEnrollmentsListResponse {
  data: ApiEnrollment[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

/** Shape retourné par GET /purchased-learning-paths/{id}/enrollments/history */
export interface ApiEnrollmentHistoryWithLearner {
  id: string;
  learner_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  failed_at: string | null;
  expires_at: string | null;
  learner: {
    first_name: string;
    last_name: string;
    email: string;
    profile_photo: { url: string } | null;
  } | null;
}

export interface ApiEnrollmentsHistoryWithLearnerListResponse {
  data: ApiEnrollmentHistoryWithLearner[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

/** Au moins un de learner_ids / group_ids doit être fourni. */
export interface CreateEnrollmentPayload {
  learning_path_id: string;
  learner_ids?: string[];
  group_ids?: string[];
}

export interface CreateEnrollmentMeta {
  enrolled_count: number;
  skipped_count: number;
  skipped_learner_ids: string[];
}

export interface CreateEnrollmentResponse {
  message: string;
  data: ApiEnrollment[];
  meta: CreateEnrollmentMeta;
}

// Shape retourné par GET /me/enrollments (learning_path embarqué)
export interface ApiMeEnrollmentLearningPath {
  id: string;
  name: string;
  description: string | null;
  image: {
    id: string;
    url: string;
    mime_type: string;
  } | null;
  duration: number | null;
  category_learning_path: { id: string; name: string } | null;
  totalModules: number | null;
}

export interface ApiMeEnrollment {
  id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
  learning_path: ApiMeEnrollmentLearningPath;
}

export interface ApiMeEnrollmentsResponse {
  data: ApiMeEnrollment[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}
