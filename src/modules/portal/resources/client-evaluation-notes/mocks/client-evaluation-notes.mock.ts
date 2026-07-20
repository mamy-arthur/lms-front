/**
 * Portal client evaluation notes — canonical mock.
 *
 * Structure: Formation → Evaluations (named tests) → Trainee results.
 * An adapter (toEvaluationNotes) converts it to EvaluationNote[] for the table.
 *
 * Formation metadata is defined here because portal formations are not
 * present in the admin MOCK_STORE_FORMATIONS.
 */

import type { FormationEvaluationsRecord } from '@/modules/shared/lib/formation-evaluations';
import type { FormationSummary } from '@/modules/shared/lib/evaluation-notes';

// ─── Portal formation metadata ─────────────────────────────────────────────

export const MOCK_PORTAL_EVALUATION_FORMATIONS: FormationSummary[] = [
  {
    id: 'PF-001',
    name: 'Communication professionnelle',
    coverImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=640&h=360&fit=crop',
    category: 'Soft skills',
    traineeCount: 2,
    evaluationCount: 3,
    avgScore: 65,
    successRate: 100,
  },
  {
    id: 'PF-002',
    name: 'Gestion du temps',
    coverImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=640&h=360&fit=crop',
    category: 'Soft skills',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 68,
    successRate: 100,
  },
  {
    id: 'PF-003',
    name: 'Prise de parole en public',
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=640&h=360&fit=crop',
    category: 'Soft skills',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 65,
    successRate: 100,
  },
  {
    id: 'PF-004',
    name: 'Excel pour les non-informaticiens',
    coverImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=640&h=360&fit=crop',
    category: 'Bureautique',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 38,
    successRate: 0,
  },
  {
    id: 'PF-005',
    name: 'Introduction au droit du travail',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=640&h=360&fit=crop',
    category: 'Juridique & RH',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 65,
    successRate: 100,
  },
  {
    id: 'PF-006',
    name: 'Hygiène et sécurité au travail',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&h=360&fit=crop',
    category: 'QHSE',
    traineeCount: 2,
    evaluationCount: 1,
    avgScore: 36,
    successRate: 0,
  },
];

// ─── Canonical evaluation data ────────────────────────────────────────────

export const MOCK_PORTAL_FORMATION_EVALUATIONS: FormationEvaluationsRecord[] = [
  // ── PF-001 · Communication professionnelle ────────────────────────────────
  {
    formationId: 'PF-001',
    evaluations: [
      {
        id: 'PE-001',
        title: 'Quiz 1',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-001',
            traineeName: 'Tiana Rakotobe',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 14,
          },
          {
            traineeId: 'PTR-002',
            traineeName: 'Miora A.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 11,
          },
        ],
      },
      {
        id: 'PE-002',
        title: 'Atelier',
        maxScore: 30,
        coefficient: 2,
        results: [
          {
            traineeId: 'PTR-001',
            traineeName: 'Tiana Rakotobe',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 21,
          },
          {
            traineeId: 'PTR-002',
            traineeName: 'Miora A.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 17,
          },
        ],
      },
      {
        id: 'PE-003',
        title: 'Final',
        maxScore: 40,
        coefficient: 3,
        results: [
          {
            traineeId: 'PTR-001',
            traineeName: 'Tiana Rakotobe',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 28,
          },
          {
            traineeId: 'PTR-002',
            traineeName: 'Miora A.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 26,
          },
        ],
      },
    ],
  },

  // ── PF-002 · Gestion du temps ────────────────────────────────────────────
  {
    formationId: 'PF-002',
    evaluations: [
      {
        id: 'PE-004',
        title: 'Positionnement',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-003',
            traineeName: 'Hasina R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 13,
          },
          {
            traineeId: 'PTR-008',
            traineeName: 'Noro R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 11,
          },
        ],
      },
      {
        id: 'PE-005',
        title: 'Étude de cas',
        maxScore: 30,
        coefficient: 2,
        results: [
          {
            traineeId: 'PTR-003',
            traineeName: 'Hasina R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 24,
          },
          {
            traineeId: 'PTR-008',
            traineeName: 'Noro R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 20,
          },
        ],
      },
    ],
  },

  // ── PF-003 · Prise de parole en public ───────────────────────────────────
  {
    formationId: 'PF-003',
    evaluations: [
      {
        id: 'PE-006',
        title: 'Exercice de présentation',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-004',
            traineeName: 'Zoé Andriamanana',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 17,
          },
          {
            traineeId: 'PTR-009',
            traineeName: 'Hoby R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 10,
          },
        ],
      },
      {
        id: 'PE-007',
        title: 'Évaluation finale',
        maxScore: 30,
        coefficient: 2,
        results: [
          {
            traineeId: 'PTR-004',
            traineeName: 'Zoé Andriamanana',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 22,
          },
          {
            traineeId: 'PTR-009',
            traineeName: 'Hoby R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 16,
          },
        ],
      },
    ],
  },

  // ── PF-004 · Excel pour les non-informaticiens ───────────────────────────
  {
    formationId: 'PF-004',
    evaluations: [
      {
        id: 'PE-008',
        title: 'QCM formules',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-005',
            traineeName: 'Nirina Rasolofo',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 9,
          },
          {
            traineeId: 'PTR-010',
            traineeName: 'Sitraka R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 5,
          },
        ],
      },
      {
        id: 'PE-009',
        title: 'Travaux pratiques',
        maxScore: 40,
        coefficient: 2,
        results: [
          {
            traineeId: 'PTR-005',
            traineeName: 'Nirina Rasolofo',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 18,
          },
          {
            traineeId: 'PTR-010',
            traineeName: 'Sitraka R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 14,
          },
        ],
      },
    ],
  },

  // ── PF-005 · Introduction au droit du travail ────────────────────────────
  {
    formationId: 'PF-005',
    evaluations: [
      {
        id: 'PE-010',
        title: 'Quiz théorique',
        maxScore: 25,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-006',
            traineeName: 'Feno Rakotovao',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 20,
          },
          {
            traineeId: 'PTR-011',
            traineeName: 'Bako R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 14,
          },
        ],
      },
      {
        id: 'PE-011',
        title: 'Étude de cas',
        maxScore: 25,
        coefficient: 2,
        results: [
          {
            traineeId: 'PTR-006',
            traineeName: 'Feno Rakotovao',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 19,
          },
          {
            traineeId: 'PTR-011',
            traineeName: 'Bako R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 12,
          },
        ],
      },
    ],
  },

  // ── PF-006 · Hygiène et sécurité au travail ────────────────────────────────
  {
    formationId: 'PF-006',
    evaluations: [
      {
        id: 'PE-012',
        title: 'Test réglementaire',
        maxScore: 30,
        coefficient: 1,
        results: [
          {
            traineeId: 'PTR-007',
            traineeName: 'Vola Rajaonarison',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 12,
          },
          {
            traineeId: 'PTR-012',
            traineeName: 'Tahina R.',
            clientId: 'portal-client',
            clientName: 'Client Portal',
            score: 10,
          },
        ],
      },
    ],
  },
];
