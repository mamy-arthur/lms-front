// ─────────────────────────────────────────────────────────────────────────────
// Portal Summary — navigation skeleton returned by GET /enrollments/{enrollmentId}/summary
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiPortalEvalSummary {
  id: string;
  title: string;
}

export interface ApiPortalSummaryEntry {
  id: string;
  title: string | null;
}

export interface ApiPortalSummaryCourse {
  id: string;
  name: string;
  content_entries: ApiPortalSummaryEntry[];
}

export interface ApiPortalSummaryModule {
  id: string;
  name: string;
  courses: ApiPortalSummaryCourse[];
  evaluation: ApiPortalEvalSummary | null;
}

export interface ApiPortalLearningPathSummary {
  id: string;
  name: string;
  modules: ApiPortalSummaryModule[];
  final_evaluation: ApiPortalEvalSummary | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal Content Entry — full entry returned by GET /courses/{courseId}/entries/{entryId}
// ─────────────────────────────────────────────────────────────────────────────

export type PortalModuleType = 'page' | 'file' | 'folder' | 'url' | 'media' | 'scorm';

export interface ApiPortalContentEntry {
  id: string;
  content_type_id: string;
  /** ContentType module_type value from backend. */
  module_type: PortalModuleType | null;
  /** Field values keyed by field name (resolved, media/richtext included). */
  data: Record<string, unknown>;
  /** Maps field_name → field_type ('text' | 'richtext' | 'media' | 'url' | ...). */
  field_types: Record<string, string>;
  is_published: boolean;
}
