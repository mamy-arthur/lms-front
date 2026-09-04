/**
 * Tests unitaires — useQuestionsQuery
 *
 * Couvre :
 *  - query key basé sur quizItemKeys.listByBank(questionBankId, params)
 *  - enabled: false quand questionBankId est vide
 *  - la queryFn transmet types/competency_ids/q/sort/pagination à questionBanksApi.listQuizzes
 *  - la queryFn normalise les questions et retourne { data, total, bankCompetencyIds }
 *  - valeurs par défaut de total et bankCompetencyIds quand meta est absent
 */

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/shared/api/question-banks.api', () => ({
  questionBanksApi: { listQuizzes: jest.fn() },
}));

import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import { useQuestionsQuery } from '../useQuestionsQuery';

const mockUseQuery = jest.mocked(useQuery);
const mockListQuizzes = jest.mocked(questionBanksApi.listQuizzes);

const RAW_QUESTION = {
  id: 'q-001',
  question_bank_id: 'bank-1',
  type: 'single_choice' as const,
  question: 'Quelle est la capitale de la France ?',
  idnumber: 'Q-0001',
  comment_if_correct: null,
  comment_if_incorrect: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  competency_id: 'comp-1',
  options: [
    { id: 'o-1', label: 'Paris', is_correct: true },
    { id: 'o-2', label: 'Lyon', is_correct: false },
  ],
};

function getQueryFn() {
  const { queryFn } = mockUseQuery.mock.calls[0][0] as {
    queryFn: (...args: unknown[]) => Promise<{
      data: unknown[];
      total: number;
      bankCompetencyIds: string[];
    }>;
  };
  return queryFn;
}

describe('useQuestionsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('utilise quizItemKeys.listByBank(questionBankId, params) comme query key', () => {
    const params = { types: 'single_choice', page: 0, page_size: 25 };
    renderHook(() => useQuestionsQuery('bank-1', params));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: quizItemKeys.listByBank('bank-1', params),
      }),
    );
  });

  it('désactive la requête quand questionBankId est vide', () => {
    renderHook(() => useQuestionsQuery('', undefined));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('transmet types, competency_ids, q, tri et pagination à listQuizzes', async () => {
    mockListQuizzes.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderHook(() =>
      useQuestionsQuery('bank-1', {
        types: 'single_choice,true_false',
        competency_ids: 'comp-1,comp-2',
        q: 'capitale',
        sort_by: 'updated_at',
        sort_dir: 'desc',
        page: 2,
        page_size: 25,
      }),
    );

    await getQueryFn()({});

    expect(mockListQuizzes).toHaveBeenCalledWith('bank-1', {
      types: 'single_choice,true_false',
      competency_ids: 'comp-1,comp-2',
      q: 'capitale',
      sort_by: 'updated_at',
      sort_dir: 'desc',
      page: 3, // page 0-based côté UI -> 1-based côté API
      per_page: 25,
    });
  });

  it('ne transmet pas de page quand params.page est undefined', async () => {
    mockListQuizzes.mockResolvedValue({ data: [], meta: { total: 0 } });
    renderHook(() => useQuestionsQuery('bank-1', undefined));

    await getQueryFn()({});

    expect(mockListQuizzes).toHaveBeenCalledWith(
      'bank-1',
      expect.objectContaining({ page: undefined }),
    );
  });

  it('normalise les questions et retourne { data, total, bankCompetencyIds } depuis meta', async () => {
    mockListQuizzes.mockResolvedValue({
      data: [RAW_QUESTION],
      meta: { total: 12, competency_ids: ['comp-1', 'comp-2'] },
    });
    renderHook(() => useQuestionsQuery('bank-1'));

    const result = await getQueryFn()({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'q-001',
      type: 'single_choice',
      competencyId: 'comp-1',
    });
    expect(result.total).toBe(12);
    expect(result.bankCompetencyIds).toEqual(['comp-1', 'comp-2']);
  });

  it('retombe sur total = data.length et bankCompetencyIds = [] si meta est absent', async () => {
    mockListQuizzes.mockResolvedValue({ data: [RAW_QUESTION] });
    renderHook(() => useQuestionsQuery('bank-1'));

    const result = await getQueryFn()({});

    expect(result.total).toBe(1);
    expect(result.bankCompetencyIds).toEqual([]);
  });
});
