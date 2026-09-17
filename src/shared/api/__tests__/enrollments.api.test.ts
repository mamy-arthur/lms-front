/**
 * Tests unitaires — enrollmentsApi
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { apiGet, apiPost } from '@/shared/lib/apiClient';
import type {
  ApiEnrollment,
  ApiEnrollmentsListResponse,
  CreateEnrollmentResponse,
} from '@/shared/types/enrollment.types';
import { enrollmentsApi } from '../enrollments.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);

const MOCK_ENROLLMENT: ApiEnrollment = {
  id: 'aa0e8400-e29b-41d4-a716-446655440200',
  tenant_id: '660e8400-e29b-41d4-a716-446655440000',
  assigned_by: '660e8400-e29b-41d4-a716-446655440010',
  learning_path_id: '660e8400-e29b-41d4-a716-446655440060',
  learner_id: '660e8400-e29b-41d4-a716-446655440020',
  status: 'not_started',
  enrolled_at: '2026-07-30T10:00:00+00:00',
  started_at: null,
  completed_at: null,
  failure_reason: null,
  failed_at: null,
  created_at: '2026-07-30T10:00:00+00:00',
  updated_at: '2026-07-30T10:00:00+00:00',
};

const MOCK_LIST: ApiEnrollmentsListResponse = {
  data: [MOCK_ENROLLMENT],
  meta: { total: 1, page: 1, per_page: 100 },
};

const MOCK_CREATE_RESPONSE: CreateEnrollmentResponse = {
  message: '3 stagiaires inscrits. 2 déjà inscrits (ignorés).',
  data: [MOCK_ENROLLMENT],
  meta: {
    enrolled_count: 3,
    skipped_count: 2,
    skipped_learner_ids: [
      '660e8400-e29b-41d4-a716-446655440021',
      '660e8400-e29b-41d4-a716-446655440022',
    ],
  },
};

describe('enrollmentsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('list() appelle GET enrollments avec page et per_page', async () => {
    mockApiGet.mockResolvedValue(MOCK_LIST);

    const result = await enrollmentsApi.list({ page: 1, per_page: 100 });

    expect(mockApiGet).toHaveBeenCalledWith('enrollments', {
      page: 1,
      per_page: 100,
    });
    expect(result.data[0].status).toBe('not_started');
    expect(result.meta.total).toBe(1);
  });

  it('create() accepte learner_ids et group_ids ensemble', async () => {
    mockApiPost.mockResolvedValue(MOCK_CREATE_RESPONSE);

    const result = await enrollmentsApi.create({
      learning_path_id: MOCK_ENROLLMENT.learning_path_id,
      learner_ids: [MOCK_ENROLLMENT.learner_id],
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100', 'aa0e8400-e29b-41d4-a716-446655440101'],
    });

    expect(mockApiPost).toHaveBeenCalledWith('enrollments', {
      learning_path_id: MOCK_ENROLLMENT.learning_path_id,
      learner_ids: [MOCK_ENROLLMENT.learner_id],
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100', 'aa0e8400-e29b-41d4-a716-446655440101'],
    });
    expect(result.meta.enrolled_count).toBe(3);
    expect(result.meta.skipped_count).toBe(2);
    expect(result.message).toContain('déjà inscrits');
  });

  it('create() accepte uniquement group_ids', async () => {
    mockApiPost.mockResolvedValue(MOCK_CREATE_RESPONSE);

    await enrollmentsApi.create({
      learning_path_id: MOCK_ENROLLMENT.learning_path_id,
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100'],
    });

    expect(mockApiPost).toHaveBeenCalledWith('enrollments', {
      learning_path_id: MOCK_ENROLLMENT.learning_path_id,
      group_ids: ['aa0e8400-e29b-41d4-a716-446655440100'],
    });
  });
});
