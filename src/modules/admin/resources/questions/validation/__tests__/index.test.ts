/**
 * Tests unitaires — questions/validation
 *
 * Couvre :
 *  - largestRemainder  : algorithme de normalisation (méthode du plus grand reste)
 *  - formSchema        : validation Zod pour chaque type de question
 *  - buildQuestionPayload : construction du payload backend + normalisation
 *  - getCreateDefaults : valeurs initiales du formulaire
 */

import { largestRemainder, formSchema, buildQuestionPayload, getCreateDefaults } from '..';
import type { FormValues } from '..';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseValues(overrides: Partial<FormValues> = {}): FormValues {
  return {
    type: 'single_choice',
    competencyId: 'comp-1',
    question: 'Quelle est la réponse ?',
    commentIfCorrect: null,
    commentIfIncorrect: null,
    correctAnswer: false,
    options: [],
    pairs: [],
    ...overrides,
  };
}

// ─── largestRemainder ─────────────────────────────────────────────────────────

describe('largestRemainder(weights, target)', () => {
  it('répartit équitablement si tous les poids sont 0', () => {
    expect(largestRemainder([0, 0], 100)).toEqual([50, 50]);
  });

  it('répartit équitablement avec reste si le total ne divise pas exactement', () => {
    const result = largestRemainder([0, 0, 0], 100);
    expect(result).toEqual([34, 33, 33]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100);
  });

  it('retourne [100] pour un seul poids quelconque (cas "seule bonne réponse")', () => {
    expect(largestRemainder([50], 100)).toEqual([100]);
    expect(largestRemainder([1], 100)).toEqual([100]);
    expect(largestRemainder([100], 100)).toEqual([100]);
  });

  it('conserve les proportions 50/50', () => {
    expect(largestRemainder([50, 50], 100)).toEqual([50, 50]);
  });

  it('conserve les proportions exactes 90/10', () => {
    expect(largestRemainder([90, 10], 100)).toEqual([90, 10]);
  });

  it('normalise 70/10 → 88/12 (somme exactement 100)', () => {
    const result = largestRemainder([70, 10], 100);
    expect(result).toEqual([88, 12]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100);
  });

  it('normalise 1/1/1 → 34/33/33 (somme exactement 100)', () => {
    const result = largestRemainder([1, 1, 1], 100);
    expect(result).toEqual([34, 33, 33]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(100);
  });

  it('garantit toujours que la somme == target, peu importe les poids', () => {
    const cases = [
      [7, 3],
      [60, 25, 15],
      [33, 33, 33],
      [100, 1, 1],
    ];
    for (const weights of cases) {
      const result = largestRemainder(weights, 100);
      expect(result.reduce((s, v) => s + v, 0)).toBe(100);
    }
  });

  it('fonctionne avec une cible différente de 100', () => {
    const result = largestRemainder([1, 1], 10);
    expect(result).toEqual([5, 5]);
    expect(result.reduce((s, v) => s + v, 0)).toBe(10);
  });
});

// ─── formSchema – single_choice ───────────────────────────────────────────────

describe('formSchema — single_choice', () => {
  const validOptions = [
    { label: 'Réponse A', isCorrect: true },
    { label: 'Réponse B', isCorrect: false },
  ];

  it('valide un formulaire correct', () => {
    const result = formSchema.safeParse(
      baseValues({ type: 'single_choice', options: validOptions }),
    );
    expect(result.success).toBe(true);
  });

  it('échoue si moins de 2 options', () => {
    const result = formSchema.safeParse(
      baseValues({ type: 'single_choice', options: [{ label: 'A', isCorrect: true }] }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Ajoutez au moins 2 choix');
  });

  it('échoue si aucune option correcte', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'single_choice',
        options: [
          { label: 'A', isCorrect: false },
          { label: 'B', isCorrect: false },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('Exactement un choix'))).toBe(true);
  });

  it("échoue si plus d'une option correcte", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'single_choice',
        options: [
          { label: 'A', isCorrect: true },
          { label: 'B', isCorrect: true },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('Exactement un choix'))).toBe(true);
  });

  it("échoue si le label d'une option est vide", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'single_choice',
        options: [
          { label: '', isCorrect: true },
          { label: 'B', isCorrect: false },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });
});

// ─── formSchema – multiple_choice ─────────────────────────────────────────────

describe('formSchema — multiple_choice', () => {
  const validOptions = [
    { label: 'A', isCorrect: true, weightPercentage: 60 },
    { label: 'B', isCorrect: true, weightPercentage: 40 },
    { label: 'C', isCorrect: false, weightPercentage: -100 },
  ];

  it('valide un formulaire correct (poids dans les plages autorisées)', () => {
    const result = formSchema.safeParse(
      baseValues({ type: 'multiple_choice', options: validOptions }),
    );
    expect(result.success).toBe(true);
  });

  it('accepte les valeurs limites 0, 100 et -100', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 0 },
          { label: 'B', isCorrect: true, weightPercentage: 100 },
          { label: 'C', isCorrect: false, weightPercentage: 0 },
          { label: 'D', isCorrect: false, weightPercentage: -100 },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it('échoue si aucune option correcte', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: false, weightPercentage: -50 },
          { label: 'B', isCorrect: false, weightPercentage: -50 },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('Au moins un choix'))).toBe(true);
  });

  it("échoue si le poids d'une réponse correcte est négatif", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: -10 },
          { label: 'B', isCorrect: false, weightPercentage: -50 },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('entre 0 et 100'))).toBe(true);
  });

  it("échoue si le poids d'une réponse correcte dépasse 100", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 101 },
          { label: 'B', isCorrect: false, weightPercentage: -50 },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('entre 0 et 100'))).toBe(true);
  });

  it("échoue si le poids d'une réponse incorrecte est positif", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 100 },
          { label: 'B', isCorrect: false, weightPercentage: 10 },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('entre -100 et 0'))).toBe(true);
  });

  it("échoue si le poids d'une réponse incorrecte est inférieur à -100", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 100 },
          { label: 'B', isCorrect: false, weightPercentage: -101 },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('entre -100 et 0'))).toBe(true);
  });

  it('accepte la soumission même si la somme des poids corrects ≠ 100 (normalisé au payload)', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 70 },
          { label: 'B', isCorrect: true, weightPercentage: 10 },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});

// ─── formSchema – true_false ──────────────────────────────────────────────────

describe('formSchema — true_false', () => {
  it('valide avec correctAnswer = true', () => {
    const result = formSchema.safeParse(baseValues({ type: 'true_false', correctAnswer: true }));
    expect(result.success).toBe(true);
  });

  it('valide avec correctAnswer = false', () => {
    const result = formSchema.safeParse(baseValues({ type: 'true_false', correctAnswer: false }));
    expect(result.success).toBe(true);
  });
});

// ─── formSchema – matching ────────────────────────────────────────────────────

describe('formSchema — matching', () => {
  const validPairs = [
    { left: 'Chat', right: 'Cat' },
    { left: 'Chien', right: 'Dog' },
  ];

  it('valide un formulaire correct (2 paires minimum)', () => {
    const result = formSchema.safeParse(baseValues({ type: 'matching', pairs: validPairs }));
    expect(result.success).toBe(true);
  });

  it('échoue si moins de 2 paires', () => {
    const result = formSchema.safeParse(
      baseValues({ type: 'matching', pairs: [{ left: 'A', right: '1' }] }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message.includes('2 paires'))).toBe(true);
  });

  it("échoue si le côté gauche d'une paire est vide", () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'matching',
        pairs: [
          { left: '', right: '1' },
          { left: 'B', right: '2' },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it('accepte 3 paires ou plus', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'matching',
        pairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' },
          { left: 'C', right: '3' },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});

// ─── formSchema – champs communs ──────────────────────────────────────────────

describe('formSchema — champs communs', () => {
  it('échoue si question est vide', () => {
    const result = formSchema.safeParse(baseValues({ type: 'true_false', question: '' }));
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('question'))).toBe(true);
  });

  it('échoue si competencyId est vide', () => {
    const result = formSchema.safeParse(baseValues({ type: 'true_false', competencyId: '' }));
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('competencyId'))).toBe(true);
  });

  it('accepte commentIfCorrect et commentIfIncorrect nuls', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'true_false',
        commentIfCorrect: null,
        commentIfIncorrect: null,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('accepte des commentaires textuels', () => {
    const result = formSchema.safeParse(
      baseValues({
        type: 'true_false',
        commentIfCorrect: 'Bravo !',
        commentIfIncorrect: 'Dommage.',
      }),
    );
    expect(result.success).toBe(true);
  });
});

// ─── buildQuestionPayload ─────────────────────────────────────────────────────

describe('buildQuestionPayload()', () => {
  const BANK_ID = 'bank-1';

  // ── multiple_choice ────────────────────────────────────────────────────────

  describe('multiple_choice', () => {
    it('normalise les poids corrects pour que leur somme == 100', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 70 },
          { label: 'B', isCorrect: true, weightPercentage: 10 },
          { label: 'C', isCorrect: false, weightPercentage: -40 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const correctWeights = payload.options
        .filter((o) => o.isCorrect)
        .map((o) => o.weightPercentage!);

      expect(correctWeights.reduce((s, v) => s + v, 0)).toBe(100);
    });

    it('normalise 70/10 → 88/12', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 70 },
          { label: 'B', isCorrect: true, weightPercentage: 10 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const [a, b] = payload.options.map((o) => o.weightPercentage!);

      expect(a).toBe(88);
      expect(b).toBe(12);
    });

    it('une seule bonne réponse reçoit toujours 100%', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 50 },
          { label: 'B', isCorrect: false, weightPercentage: -100 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const correctOption = payload.options.find((o) => o.isCorrect)!;

      expect(correctOption.weightPercentage).toBe(100);
    });

    it('50/50 reste 50/50', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 50 },
          { label: 'B', isCorrect: true, weightPercentage: 50 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const [a, b] = payload.options.map((o) => o.weightPercentage!);

      expect(a).toBe(50);
      expect(b).toBe(50);
    });

    it('les poids des réponses incorrectes ne sont PAS modifiés', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 100 },
          { label: 'B', isCorrect: false, weightPercentage: -40 },
          { label: 'C', isCorrect: false, weightPercentage: -20 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const incorrects = payload.options.filter((o) => !o.isCorrect);

      expect(incorrects[0].weightPercentage).toBe(-40);
      expect(incorrects[1].weightPercentage).toBe(-20);
    });

    it('distribue équitablement si tous les poids corrects sont 0', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 0 },
          { label: 'B', isCorrect: true, weightPercentage: 0 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);
      const correctWeights = payload.options
        .filter((o) => o.isCorrect)
        .map((o) => o.weightPercentage!);

      expect(correctWeights).toEqual([50, 50]);
      expect(correctWeights.reduce((s, v) => s + v, 0)).toBe(100);
    });

    it('inclut weightPercentage dans le payload options', () => {
      const values = baseValues({
        type: 'multiple_choice',
        options: [
          { label: 'A', isCorrect: true, weightPercentage: 100 },
          { label: 'B', isCorrect: false, weightPercentage: -100 },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      payload.options.forEach((o) => {
        expect(o).toHaveProperty('weightPercentage');
      });
    });
  });

  // ── single_choice ──────────────────────────────────────────────────────────

  describe('single_choice', () => {
    it("n'inclut pas weightPercentage dans le payload options", () => {
      const values = baseValues({
        type: 'single_choice',
        options: [
          { label: 'A', isCorrect: true },
          { label: 'B', isCorrect: false },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      payload.options.forEach((o) => {
        expect(o).not.toHaveProperty('weightPercentage');
      });
    });

    it('mappe correctement label et isCorrect', () => {
      const values = baseValues({
        type: 'single_choice',
        options: [
          { label: 'Réponse A', isCorrect: true },
          { label: 'Réponse B', isCorrect: false },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      expect(payload.options[0]).toMatchObject({ label: 'Réponse A', isCorrect: true });
      expect(payload.options[1]).toMatchObject({ label: 'Réponse B', isCorrect: false });
    });
  });

  // ── true_false ─────────────────────────────────────────────────────────────

  describe('true_false', () => {
    it('envoie correctAnswer dans le payload', () => {
      const values = baseValues({ type: 'true_false', correctAnswer: true });

      const payload = buildQuestionPayload(values, BANK_ID);

      expect(payload.correctAnswer).toBe(true);
    });
  });

  // ── matching ───────────────────────────────────────────────────────────────

  describe('matching', () => {
    it('répartit automatiquement weightPercentage entre les paires', () => {
      const values = baseValues({
        type: 'matching',
        pairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' },
          { left: 'C', right: '3' },
          { left: 'D', right: '4' },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      payload.pairs.forEach((p) => {
        expect(p.weightPercentage).toBe(25); // 100 / 4
      });
    });

    it('assigne 100% pour une seule paire', () => {
      const values = baseValues({
        type: 'matching',
        pairs: [{ left: 'A', right: '1' }],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      expect(payload.pairs[0].weightPercentage).toBe(100);
    });
  });

  // ── payload commun ─────────────────────────────────────────────────────────

  describe('champs communs du payload', () => {
    it('inclut questionBankId, type, competency_id, question dans le payload', () => {
      const values = baseValues({
        type: 'true_false',
        competencyId: 'comp-42',
        question: 'Est-ce vrai ?',
      });

      const payload = buildQuestionPayload(values, 'bank-99');

      expect(payload.questionBankId).toBe('bank-99');
      expect(payload.type).toBe('true_false');
      expect(payload.competency_id).toBe('comp-42');
      expect(payload.question).toBe('Est-ce vrai ?');
    });

    it('convertit commentIfCorrect/commentIfIncorrect undefined en null', () => {
      const values = baseValues({ type: 'true_false', commentIfCorrect: undefined });

      const payload = buildQuestionPayload(values, BANK_ID);

      expect(payload.commentIfCorrect).toBeNull();
    });

    it("transmet l'id existant d'une option si présent", () => {
      const values = baseValues({
        type: 'single_choice',
        options: [
          { id: 'opt-existing', label: 'A', isCorrect: true },
          { label: 'B', isCorrect: false },
        ],
      });

      const payload = buildQuestionPayload(values, BANK_ID);

      expect(payload.options[0].id).toBe('opt-existing');
      expect(payload.options[1]).not.toHaveProperty('id');
    });
  });
});

// ─── getCreateDefaults ────────────────────────────────────────────────────────

describe('getCreateDefaults()', () => {
  it('retourne les valeurs initiales attendues', () => {
    const defaults = getCreateDefaults();

    expect(defaults).toEqual({
      type: '',
      competencyId: '',
      question: '',
      commentIfCorrect: null,
      commentIfIncorrect: null,
      correctAnswer: true,
      options: [],
      pairs: [],
    });
  });

  it('retourne un nouvel objet à chaque appel (pas de référence partagée)', () => {
    const a = getCreateDefaults();
    const b = getCreateDefaults();

    a.options.push({ label: 'X', isCorrect: true });

    expect(b.options).toHaveLength(0);
  });
});
