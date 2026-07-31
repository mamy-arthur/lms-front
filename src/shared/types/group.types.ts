export interface ApiGroupMember {
  id: string;
  trainee_id: string;
  created_at: string;
}

export interface ApiGroup {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  members: ApiGroupMember[];
  created_at: string;
  updated_at: string;
}

export interface GroupsListParams {
  page?: number;
  per_page?: number;
}

export interface ApiGroupsListResponse {
  data: ApiGroup[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface CreateGroupPayload {
  name: string;
}

export interface UpdateGroupPayload {
  name: string;
}

export interface AddGroupMemberPayload {
  trainee_id: string;
}
