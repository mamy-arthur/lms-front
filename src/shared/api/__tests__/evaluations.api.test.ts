jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import { evaluationsApi } from '../evaluations.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

describe('evaluationsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls list and getById endpoints', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    await evaluationsApi.list('lp-1');
    await evaluationsApi.getById('eval-1');

    expect(mockApiGet).toHaveBeenNthCalledWith(1, 'platform/learning-paths/lp-1/evaluations');
    expect(mockApiGet).toHaveBeenNthCalledWith(2, 'platform/evaluations/eval-1');
  });

  it('calls create and update with payload', async () => {
    mockApiPost.mockResolvedValue({ data: { id: 'eval-1' } });
    mockApiPatch.mockResolvedValue({ data: { id: 'eval-1' } });

    const createPayload = {
      title: 'Eval finale',
      type: 'FINAL' as const,
      question_bank_ids: ['qb-1'],
      question_count: 10,
      max_attempts: 3,
      location_x: 12,
      location_y: 34,
    };

    await evaluationsApi.create('lp-1', createPayload);
    await evaluationsApi.update('eval-1', { title: 'Eval modifiee', is_published: true });

    expect(mockApiPost).toHaveBeenCalledWith(
      'platform/learning-paths/lp-1/evaluations',
      createPayload,
    );
    expect(mockApiPatch).toHaveBeenCalledWith('platform/evaluations/eval-1', {
      title: 'Eval modifiee',
      is_published: true,
    });
  });

  it('calls delete endpoint', async () => {
    mockApiDelete.mockResolvedValue(undefined);

    await evaluationsApi.delete('eval-1');

    expect(mockApiDelete).toHaveBeenCalledWith('platform/evaluations/eval-1');
  });

  it('transmet les minutes à la création et null à la suppression de la limite', async () => {
    mockApiPost.mockResolvedValue({ data: { id: 'eval-1', time_limit_minutes: 90 } });
    mockApiPatch.mockResolvedValue({ data: { id: 'eval-1', time_limit_minutes: null } });
    await evaluationsApi.create('lp-1', {
      title: 'Évaluation',
      type: 'FINAL',
      question_bank_ids: ['qb-1'],
      question_count: 1,
      time_limit_minutes: 90,
    });
    await evaluationsApi.update('eval-1', { time_limit_minutes: null });
    expect(mockApiPost).toHaveBeenCalledWith(
      'platform/learning-paths/lp-1/evaluations',
      expect.objectContaining({ time_limit_minutes: 90 }),
    );
    expect(mockApiPatch).toHaveBeenCalledWith('platform/evaluations/eval-1', {
      time_limit_minutes: null,
    });
  });
});
