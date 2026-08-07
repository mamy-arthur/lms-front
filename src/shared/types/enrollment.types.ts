export type EnrollmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired";

export interface ApiEnrollment {
  id: string;
  tenant_id: string;
  user_id: string;
  learning_path_id: string;
  learner_id: string;
  status: EnrollmentStatus;
  progress_percentage: number;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentsListParams {
  page?: number;
  per_page?: number;
  status?: EnrollmentStatus;
  learning_path_id?: string;
}

export interface ApiEnrollmentsListResponse {
  data: ApiEnrollment[];
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
