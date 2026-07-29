// ─── Raw API types (snake_case) ──────────────────────────────────────────────

export type QuizItemType = 'multiple_choice' | 'single_choice' | 'true_false' | 'matching';

export interface ApiQuestionBank {
  id: string;
  title: string;
  description: string | null;
  idnumber: string;
  learning_path_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiQuizItemOption {
  id: string;
  label: string;
  is_correct: boolean;
}

export interface ApiQuizItemPair {
  left: string;
  right: string;
}

interface ApiQuizItemBase {
  id: string;
  question_bank_id: string;
  type: QuizItemType;
  question: string;
  idnumber: string;
  comment_if_correct: string | null;
  comment_if_incorrect: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiQuizItemChoices extends ApiQuizItemBase {
  type: 'multiple_choice' | 'single_choice';
  options: ApiQuizItemOption[];
}

export interface ApiQuizItemTrueFalse extends ApiQuizItemBase {
  type: 'true_false';
  correct_answer: boolean;
}

export interface ApiQuizItemMatching extends ApiQuizItemBase {
  type: 'matching';
  pairs: ApiQuizItemPair[];
}

export type ApiQuizItem = ApiQuizItemChoices | ApiQuizItemTrueFalse | ApiQuizItemMatching;

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreateQuestionBankPayload {
  title: string;
  description?: string | null;
  learning_path_ids?: string[];
}

export interface UpdateQuestionBankPayload {
  title?: string;
  description?: string | null;
  learning_path_ids?: string[];
}

interface CreateQuizItemPayloadBase {
  type: QuizItemType;
  question: string;
  comment_if_correct?: string | null;
  comment_if_incorrect?: string | null;
}

export interface CreateQuizItemChoicesPayload extends CreateQuizItemPayloadBase {
  type: 'multiple_choice' | 'single_choice';
  options: { label: string; is_correct: boolean; id?: string }[];
}

export interface CreateQuizItemTrueFalsePayload extends CreateQuizItemPayloadBase {
  type: 'true_false';
  correct_answer: boolean;
}

export interface CreateQuizItemMatchingPayload extends CreateQuizItemPayloadBase {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

export type CreateQuizItemPayload =
  CreateQuizItemChoicesPayload | CreateQuizItemTrueFalsePayload | CreateQuizItemMatchingPayload;

export interface UpdateQuizItemChoicesPayload {
  type?: 'multiple_choice' | 'single_choice';
  question?: string;
  options?: { id?: string; label: string; is_correct: boolean }[];
  comment_if_correct?: string | null;
  comment_if_incorrect?: string | null;
}

export interface UpdateQuizItemTrueFalsePayload {
  type?: 'true_false';
  question?: string;
  correct_answer?: boolean;
  comment_if_correct?: string | null;
  comment_if_incorrect?: string | null;
}

export interface UpdateQuizItemMatchingPayload {
  type?: 'matching';
  question?: string;
  pairs?: { left: string; right: string }[];
  comment_if_correct?: string | null;
  comment_if_incorrect?: string | null;
}

export type UpdateQuizItemPayload =
  UpdateQuizItemChoicesPayload | UpdateQuizItemTrueFalsePayload | UpdateQuizItemMatchingPayload;
