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

export interface CreateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  is_final_evaluation: boolean;
  formation_id: string;
  tenant_id: string;
}

export interface UpdateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  is_final_evaluation: boolean;
  formation_id: string;
  tenant_id: string;
}

export interface QuizSearchParams {
  q?: string;
  formation_id?: string;
  tenant_id?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
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
