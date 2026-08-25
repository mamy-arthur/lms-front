export interface Quiz {
  id: string;
  title: string;
  description: string;
  idnumber: string;
  learningPathIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function normalizeQuiz(raw: Record<string, unknown>): Quiz {
  const rawIds = raw.learning_path_ids;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    idnumber: String(raw.idnumber ?? ''),
    learningPathIds: Array.isArray(rawIds) ? rawIds.map(String) : [],
    isActive: Boolean(raw.is_active ?? true),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ''),
  };
}

export interface CreateQuizPayload {
  title: string;
  description?: string | null;
  learning_path_ids?: string[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string | null;
  learning_path_ids?: string[];
}

export interface QuizSearchParams {
  q?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
