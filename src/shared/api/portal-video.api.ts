import { httpClient } from '@/shared/lib/apiClient';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';

export type WatchedRange = [number, number];
export interface VideoProgressContext {
  enrollmentId: string;
  competencyId: string;
  nodeExecutionId: string;
  courseId: string;
  entryId: string;
  mediaId: string;
}
export interface VideoProgress {
  node_id: string;
  node_execution_id: string;
  position: number;
  duration: number;
  watched_ranges: WatchedRange[];
  watched_seconds: number;
  version: number;
  last_commit_id: string | null;
}
export interface VideoProgressPayload extends ExecutionMutationContext {
  competency_id: string;
  position: number;
  duration: number;
  watched_ranges: WatchedRange[];
  version: number;
  commit_id: string;
}

function path(context: VideoProgressContext) {
  return `enrollments/${context.enrollmentId}/courses/${context.courseId}/entries/${context.entryId}/videos/${context.mediaId}/progress`;
}

export const portalVideoApi = {
  get: async (context: VideoProgressContext, signal: AbortSignal): Promise<VideoProgress> => {
    const { json } = await httpClient(
      `${path(context)}?competency_id=${encodeURIComponent(context.competencyId)}&node_execution_id=${encodeURIComponent(context.nodeExecutionId)}`, { signal },
    );
    return (json as { data: VideoProgress }).data;
  },
  save: async (context: VideoProgressContext, payload: VideoProgressPayload, signal: AbortSignal, keepalive: boolean): Promise<VideoProgress> => {
    const { json } = await httpClient(path(context), {
      method: 'PUT', body: JSON.stringify(payload), signal, keepalive,
    });
    return (json as { data: VideoProgress }).data;
  },
};