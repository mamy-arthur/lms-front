import { apiGet, apiPut } from '@/shared/lib/apiClient';

export type ScormVersion = '1.2' | '2004';

export type ScormLessonStatus =
  'not_attempted' | 'incomplete' | 'completed' | 'passed' | 'failed' | 'browsed' | 'unknown';

export interface ApiScormLaunch {
  content_entry_id: string;
  scorm_package_id: string;
  version: ScormVersion;
  launch_path: string;
  launch_url: string;
}

export interface ApiScormTrackingState {
  content_entry_id: string;
  lesson_status: ScormLessonStatus;
  score_raw: number | null;
  score_min: number | null;
  score_max: number | null;
  session_time: number;
  total_time: number;
  cmi_data: Record<string, unknown>;
  last_commit_id: string | null;
  last_sequence: number;
  updated_at: string | null;
}

export interface ScormTrackingCommitPayload {
  commit_id: string;
  sequence: number;
  lesson_status: ScormLessonStatus;
  score_raw?: number;
  score_min?: number;
  score_max?: number;
  session_time?: number;
  total_time?: number;
  cmi_data?: Record<string, unknown>;
}

const scormBase = (enrollmentId: string, courseId: string, entryId: string): string =>
  `enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}/scorm`;

/** Portal (stagiaire) SCORM launch + tracking — see API.md §22.9-22.10. */
export const portalScormApi = {
  launch: (enrollmentId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiScormLaunch }>(`${scormBase(enrollmentId, courseId, entryId)}/launch`),

  getTracking: (enrollmentId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiScormTrackingState }>(
      `${scormBase(enrollmentId, courseId, entryId)}/tracking`,
    ),

  commitTracking: (
    enrollmentId: string,
    courseId: string,
    entryId: string,
    payload: ScormTrackingCommitPayload,
  ) =>
    apiPut<{ data: ApiScormTrackingState }>(
      `${scormBase(enrollmentId, courseId, entryId)}/tracking`,
      payload,
    ),

  getTrackingSequence: (enrollmentId: string, courseId: string, entryId: string) =>
    apiGet<{ data: { last_sequence: number } }>(
      `${scormBase(enrollmentId, courseId, entryId)}/tracking/sequence`,
    ),
};
