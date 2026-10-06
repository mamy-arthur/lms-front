export interface ClientManagerPurchasedLearningPath {
  id: string;
  created_at: string;
  learning_path: {
    id: string;
    name: string;
    description: string | null;
    image: { id: string; url: string; mime_type: string } | null;
    category_id: string | null;
    category_name: string | null;
  } | null;
  modules_count: number;
  evaluations_count: number;
}

export interface ClientManagerPurchasesParams {
  page: number;
  per_page: number;
  q?: string;
  sort_by: 'created_at' | 'name';
  sort_dir: 'asc' | 'desc';
}

export interface ClientManagerPurchasesResponse {
  data: ClientManagerPurchasedLearningPath[];
  meta: { total: number; page: number; per_page: number };
}
