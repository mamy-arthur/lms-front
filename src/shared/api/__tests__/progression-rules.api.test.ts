jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
}));

import { apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import { progressionRulesApi } from '../progression-rules.api';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);

describe('progressionRulesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls list endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    await progressionRulesApi.list('lp-1');

    expect(mockApiGet).toHaveBeenCalledWith('platform/learning-paths/lp-1/progression-rules');
  });

  it('calls create endpoint with payload', async () => {
    mockApiPost.mockResolvedValue({ data: { id: 'rule-1' } });
    const payload = {
      source_node: { type: 'module', id: 'm1' },
      target_on_success: { type: 'evaluation', id: 'e1' },
      condition: 'always',
    };

    await progressionRulesApi.create('lp-1', payload as never);

    expect(mockApiPost).toHaveBeenCalledWith('platform/learning-paths/lp-1/progression-rules', payload);
  });

  it('calls update and deactivate endpoints', async () => {
    mockApiPatch.mockResolvedValue({ data: { id: 'rule-1' } });

    await progressionRulesApi.update('rule-1', { condition: 'score_gte' } as never);
    await progressionRulesApi.deactivate('rule-1');

    expect(mockApiPatch).toHaveBeenNthCalledWith(1, 'platform/progression-rules/rule-1', {
      condition: 'score_gte',
    });
    expect(mockApiPatch).toHaveBeenNthCalledWith(
      2,
      'platform/progression-rules/rule-1/deactivate',
      {},
    );
  });
});
