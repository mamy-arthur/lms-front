/**
 * Tests unitaires — assignmentsApi
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { apiGet, apiPost } from '@/shared/lib/apiClient';
import { assignmentsApi } from '../assignments.api';
import type {
  ApiAssignment,
  ApiAssignmentsListResponse,
  CreateAssignmentResponse,
} from '@/shared/types/assignment.types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);

const MOCK_ASSIGNMENT: ApiAssignment = {
  id: 'aa0e8400-e29b-41d4-a716-446655440200',
  tenant_id: '660e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440010',
  learning_path_id: '660e8400-e29b-41d4-a716-446655440060',
  trainee_id: '660e8400-e29b-41d4-a716-446655440020',
  status: 'assigned',
  assigned_at: '2026-07-30T10:00:00+00:00',
  created_at: '2026-07-30T10:00:00+00:00',
  updated_at: '2026-07-30T10:00:00+00:00',
};

const MOCK_LIST: ApiAssignmentsListResponse = {
  data: [MOCK_ASSIGNMENT],
  meta: { total: 1, page: 1, per_page: 100 },
};

const MOCK_CREATE_RESPONSE: CreateAssignmentResponse = {
  message: '3 stagiaires assignés. 2 déjà assignés (ignorés).',
  data: [MOCK_ASSIGNMENT],
  meta: {
    assigned_count: 3,
    skipped_count: 2,
    skipped_trainee_ids: [
      '660e8400-e29b-41d4-a716-446655440021',
      '660e8400-e29b-41d4-a716-446655440022',
    ],
  },
};

describe('assignmentsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('list() appelle GET assignments avec page et per_page', async () => {
    mockApiGet.mockResolvedValue(MOCK_LIST);

    const result = await assignmentsApi.list({ page: 1, per_page: 100 });

    expect(mockApiGet).toHaveBeenCalledWith('assignments', { page: 1, per_page: 100 });
    expect(result.data[0].status).toBe('assigned');
    expect(result.meta.total).toBe(1);
  });

  it('create() accepte trainee_ids et group_ids ensemble', async () => {
    mockApiPost.mockResolvedValue(MOCK_CREATE_RESPONSE);

    const result = await assignmentsApi.create({
      learning_path_id: MOCK_ASSIGNMENT.learning_path_id,
      trainee_ids: [MOCK_ASSIGNMENT.trainee_id],
      group_ids: [
        'aa0e8400-e29b-41d4-a716-446655440100',
        'aa0e8400-e29b-41d4-a716-446655440101',
      ],
    });

    expect(mockApiPost).toHaveBeenCalledWith('assignments', {
      learning_path_id: MOCK_ASSIGNMENT.learning_path_id,
      trainee_ids: [MOCK_ASSIGNMENT.trainee_id],
      group_ids: [
        'aa0e8400-e29b-41d4-a716-446655440100',
        'aa0e8400-e29b-41d4-a716-446655440101',
      ],
    });
    expect(result.meta.assigned_count).toBe(3);
    expect(result.meta.skipped_count).toBe(2);
    expect(result.message).toContain('déjà assignés');
  });

  it('create() accepte uniquement group_ids', async () => {
    mockApiPost.mockResolvedValue(MOCK_CREATE_RESPONSE);

    await assignmentsApi.create({
      learning_path_id: MOCK_ASSIGNMENT.learning_path_id,
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100'],
    });

    expect(mockApiPost).toHaveBeenCalledWith('assignments', {
      learning_path_id: MOCK_ASSIGNMENT.learning_path_id,
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100'],
    });
  });
});
