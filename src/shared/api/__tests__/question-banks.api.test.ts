/**
 * Tests unitaires — questionBanksApi & quizItemsApi
 *
 * Couvre :
 *  - questionBanksApi : list, getById, create, update, deactivate,
 *                       listQuizzes, createQuizItem
 *  - quizItemsApi     : getById, update, delete
 *  - Propagation des erreurs pour chaque méthode
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/shared/lib/apiClient';
import { questionBanksApi, quizItemsApi } from '../question-banks.api';
import type {
  ApiQuestionBank,
  ApiQuizItemChoices,
  ApiQuizItemMatching,
  ApiQuizItemTrueFalse,
} from '@/shared/types/question-bank.types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPut = jest.mocked(apiPut);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BANK_BASE = {
  idnumber: 'QB-001',
  learning_path_ids: [],
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const MOCK_BANK: ApiQuestionBank = {
  id: 'bank-1',
  title: 'Banque de mathématiques',
  description: 'Questions de maths',
  ...BANK_BASE,
};

const QUIZ_BASE = {
  question_bank_id: 'bank-1',
  question: 'Combien font 2 + 2 ?',
  idnumber: 'Q-001',
  comment_if_correct: null,
  comment_if_incorrect: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  competency_id: 'comp-1',
};

const MOCK_QUIZ_CHOICES: ApiQuizItemChoices = {
  id: 'quiz-1',
  type: 'multiple_choice',
  options: [
    { id: 'o-1', label: '4', is_correct: true, weight_percentage: 100 },
    { id: 'o-2', label: '5', is_correct: false, weight_percentage: -100 },
  ],
  ...QUIZ_BASE,
};

const MOCK_QUIZ_TRUE_FALSE: ApiQuizItemTrueFalse = {
  id: 'quiz-2',
  type: 'true_false',
  correct_answer: true,
  ...QUIZ_BASE,
};

const MOCK_QUIZ_MATCHING: ApiQuizItemMatching = {
  id: 'quiz-3',
  type: 'matching',
  pairs: [
    { left: 'Chat', right: 'Cat' },
    { left: 'Chien', right: 'Dog' },
  ],
  ...QUIZ_BASE,
};

// ─── questionBanksApi ─────────────────────────────────────────────────────────

describe('questionBanksApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('appelle GET platform/question-banks sans paramètres', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_BANK] });

      await questionBanksApi.list();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('platform/question-banks', undefined);
    });

    it('transmet le filtre learning_path_id si fourni', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_BANK] });

      await questionBanksApi.list({ learning_path_id: 'lp-42' });

      expect(mockApiGet).toHaveBeenCalledWith('platform/question-banks', {
        learning_path_id: 'lp-42',
      });
    });

    it('retourne la liste des banques', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_BANK] });

      const result = await questionBanksApi.list();

      expect(result).toEqual({ data: [MOCK_BANK] });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('bank-1');
    });

    it('retourne une liste vide si aucune banque', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const result = await questionBanksApi.list();

      expect(result.data).toEqual([]);
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(questionBanksApi.list()).rejects.toThrow('Network error');
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET platform/question-banks/{id}', async () => {
      mockApiGet.mockResolvedValue(MOCK_BANK);

      await questionBanksApi.getById('bank-1');

      expect(mockApiGet).toHaveBeenCalledWith('platform/question-banks/bank-1');
    });

    it('retourne la banque correspondante', async () => {
      mockApiGet.mockResolvedValue(MOCK_BANK);

      const result = await questionBanksApi.getById('bank-1');

      expect(result).toEqual(MOCK_BANK);
    });

    it('propage une erreur 404', async () => {
      mockApiGet.mockRejectedValue(new Error('404 Not Found'));

      await expect(questionBanksApi.getById('bank-unknown')).rejects.toThrow('404 Not Found');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create(data)', () => {
    it('appelle POST platform/question-banks avec le payload', async () => {
      mockApiPost.mockResolvedValue(MOCK_BANK);
      const payload = { title: 'Nouvelle banque', description: null };

      await questionBanksApi.create(payload);

      expect(mockApiPost).toHaveBeenCalledWith('platform/question-banks', payload);
    });

    it('retourne la banque créée', async () => {
      mockApiPost.mockResolvedValue(MOCK_BANK);

      const result = await questionBanksApi.create({ title: 'Test' });

      expect(result).toEqual(MOCK_BANK);
    });

    it('propage les erreurs de validation', async () => {
      mockApiPost.mockRejectedValue(new Error('422 Unprocessable Entity'));

      await expect(questionBanksApi.create({ title: '' })).rejects.toThrow(
        '422 Unprocessable Entity',
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    it('appelle PUT platform/question-banks/{id} avec le payload', async () => {
      const updated = { ...MOCK_BANK, title: 'Titre modifié' };
      mockApiPut.mockResolvedValue(updated);

      await questionBanksApi.update('bank-1', { title: 'Titre modifié' });

      expect(mockApiPut).toHaveBeenCalledWith('platform/question-banks/bank-1', {
        title: 'Titre modifié',
      });
    });

    it('retourne la banque mise à jour', async () => {
      const updated = { ...MOCK_BANK, title: 'Nouveau titre' };
      mockApiPut.mockResolvedValue(updated);

      const result = await questionBanksApi.update('bank-1', { title: 'Nouveau titre' });

      expect(result).toEqual(updated);
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────────

  describe('deactivate(id)', () => {
    it('appelle PATCH platform/question-banks/{id}/deactivate', async () => {
      mockApiPatch.mockResolvedValue({ ...MOCK_BANK, is_active: false });

      await questionBanksApi.deactivate('bank-1');

      expect(mockApiPatch).toHaveBeenCalledWith('platform/question-banks/bank-1/deactivate');
    });

    it('retourne la banque désactivée', async () => {
      const deactivated = { ...MOCK_BANK, is_active: false };
      mockApiPatch.mockResolvedValue(deactivated);

      const result = await questionBanksApi.deactivate('bank-1');

      expect(result).toEqual(deactivated);
    });
  });

  // ── listQuizzes ────────────────────────────────────────────────────────────

  describe('listQuizzes(bankId, params?)', () => {
    it('appelle GET platform/question-banks/{id}/quizzes sans filtre', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_QUIZ_CHOICES] });

      await questionBanksApi.listQuizzes('bank-1');

      expect(mockApiGet).toHaveBeenCalledWith('platform/question-banks/bank-1/quizzes', undefined);
    });

    it('transmet le filtre type si fourni', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      await questionBanksApi.listQuizzes('bank-1', { type: 'multiple_choice' });

      expect(mockApiGet).toHaveBeenCalledWith('platform/question-banks/bank-1/quizzes', {
        type: 'multiple_choice',
      });
    });

    it('retourne les quiz de tous types', async () => {
      const items = [MOCK_QUIZ_CHOICES, MOCK_QUIZ_TRUE_FALSE, MOCK_QUIZ_MATCHING];
      mockApiGet.mockResolvedValue({ data: items });

      const result = await questionBanksApi.listQuizzes('bank-1');

      expect(result.data).toHaveLength(3);
      expect(result.data.map((q) => q.type)).toEqual(['multiple_choice', 'true_false', 'matching']);
    });

    it('retourne une liste vide si la banque est vide', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const result = await questionBanksApi.listQuizzes('bank-empty');

      expect(result.data).toEqual([]);
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('503 Service Unavailable'));

      await expect(questionBanksApi.listQuizzes('bank-1')).rejects.toThrow(
        '503 Service Unavailable',
      );
    });
  });

  // ── createQuizItem ─────────────────────────────────────────────────────────

  describe('createQuizItem(bankId, data)', () => {
    it('appelle POST platform/question-banks/{id}/quizzes', async () => {
      mockApiPost.mockResolvedValue(MOCK_QUIZ_CHOICES);
      const payload = {
        type: 'multiple_choice' as const,
        question: 'Q?',
        options: [
          { label: 'A', is_correct: true, weight_percentage: 100 },
          { label: 'B', is_correct: false, weight_percentage: -100 },
        ],
      };

      await questionBanksApi.createQuizItem('bank-1', payload);

      expect(mockApiPost).toHaveBeenCalledWith('platform/question-banks/bank-1/quizzes', payload);
    });

    it('retourne le quiz créé', async () => {
      mockApiPost.mockResolvedValue(MOCK_QUIZ_CHOICES);

      const result = await questionBanksApi.createQuizItem('bank-1', {
        type: 'true_false',
        question: 'Vrai ou faux ?',
        correct_answer: true,
      });

      expect(result).toEqual(MOCK_QUIZ_CHOICES);
    });

    it('propage une erreur de validation backend', async () => {
      mockApiPost.mockRejectedValue(new Error('422 Unprocessable Entity'));

      await expect(
        questionBanksApi.createQuizItem('bank-1', {
          type: 'true_false',
          question: '',
          correct_answer: false,
        }),
      ).rejects.toThrow('422 Unprocessable Entity');
    });
  });
});

// ─── quizItemsApi ─────────────────────────────────────────────────────────────

describe('quizItemsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET platform/quizzes/{id}', async () => {
      mockApiGet.mockResolvedValue(MOCK_QUIZ_CHOICES);

      await quizItemsApi.getById('quiz-1');

      expect(mockApiGet).toHaveBeenCalledWith('platform/quizzes/quiz-1');
    });

    it('retourne le quiz correspondant', async () => {
      mockApiGet.mockResolvedValue(MOCK_QUIZ_CHOICES);

      const result = await quizItemsApi.getById('quiz-1');

      expect(result).toEqual(MOCK_QUIZ_CHOICES);
    });

    it('propage une erreur 404', async () => {
      mockApiGet.mockRejectedValue(new Error('404 Not Found'));

      await expect(quizItemsApi.getById('quiz-unknown')).rejects.toThrow('404 Not Found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    it('appelle PUT platform/quizzes/{id} avec le payload', async () => {
      mockApiPut.mockResolvedValue(MOCK_QUIZ_CHOICES);
      const update = { question: 'Question modifiée ?', options: [] };

      await quizItemsApi.update('quiz-1', update);

      expect(mockApiPut).toHaveBeenCalledWith('platform/quizzes/quiz-1', update);
    });

    it('retourne le quiz mis à jour', async () => {
      const updated = { ...MOCK_QUIZ_CHOICES, question: 'Nouvelle question ?' };
      mockApiPut.mockResolvedValue(updated);

      const result = await quizItemsApi.update('quiz-1', { question: 'Nouvelle question ?' });

      expect(result).toEqual(updated);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete(id)', () => {
    it('appelle DELETE platform/quizzes/{id}', async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await quizItemsApi.delete('quiz-1');

      expect(mockApiDelete).toHaveBeenCalledWith('platform/quizzes/quiz-1');
    });

    it('propage une erreur 404 si le quiz est introuvable', async () => {
      mockApiDelete.mockRejectedValue(new Error('404 Not Found'));

      await expect(quizItemsApi.delete('quiz-unknown')).rejects.toThrow('404 Not Found');
    });
  });
});
