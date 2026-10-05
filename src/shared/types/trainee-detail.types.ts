import type { ApiMeEnrollment, EnrollmentStatus } from './enrollment.types';

export type TraineeEnrollment = Omit<ApiMeEnrollment, 'learning_path'> & {
  learning_path: ApiMeEnrollment['learning_path'] | null;
  expires_at: string | null;
  completed_modules: number | null;
  total_modules: number | null;
  time_spent_seconds: number | null;
};

export interface TraineeEnrollmentsParams {
  page: number;
  per_page: number;
  q?: string;
  status?: EnrollmentStatus;
  sort_by: 'enrolled_at' | 'title';
  sort_dir: 'asc' | 'desc';
}

export interface TraineeEnrollmentsResponse {
  data: TraineeEnrollment[];
  meta: { total: number; page: number; per_page: number };
}
