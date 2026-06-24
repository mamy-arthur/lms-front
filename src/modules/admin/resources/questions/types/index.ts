export type { Question, QuestionType, QuestionOption, MatchingPair, Duration } from "@/modules/shared/lib/normalizers";
export { normalizeQuestion } from "@/modules/shared/lib/normalizers";

export interface QuestionSearchParams {
  q?: string;
  quiz_id?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
