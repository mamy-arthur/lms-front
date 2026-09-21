import { apiGet, apiPut } from '@/shared/lib/apiClient';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';

export type ScormVersion = '1.2' | '2004';

export type ScormLessonStatus =
  'not_attempted' | 'incomplete' | 'completed' | 'passed' | 'failed' | 'browsed' | 'unknown';

export interface ApiScormLaunch {
  enrollment_id: string;
  competency_id: string;
  content_entry_id: string;
  scorm_package_id: string;
  version: ScormVersion;
  launch_path: string;
  launch_url: string;
  /** Visite propagée par le token de lancement. */
  node_execution_id: string;
  read_only?: boolean;
}

export interface ApiScormTrackingState {
  enrollment_id: string;
  competency_id: string;
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
  node_execution_id: string;
}

export interface ScormTrackingCommitPayload extends ExecutionMutationContext {
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

/**
 * Contexte commun aux quatre routes SCORM. `competency_id` et
 * `node_execution_id` sont tous deux obligatoires : ils isolent le runtime de la
 * visite en cours. Un rejeu conserve la visite d'origine, jamais la courante.
 */
export interface ScormRequestContext {
  enrollmentId: string;
  competencyId: string;
  courseId: string;
  entryId: string;
  nodeExecutionId: string;
}

/** Portal (stagiaire) SCORM launch + tracking — see API.md §22.9-22.10. */
export const portalScormApi = {
  launch: ({
    enrollmentId,
    competencyId,
    courseId,
    entryId,
    nodeExecutionId,
  }: ScormRequestContext) =>
    apiGet<{ data: ApiScormLaunch }>(`${scormBase(enrollmentId, courseId, entryId)}/launch`, {
      competency_id: competencyId,
      node_execution_id: nodeExecutionId,
    }),

  getTracking: ({
    enrollmentId,
    competencyId,
    courseId,
    entryId,
    nodeExecutionId,
  }: ScormRequestContext) =>
    apiGet<{ data: ApiScormTrackingState }>(
      `${scormBase(enrollmentId, courseId, entryId)}/tracking`,
      { competency_id: competencyId, node_execution_id: nodeExecutionId },
    ),

  commitTracking: (
    { enrollmentId, competencyId, courseId, entryId, nodeExecutionId }: ScormRequestContext,
    payload: ScormTrackingCommitPayload,
  ) =>
    apiPut<{ data: ApiScormTrackingState }>(
      `${scormBase(enrollmentId, courseId, entryId)}/tracking`,
      { ...payload, competency_id: competencyId, node_execution_id: nodeExecutionId },
    ),

  getTrackingSequence: ({
    enrollmentId,
    competencyId,
    courseId,
    entryId,
    nodeExecutionId,
  }: ScormRequestContext) =>
    apiGet<{
      data: {
        last_sequence: number;
        enrollment_id: string;
        competency_id: string;
        node_execution_id: string;
      };
    }>(`${scormBase(enrollmentId, courseId, entryId)}/tracking/sequence`, {
      competency_id: competencyId,
      node_execution_id: nodeExecutionId,
    }),
};
