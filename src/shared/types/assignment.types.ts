export interface ApiAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  learning_path_id: string;
  trainee_id: string;
  status: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentsListParams {
  page?: number;
  per_page?: number;
  status?: string;
  learning_path_id?: string;
}

export interface ApiAssignmentsListResponse {
  data: ApiAssignment[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

/** Au moins un de trainee_ids / group_ids doit être fourni. */
export interface CreateAssignmentPayload {
  learning_path_id: string;
  trainee_ids?: string[];
  group_ids?: string[];
}

export interface CreateAssignmentMeta {
  assigned_count: number;
  skipped_count: number;
  skipped_trainee_ids: string[];
}

export interface CreateAssignmentResponse {
  message: string;
  data: ApiAssignment[];
  meta: CreateAssignmentMeta;
}
