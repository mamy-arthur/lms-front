/**
 * Tests unitaires — groupsApi
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import { groupsApi } from '../groups.api';
import type { ApiGroup, ApiGroupsListResponse } from '@/shared/types/group.types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const MOCK_GROUP: ApiGroup = {
  id: 'aa0e8400-e29b-41d4-a716-446655440100',
  tenant_id: '660e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440010',
  name: 'Cohorte Q1',
  members: [
    {
      id: 'aa0e8400-e29b-41d4-a716-446655440101',
      trainee_id: '660e8400-e29b-41d4-a716-446655440020',
      created_at: '2026-07-30T10:00:00+00:00',
    },
  ],
  created_at: '2026-07-30T10:00:00+00:00',
  updated_at: '2026-07-30T10:00:00+00:00',
};

const MOCK_LIST: ApiGroupsListResponse = {
  data: [MOCK_GROUP],
  meta: { total: 1, page: 1, per_page: 100 },
};

describe('groupsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('list() appelle GET groups avec page et per_page', async () => {
    mockApiGet.mockResolvedValue(MOCK_LIST);

    const result = await groupsApi.list({ page: 1, per_page: 100 });

    expect(mockApiGet).toHaveBeenCalledWith('groups', { page: 1, per_page: 100 });
    expect(result.data[0].name).toBe('Cohorte Q1');
    expect(result.meta.total).toBe(1);
  });

  it('create() poste le name', async () => {
    mockApiPost.mockResolvedValue({ data: MOCK_GROUP });

    await groupsApi.create({ name: 'Cohorte Q1' });

    expect(mockApiPost).toHaveBeenCalledWith('groups', { name: 'Cohorte Q1' });
  });

  it('update() patch le name', async () => {
    mockApiPatch.mockResolvedValue({ data: MOCK_GROUP });

    await groupsApi.update(MOCK_GROUP.id, { name: 'Cohorte Q2' });

    expect(mockApiPatch).toHaveBeenCalledWith(`groups/${MOCK_GROUP.id}`, { name: 'Cohorte Q2' });
  });

  it('addMember() poste trainee_id', async () => {
    mockApiPost.mockResolvedValue({ data: MOCK_GROUP });

    await groupsApi.addMember(MOCK_GROUP.id, {
      trainee_id: '660e8400-e29b-41d4-a716-446655440020',
    });

    expect(mockApiPost).toHaveBeenCalledWith(`groups/${MOCK_GROUP.id}/members`, {
      trainee_id: '660e8400-e29b-41d4-a716-446655440020',
    });
  });

  it('removeMember() appelle DELETE', async () => {
    mockApiDelete.mockResolvedValue(undefined);

    await groupsApi.removeMember(MOCK_GROUP.id, '660e8400-e29b-41d4-a716-446655440020');

    expect(mockApiDelete).toHaveBeenCalledWith(
      `groups/${MOCK_GROUP.id}/members/660e8400-e29b-41d4-a716-446655440020`,
    );
  });

  it('remove() appelle DELETE groups/:id', async () => {
    mockApiDelete.mockResolvedValue(undefined);

    await groupsApi.remove(MOCK_GROUP.id);

    expect(mockApiDelete).toHaveBeenCalledWith(`groups/${MOCK_GROUP.id}`);
  });
});
