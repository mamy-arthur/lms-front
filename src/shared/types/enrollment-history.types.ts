import type { EnrollmentStatus } from '@/shared/types/enrollment.types';

export interface AttemptNodeReference {
  type: 'module' | 'evaluation';
  key: string;
  title: string;
}

export interface EnrollmentAttemptSummary {
  id: string;
  attempt_number: number;
  status: 'in_progress' | 'completed' | 'failed';
  available_at: string;
  started_at: string | null;
  ended_at: string | null;
  interruption_reason: {
    code: string;
    node: AttemptNodeReference | null;
    message: string;
  } | null;
  time_spent_seconds: number;
}

export interface EnrollmentAttemptCourse {
  id: string;
  title: string;
  position: number;
  status: 'completed' | 'in_progress' | 'not_started' | 'no_content';
  progress: { total: number; completed: number };
  tracked_time_seconds: number;
}

export type AttemptNodeStatus =
  | 'completed'
  | 'failed'
  | 'in_progress'
  | 'available'
  | 'carried_over'
  | 'to_redo'
  | 'locked'
  | 'skipped'
  | 'not_reached';

export interface EnrollmentAttemptNode extends AttemptNodeReference {
  position: number;
  display_status: AttemptNodeStatus;
  blocked_by: AttemptNodeReference | null;
  carried_over_from: { execution_id: string; attempt_number: number } | null;
  tracked_time_seconds: number;
  courses: EnrollmentAttemptCourse[];
  result: 'passed' | 'failed' | null;
  score: number | null;
  round_number: number | null;
  attempts_used: number | null;
  max_attempts: number | null;
  started_at: string | null;
  completed_at: string | null;
  elapsed_seconds: number | null;
}

export interface EnrollmentAttemptDetail {
  attempt: EnrollmentAttemptSummary;
  nodes: EnrollmentAttemptNode[];
}

export interface EnrollmentHistoryResponse {
  data: {
    enrollment: {
      id: string;
      learner_id: string;
      learning_path_id: string;
      status: EnrollmentStatus;
    };
    attempts: EnrollmentAttemptSummary[];
  };
  meta: { total: number; page: number; per_page: number };
}

export interface EnrollmentAttemptDetailResponse {
  data: EnrollmentAttemptDetail;
}
