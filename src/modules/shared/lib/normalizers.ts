export interface Module {
  id: string;
  name: string;
  identifier: string;
  description: string;
  category: string;
  tenantId: string;
  courseIds: string[];
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string;
  isFinalEvaluation: boolean;
  formationId: string;
  questionCount: number;
  activeQuestionCount: number;
  tenantId: string;
  updatedAt: string;
}

export function normalizeModule(raw: Record<string, unknown>): Module {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.fullName ?? ""),
    identifier: String(raw.identifier ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    courseIds: (() => {
      const ids = raw.courseIds ?? raw.course_ids;
      return Array.isArray(ids) ? ids.map(String) : [];
    })(),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

export function normalizeQuiz(raw: Record<string, unknown>): Quiz {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    title: String(raw.title ?? ""),
    slug: String(raw.slug ?? ""),
    description: String(raw.description ?? ""),
    isFinalEvaluation: Boolean(
      raw.isFinalEvaluation ?? raw.is_final_evaluation ?? false,
    ),
    formationId: String(raw.formationId ?? raw.formation_id ?? ""),
    questionCount: Number(raw.questionCount ?? raw.question_count ?? 0),
    activeQuestionCount: Number(
      raw.activeQuestionCount ?? raw.active_question_count ?? 0,
    ),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}
