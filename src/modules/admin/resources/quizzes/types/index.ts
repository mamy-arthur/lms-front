export type { Quiz } from '@/modules/shared/lib/normalizers';
export { normalizeQuiz } from '@/modules/shared/lib/normalizers';

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
