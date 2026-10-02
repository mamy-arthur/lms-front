import type { EnrollmentStatus } from './enrollment.types';

export type DashboardFormationSort = 'enrolled' | 'completion' | 'failed';
export type DashboardStatusCounts = Record<EnrollmentStatus, number>;
/** Le backend peut omettre les statuts sans inscription : la normalisation les remet à 0. */
export type ApiDashboardStatusCounts = Partial<DashboardStatusCounts>;

export interface ApiDashboardOverview {
  catalog: { total: number; published: number; unpublished: number };
  students: {
    unique_students: number;
    total_enrollments: number;
    status_counts: ApiDashboardStatusCounts;
  };
}

export interface ApiDashboardFormation {
  id: string;
  name: string;
  is_published: boolean;
  total_enrollments: number;
  completion_rate: number;
  status_counts: ApiDashboardStatusCounts;
}

export interface DashboardFormationsParams {
  q?: string;
  sort_by: DashboardFormationSort;
  page: number;
  per_page: number;
}

export interface ApiDashboardPage<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export interface ApiDashboardEnrollment {
  id: string;
  learner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string | null;
  attempts_count: number;
  time_spent_seconds: number;
}

export interface DashboardEnrollmentsParams {
  status?: EnrollmentStatus;
  q?: string;
  page?: number;
  per_page?: number;
  started_at_from?: string;
  started_at_to?: string;
  ended_at_from?: string;
  ended_at_to?: string;
  expires_at_from?: string;
  expires_at_to?: string;
}

export interface ApiDashboardEnrollmentsPage extends ApiDashboardPage<ApiDashboardEnrollment> {
  meta: ApiDashboardPage<ApiDashboardEnrollment>['meta'] & {
    summary: { total: number; status_counts: ApiDashboardStatusCounts };
    formation: { duration_minutes: number | null };
  };
}
