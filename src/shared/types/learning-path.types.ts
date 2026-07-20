export interface ApiLearningPathImage {
  id: string;
  url: string;
  mime_type: string;
}

export interface ApiLearningPathCompetency {
  competency_id: string;
  position: number;
}

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
  competencies: ApiLearningPathCompetency[];
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
  competency_ids?: string[];
}
