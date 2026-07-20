/**
 * Canonical mock for formation evaluation data.
 *
 * Structure: Formation → Evaluations (named tests) → Trainee results
 *
 * MOCK_ADMIN_EVALUATION_FORMATIONS holds the formation metadata used by the admin
 * evaluation-notes feature. Formation IDs match so that metadata and
 * evaluation records can be joined by formationId.
 */

import type { FormationEvaluationsRecord } from '@/modules/shared/lib/formation-evaluations';
import type { FormationSummary } from '@/modules/shared/lib/evaluation-notes';

// ─── Admin formation metadata ─────────────────────────────────────────────

/** Client options for the tenant filter dropdown — returned by the list endpoint. */
export const MOCK_ADMIN_CLIENTS: Array<{ id: string; name: string }> = [
  { id: 'tenant-001', name: 'Acme Corp' },
  { id: 'tenant-002', name: 'Beta School' },
  { id: 'tenant-003', name: 'Innova Plus' },
  { id: 'tenant-004', name: 'Globex France' },
];

export const MOCK_ADMIN_EVALUATION_FORMATIONS: FormationSummary[] = [
  {
    id: 'sf-006',
    name: 'Sécurité Web',
    coverImage: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=640&h=360&fit=crop',
    category: 'DevOps & Infrastructure',
    traineeCount: 5,
    evaluationCount: 3,
    avgScore: 49,
    successRate: 40,
  },
  {
    id: 'sf-009',
    name: 'Gestion de Projet Agile',
    coverImage: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=640&h=360&fit=crop',
    category: 'Management & Gestion de projet',
    traineeCount: 7,
    evaluationCount: 4,
    avgScore: 59,
    successRate: 71,
  },
  {
    id: 'sf-001',
    name: 'Introduction à React',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
    category: 'Développement Frontend',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 78,
    successRate: 100,
  },
  {
    id: 'sf-003',
    name: 'Node.js pour Débutants',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop',
    category: 'Développement Backend',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 34,
    successRate: 0,
  },
  {
    id: 'sf-005',
    name: 'DevOps & CI/CD',
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=640&h=360&fit=crop',
    category: 'DevOps & Infrastructure',
    traineeCount: 2,
    evaluationCount: 2,
    avgScore: 62,
    successRate: 100,
  },
];

// ─── Canonical evaluation data ────────────────────────────────────────────

export const MOCK_FORMATION_EVALUATIONS: FormationEvaluationsRecord[] = [
  // ── sf-006 · Sécurité Web ────────────────────────────────────────────────
  {
    formationId: 'sf-006',
    evaluations: [
      {
        id: 'E-001',
        title: 'Quiz Intro',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'TR-001',
            traineeName: 'Aina Rakoto',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 16,
          },
          {
            traineeId: 'TR-002',
            traineeName: 'Mamy R.',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 8,
          },
          {
            traineeId: 'TR-006',
            traineeName: 'Fanja N.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 6,
          },
          {
            traineeId: 'TR-008',
            traineeName: 'Someone hehe.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 2,
          },
          {
            traineeId: 'TR-009',
            traineeName: 'People number 73.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 16,
          },
        ],
      },
      {
        id: 'E-002',
        title: 'Cas pratique',
        maxScore: 20,
        coefficient: 2,
        results: [
          {
            traineeId: 'TR-001',
            traineeName: 'Aina Rakoto',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 14,
          },
          {
            traineeId: 'TR-002',
            traineeName: 'Mamy R.',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 10,
          },
          {
            traineeId: 'TR-006',
            traineeName: 'Fanja N.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 1,
          },
          {
            traineeId: 'TR-008',
            traineeName: 'Someone hehe.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 12,
          },
          {
            traineeId: 'TR-009',
            traineeName: 'People number 73.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 11,
          },
        ],
      },
      {
        id: 'E-003',
        title: 'Évaluation finale',
        maxScore: 40,
        coefficient: 3,
        results: [
          {
            traineeId: 'TR-001',
            traineeName: 'Aina Rakoto',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 32,
          },
          {
            traineeId: 'TR-002',
            traineeName: 'Mamy R.',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 21,
          },
          {
            traineeId: 'TR-006',
            traineeName: 'Fanja N.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 2,
          },
          {
            traineeId: 'TR-008',
            traineeName: 'Someone hehe.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 32,
          },
          {
            traineeId: 'TR-009',
            traineeName: 'People number 73.',
            clientId: 'tenant-004',
            clientName: 'Globex France',
            score: 12,
          },
        ],
      },
    ],
  },

  // ── sf-009 · Gestion de Projet Agile ────────────────────────────────────
  {
    formationId: 'sf-009',
    evaluations: [
      {
        id: 'E-004',
        title: 'Diagnostic',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'TR-003',
            traineeName: 'Sarah Andry',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 2,
          },
          {
            traineeId: 'TR-004',
            traineeName: 'Jean Koto',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 20,
          },
          {
            traineeId: 'TR-005',
            traineeName: 'Lova Rana',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 20,
          },
          {
            traineeId: 'TR-010',
            traineeName: 'Niry Rajaonarison',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 18,
          },
          {
            traineeId: 'TR-011',
            traineeName: 'Tiana Andriamaro',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 14,
          },
          {
            traineeId: 'TR-012',
            traineeName: 'Miora Ravelo',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 10,
          },
          {
            traineeId: 'TR-013',
            traineeName: 'Hery Randria',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 6,
          },
        ],
      },
      {
        id: 'E-005',
        title: 'Mise en situation',
        maxScore: 30,
        coefficient: 2,
        results: [
          {
            traineeId: 'TR-003',
            traineeName: 'Sarah Andry',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 22,
          },
          {
            traineeId: 'TR-004',
            traineeName: 'Jean Koto',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 21,
          },
          {
            traineeId: 'TR-005',
            traineeName: 'Lova Rana',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 22,
          },
          {
            traineeId: 'TR-010',
            traineeName: 'Niry Rajaonarison',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 25,
          },
          {
            traineeId: 'TR-011',
            traineeName: 'Tiana Andriamaro',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 19,
          },
          {
            traineeId: 'TR-012',
            traineeName: 'Miora Ravelo',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 12,
          },
          {
            traineeId: 'TR-013',
            traineeName: 'Hery Randria',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 8,
          },
        ],
      },
      {
        id: 'E-007',
        title: 'Simulation client',
        maxScore: 25,
        coefficient: 2,
        results: [
          {
            traineeId: 'TR-003',
            traineeName: 'Sarah Andry',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 19,
          },
          {
            traineeId: 'TR-004',
            traineeName: 'Jean Koto',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 9,
          },
          {
            traineeId: 'TR-005',
            traineeName: 'Lova Rana',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 1,
          },
          {
            traineeId: 'TR-010',
            traineeName: 'Niry Rajaonarison',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 22,
          },
          {
            traineeId: 'TR-011',
            traineeName: 'Tiana Andriamaro',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 15,
          },
          {
            traineeId: 'TR-012',
            traineeName: 'Miora Ravelo',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 8,
          },
          {
            traineeId: 'TR-013',
            traineeName: 'Hery Randria',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 4,
          },
        ],
      },
      {
        id: 'E-008',
        title: 'Évaluation finale',
        maxScore: 35,
        coefficient: 3,
        results: [
          {
            traineeId: 'TR-003',
            traineeName: 'Sarah Andry',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 27,
          },
          {
            traineeId: 'TR-004',
            traineeName: 'Jean Koto',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 21,
          },
          {
            traineeId: 'TR-005',
            traineeName: 'Lova Rana',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 35,
          },
          {
            traineeId: 'TR-010',
            traineeName: 'Niry Rajaonarison',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 30,
          },
          {
            traineeId: 'TR-011',
            traineeName: 'Tiana Andriamaro',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 24,
          },
          {
            traineeId: 'TR-012',
            traineeName: 'Miora Ravelo',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 14,
          },
          {
            traineeId: 'TR-013',
            traineeName: 'Hery Randria',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 7,
          },
        ],
      },
    ],
  },

  // ── sf-001 · Introduction à React ────────────────────────────────────────
  {
    formationId: 'sf-001',
    evaluations: [
      {
        id: 'E-009',
        title: 'Quiz composants',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'TR-014',
            traineeName: 'Ravo Randrianarisoa',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 18,
          },
          {
            traineeId: 'TR-017',
            traineeName: 'Mialy R.',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 12,
          },
        ],
      },
      {
        id: 'E-010',
        title: 'Projet final',
        maxScore: 40,
        coefficient: 3,
        results: [
          {
            traineeId: 'TR-014',
            traineeName: 'Ravo Randrianarisoa',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 35,
          },
          {
            traineeId: 'TR-017',
            traineeName: 'Mialy R.',
            clientId: 'tenant-001',
            clientName: 'Acme Corp',
            score: 28,
          },
        ],
      },
    ],
  },

  // ── sf-003 · Node.js pour Débutants ──────────────────────────────────────
  {
    formationId: 'sf-003',
    evaluations: [
      {
        id: 'E-011',
        title: 'Quiz API REST',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'TR-015',
            traineeName: 'Mila Rakotoarison',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 8,
          },
          {
            traineeId: 'TR-018',
            traineeName: 'Faly R.',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 6,
          },
        ],
      },
      {
        id: 'E-012',
        title: 'Mini-projet',
        maxScore: 30,
        coefficient: 2,
        results: [
          {
            traineeId: 'TR-015',
            traineeName: 'Mila Rakotoarison',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 11,
          },
          {
            traineeId: 'TR-018',
            traineeName: 'Faly R.',
            clientId: 'tenant-002',
            clientName: 'Beta School',
            score: 9,
          },
        ],
      },
    ],
  },

  // ── sf-005 · DevOps & CI/CD ───────────────────────────────────────────────
  {
    formationId: 'sf-005',
    evaluations: [
      {
        id: 'E-013',
        title: 'QCM pipeline',
        maxScore: 20,
        coefficient: 1,
        results: [
          {
            traineeId: 'TR-016',
            traineeName: 'Tojo Ratsimba',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 15,
          },
          {
            traineeId: 'TR-019',
            traineeName: 'Liantsoa R.',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 10,
          },
        ],
      },
      {
        id: 'E-014',
        title: 'Lab Docker',
        maxScore: 40,
        coefficient: 2,
        results: [
          {
            traineeId: 'TR-016',
            traineeName: 'Tojo Ratsimba',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 28,
          },
          {
            traineeId: 'TR-019',
            traineeName: 'Liantsoa R.',
            clientId: 'tenant-003',
            clientName: 'Innova Plus',
            score: 22,
          },
        ],
      },
    ],
  },
];
