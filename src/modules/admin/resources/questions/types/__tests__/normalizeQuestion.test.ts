/**
 * Tests unitaires — normalizeQuestion (types/index.ts)
 *
 * Couvre :
 *  - multiple_choice : mapping options, weightPercentage, isCorrect
 *  - single_choice   : mapping options sans weight
 *  - true_false      : correct_answer
 *  - matching        : pairs left/right → question/answer
 *  - Champs communs  : id, quizId, type, text, competencyId, feedbacks
 *  - Valeurs par défaut pour les champs absents
 */

import { normalizeQuestion } from '../index';
import type {
  ApiQuizItemChoices,
  ApiQuizItemMatching,
  ApiQuizItemTrueFalse,
} from '@/shared/types/question-bank.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const API_BASE = {
  id: 'quiz-1',
  question_bank_id: 'bank-1',
  question: '<p>Combien font 2 + 2 ?</p>',
  idnumber: 'Q-001',
  comment_if_correct: 'Correct !',
  comment_if_incorrect: 'Incorrect.',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-15T10:00:00Z',
  competency_id: 'comp-math',
};

const API_CHOICES: ApiQuizItemChoices = {
  ...API_BASE,
  type: 'multiple_choice',
  options: [
    { id: 'o-1', label: '4', is_correct: true, weight_percentage: 100 },
    { id: 'o-2', label: '5', is_correct: false, weight_percentage: -50 },
    { id: 'o-3', label: '3', is_correct: false, weight_percentage: -50 },
  ],
};

const API_SINGLE: ApiQuizItemChoices = {
  ...API_BASE,
  type: 'single_choice',
  options: [
    { id: 'o-1', label: 'Vrai', is_correct: true },
    { id: 'o-2', label: 'Faux', is_correct: false },
  ],
};

const API_TRUE_FALSE: ApiQuizItemTrueFalse = {
  ...API_BASE,
  type: 'true_false',
  correct_answer: true,
};

const API_MATCHING: ApiQuizItemMatching = {
  ...API_BASE,
  type: 'matching',
  pairs: [
    { left: 'Chat', right: 'Cat' },
    { left: 'Chien', right: 'Dog' },
    { left: 'Maison', right: 'House' },
  ],
};

// ─── Champs communs ───────────────────────────────────────────────────────────

describe('normalizeQuestion — champs communs', () => {
  it('mappe id, quizId, type, text, competencyId et updatedAt', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.id).toBe('quiz-1');
    expect(q.quizId).toBe('bank-1');
    expect(q.type).toBe('true_false');
    expect(q.text).toBe('<p>Combien font 2 + 2 ?</p>');
    expect(q.competencyId).toBe('comp-math');
    expect(q.updatedAt).toBe('2025-06-15T10:00:00Z');
  });

  it('mappe feedbackTrue et feedbackFalse depuis comment_if_correct/incorrect', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.feedbackTrue).toBe('Correct !');
    expect(q.feedbackFalse).toBe('Incorrect.');
  });

  it('utilise une chaîne vide pour feedbackTrue si comment_if_correct est null', () => {
    const q = normalizeQuestion({ ...API_TRUE_FALSE, comment_if_correct: null });

    expect(q.feedbackTrue).toBe('');
  });

  it('utilise une chaîne vide pour feedbackFalse si comment_if_incorrect est null', () => {
    const q = normalizeQuestion({ ...API_TRUE_FALSE, comment_if_incorrect: null });

    expect(q.feedbackFalse).toBe('');
  });

  it('génère name en supprimant les balises HTML et en tronquant à 80 car.', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.name).toBe('Combien font 2 + 2 ?');
    expect(q.name).not.toContain('<p>');
  });

  it('définit isActive à true par défaut', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.isActive).toBe(true);
  });

  it('définit duration à null par défaut', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.duration).toBeNull();
  });

  it('définit generalFeedback à une chaîne vide', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.generalFeedback).toBe('');
  });
});

// ─── multiple_choice ──────────────────────────────────────────────────────────

describe('normalizeQuestion — multiple_choice', () => {
  it('mappe les options avec label, isCorrect et weightPercentage', () => {
    const q = normalizeQuestion(API_CHOICES);

    expect(q.options).toHaveLength(3);
    expect(q.options[0]).toMatchObject({
      id: 'o-1',
      label: '4',
      isCorrect: true,
      weightPercentage: 100,
    });
    expect(q.options[1]).toMatchObject({
      id: 'o-2',
      label: '5',
      isCorrect: false,
      weightPercentage: -50,
    });
  });

  it("utilise 0 pour weightPercentage si absent dans l'API", () => {
    const api: ApiQuizItemChoices = {
      ...API_CHOICES,
      options: [{ id: 'o-1', label: 'A', is_correct: true }],
    };

    const q = normalizeQuestion(api);

    expect(q.options[0].weightPercentage).toBe(0);
  });

  it('retourne pairs vide', () => {
    const q = normalizeQuestion(API_CHOICES);

    expect(q.pairs).toEqual([]);
  });

  it('définit correctAnswer à false (non utilisé pour ce type)', () => {
    const q = normalizeQuestion(API_CHOICES);

    expect(q.correctAnswer).toBe(false);
  });
});

// ─── single_choice ────────────────────────────────────────────────────────────

describe('normalizeQuestion — single_choice', () => {
  it('mappe les options avec label et isCorrect', () => {
    const q = normalizeQuestion(API_SINGLE);

    expect(q.options).toHaveLength(2);
    expect(q.options[0]).toMatchObject({ label: 'Vrai', isCorrect: true });
    expect(q.options[1]).toMatchObject({ label: 'Faux', isCorrect: false });
  });

  it('utilise 0 pour weightPercentage si absent', () => {
    const q = normalizeQuestion(API_SINGLE);

    q.options.forEach((o) => {
      expect(o.weightPercentage).toBe(0);
    });
  });

  it('retourne pairs vide', () => {
    const q = normalizeQuestion(API_SINGLE);

    expect(q.pairs).toEqual([]);
  });
});

// ─── true_false ───────────────────────────────────────────────────────────────

describe('normalizeQuestion — true_false', () => {
  it('mappe correct_answer = true', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.correctAnswer).toBe(true);
  });

  it('mappe correct_answer = false', () => {
    const q = normalizeQuestion({ ...API_TRUE_FALSE, correct_answer: false });

    expect(q.correctAnswer).toBe(false);
  });

  it('retourne options et pairs vides', () => {
    const q = normalizeQuestion(API_TRUE_FALSE);

    expect(q.options).toEqual([]);
    expect(q.pairs).toEqual([]);
  });
});

// ─── matching ─────────────────────────────────────────────────────────────────

describe('normalizeQuestion — matching', () => {
  it('mappe les paires left → question, right → answer', () => {
    const q = normalizeQuestion(API_MATCHING);

    expect(q.pairs).toHaveLength(3);
    expect(q.pairs[0]).toMatchObject({ question: 'Chat', answer: 'Cat' });
    expect(q.pairs[1]).toMatchObject({ question: 'Chien', answer: 'Dog' });
    expect(q.pairs[2]).toMatchObject({ question: 'Maison', answer: 'House' });
  });

  it('assigne des ids sous forme de chaînes numériques', () => {
    const q = normalizeQuestion(API_MATCHING);

    expect(q.pairs[0].id).toBe('0');
    expect(q.pairs[1].id).toBe('1');
    expect(q.pairs[2].id).toBe('2');
  });

  it('retourne options vide', () => {
    const q = normalizeQuestion(API_MATCHING);

    expect(q.options).toEqual([]);
  });

  it('gère une liste de paires vide', () => {
    const q = normalizeQuestion({ ...API_MATCHING, pairs: [] });

    expect(q.pairs).toEqual([]);
  });
});
