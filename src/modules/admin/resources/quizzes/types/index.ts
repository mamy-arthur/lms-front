export type { Quiz } from '@/modules/shared/lib/normalizers';
export { normalizeQuiz } from '@/modules/shared/lib/normalizers';

export interface CreateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  is_final_evaluation: boolean;
  formation_id: string;
}

export interface UpdateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  is_final_evaluation: boolean;
  formation_id: string;
}

export interface QuizSearchParams {
  q?: string;
  formation_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
