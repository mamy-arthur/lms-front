export interface ApiLearningPathImage {
  id: string;
  url: string;
  mime_type: string;
}

/** Evaluation summary embedded in the LP detail response */
export interface ApiLearningPathEvaluation {
  id: string;
  title: string;
  position: number;
  location_x: number | null;
  location_y: number | null;
  preceding_competency_id: string | null;
}

/** Used by admin/platform CRUD endpoints — competency id only */
export interface ApiLearningPathCompetency {
  competency_id: string;
  position: number;
  location_x: number | null;
  location_y: number | null;
}

/** Embedded course inside a shop competency */
export interface ApiShopCourse {
  id: string;
  position: number;
  full_name: string;
  short_name: string;
}

/** Enriched competency returned by shop endpoints */
export interface ApiShopCompetency {
  competency_id: string;
  position: number;
  shortname: string;
  courses: ApiShopCourse[];
}

/** Learning path returned by shop endpoints — competencies are fully embedded */
export type ApiShopLearningPath = Omit<ApiLearningPath, 'competencies'> & {
  competencies: ApiShopCompetency[];
};

export interface ApiLearningPath {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  idnumber: string | null;
  category_id: string | null;
  price: number | null;
  currency: string | null;
  image: ApiLearningPathImage | null;
  published_at: string | null;
  author_id: string | null;
  show_in_shop: boolean;
  is_published: boolean;
  is_sellable: boolean;
  /** Durée estimée du parcours en minutes */
  duration: number | null;
  competencies: ApiLearningPathCompetency[];
  /** Only present in detail endpoint responses — absent from list/shop endpoints */
  evaluations?: ApiLearningPathEvaluation[];
  /** Mail template attached as the first node of the LP — id + name only, null if none attached yet. Present in both list and detail responses. */
  mail_template?: {
    id: string;
    name: string;
    location_x: number | null;
    location_y: number | null;
  } | null;
  /** Certificate attached to the LP — id + name only, null if none attached yet. */
  certificate?: {
    id: string;
    name: string;
    location_x: number | null;
    location_y: number | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ApiLearningPathCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Single row from the learning_path_competency pivot table */
export interface ApiLpCompetencyItem {
  id: string;
  shortname: string;
  category_id: string | null;
  courses: Array<{ id: string }>;
  courses_count: number;
  is_linked: boolean;
}

export interface ApiUploadedMedia {
  id: string;
  url: string;
  mime_type: string;
  original_name: string;
}

export interface CreateLearningPathCategoryPayload {
  name: string;
  description?: string | null;
}

export interface UpdateLearningPathCategoryPayload {
  name?: string;
  description?: string | null;
}

export interface CreateLearningPathPayload {
  name: string;
  description?: string | null;
  category_id?: string | null;
  price?: number | null;
  currency?: string;
  image?: string | null;
  published_at?: string | null;
  author_id?: string | null;
  show_in_shop?: boolean;
  /** Durée estimée en minutes */
  duration?: number | null;
  competency_ids?: string[];
}

export interface UpdateLearningPathPayload {
  name?: string;
  description?: string | null;
  category_id?: string | null;
  price?: number | null;
  currency?: string;
  image?: string | null;
  published_at?: string | null;
  author_id?: string | null;
  show_in_shop?: boolean;
  /** Durée estimée en minutes */
  duration?: number | null;
  competency_ids?: string[];
}

export interface LinkCompetencyPayload {
  competency_id: string;
  location_x?: number | null;
  location_y?: number | null;
  // ── Shop (boutique) ───────────────────────────────────────────────────────────
}
export interface ShopLearningPathParams {
  page?: number;
  per_page?: number;
  q?: string;
  category_id?: string;
}

export interface ApiShopLearningPathsResponse {
  data: ApiShopLearningPath[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}
