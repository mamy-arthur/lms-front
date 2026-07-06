import type { Edge, Node } from '@xyflow/react';
import type { StepNodeData, EdgeRuleData } from '../components/ProgramFlow';
import type { StoredProgram } from '../types';

type StepNode = Node<StepNodeData, 'programStep'>;
type ProgramEdge = Edge<EdgeRuleData>;

// ─── Layout helpers ───────────────────────────────────────────────────────────

const X = 300;
const GAP = 150;

const n = {
  email(id: string, y: number, templateId: string, templateName: string): StepNode {
    return {
      id,
      type: 'programStep',
      position: { x: X, y },
      data: { stepType: 'email', label: templateName, emailTemplateId: templateId, emailTemplateName: templateName },
    };
  },

  module(id: string, y: number, label: string, moduleId: string): StepNode {
    return {
      id,
      type: 'programStep',
      position: { x: X, y },
      data: { stepType: 'module', label, moduleId },
    };
  },

  eval(
    id: string,
    y: number,
    type: 'evaluation-intermediate' | 'evaluation-final',
    bankId: string,
    bankName: string,
    questionCount: number,
    attemptCount: number,
    durationEnabled = false,
    durationHours = 0,
    durationMinutes = 30,
  ): StepNode {
    return {
      id,
      type: 'programStep',
      position: { x: X, y },
      data: {
        stepType: type,
        label: bankName,
        evaluationConfig: {
          durationEnabled,
          durationHours,
          durationMinutes,
          questionCount,
          attemptCount,
          questionBankId: bankId,
          questionBankName: bankName,
        },
      },
    };
  },

  attestation(id: string, y: number, label: string, attestationId: string): StepNode {
    return {
      id,
      type: 'programStep',
      position: { x: X, y },
      data: { stepType: 'attestation', label, attestationId },
    };
  },
};

function e(source: string, target: string, data: EdgeRuleData = {}): ProgramEdge {
  return { id: `e-${source}-${target}`, source, target, type: 'configurableEdge', animated: true, data };
}

// Pre-built edge rule presets
const prevCompleted: EdgeRuleData = {
  accessRules: { prevModuleCompleted: true, allModulesCompleted: false, prevModuleMinScore: false, prevModuleMinScoreValue: 50 },
};
const allCompleted: EdgeRuleData = {
  accessRules: { prevModuleCompleted: false, allModulesCompleted: true, prevModuleMinScore: false, prevModuleMinScoreValue: 50 },
};
const minScore = (value: number): EdgeRuleData => ({
  accessRules: { prevModuleCompleted: false, allModulesCompleted: false, prevModuleMinScore: true, prevModuleMinScoreValue: value },
});
const finalScore = (min: number): EdgeRuleData => ({
  attestationRules: { avgScore: false, avgScoreMin: 10, finalScore: true, finalScoreMin: min, noRule: false, retake: false, retakeTargetNodeId: null },
});
const avgScore = (min: number): EdgeRuleData => ({
  attestationRules: { avgScore: true, avgScoreMin: min, finalScore: false, finalScoreMin: 10, noRule: false, retake: false, retakeTargetNodeId: null },
});
const noRule: EdgeRuleData = {
  attestationRules: { avgScore: false, avgScoreMin: 10, finalScore: false, finalScoreMin: 10, noRule: true, retake: false, retakeTargetNodeId: null },
};

// ─── Program 1 : React Avancé ─────────────────────────────────────────────────
//  email → module(React Fond.) → module(TypeScript) → eval-int → eval-final → attestation

const p1: StoredProgram = {
  id: 'prog-1',
  status: 'Publié',
  formValues: {
    name: 'React Avancé',
    description: 'Maîtrisez React et TypeScript à travers une formation complète et progressive.',
    visible: true,
    deadline: new Date('2026-09-30'),
    category: 'tech',
    image: null,
    publishedAt: new Date('2026-01-15'),
    author: 'Jean Dupont',
    cost: '299',
    currency: 'EUR',
  },
  flow: {
    nodes: [
      n.email('p1-email', 0,              'et1', 'Bienvenue dans le parcours'),
      n.module('p1-m1',   GAP,            'React Fondamentaux',   'm2'),
      n.module('p1-m2',   GAP * 2,        'TypeScript Essentiel', 'm3'),
      n.eval('p1-ei',     GAP * 3, 'evaluation-intermediate', 'qb2', 'React & Hooks',     15, 2),
      n.eval('p1-ef',     GAP * 4, 'evaluation-final',        'qb1', 'JavaScript Avancé', 30, 1, true, 1, 30),
      n.attestation('p1-att', GAP * 5, 'Expert React', 'at4'),
    ],
    edges: [
      e('p1-email', 'p1-m1'),
      e('p1-m1',    'p1-m2',  prevCompleted),
      e('p1-m2',    'p1-ei',  allCompleted),
      e('p1-ei',    'p1-ef'),
      e('p1-ef',    'p1-att', finalScore(14)),
    ],
    nodeOrder: ['p1-email', 'p1-m1', 'p1-m2', 'p1-ei', 'p1-ef', 'p1-att'],
  },
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-20T14:30:00Z',
};

// ─── Program 2 : Docker & Kubernetes ─────────────────────────────────────────
//  email → module(Docker) → module(Kubernetes) → eval-final → attestation

const p2: StoredProgram = {
  id: 'prog-2',
  status: 'Brouillon',
  formValues: {
    name: 'Docker & Kubernetes',
    description: 'Apprenez à conteneuriser et orchestrer vos applications avec Docker et Kubernetes.',
    visible: false,
    deadline: new Date('2026-11-15'),
    category: 'tech',
    image: null,
    publishedAt: undefined,
    author: 'Marie Martin',
    cost: '199',
    currency: 'EUR',
  },
  flow: {
    nodes: [
      n.email('p2-email', 0,       'et2', 'Rappel de connexion'),
      n.module('p2-m1',   GAP,     'Docker & Conteneurisation', 'm5'),
      n.module('p2-m2',   GAP * 2, 'Kubernetes Avancé',         'm7'),
      n.eval('p2-ef',     GAP * 3, 'evaluation-final', 'qb3', 'Docker & Kubernetes', 25, 1),
      n.attestation('p2-att', GAP * 4, 'Ingénieur DevOps', 'at2'),
    ],
    edges: [
      e('p2-email', 'p2-m1'),
      e('p2-m1',    'p2-m2',  prevCompleted),
      e('p2-m2',    'p2-ef'),
      e('p2-ef',    'p2-att', finalScore(12)),
    ],
    nodeOrder: ['p2-email', 'p2-m1', 'p2-m2', 'p2-ef', 'p2-att'],
  },
  createdAt: '2026-02-10T09:00:00Z',
  updatedAt: '2026-02-10T09:00:00Z',
};

// ─── Program 3 : Scrum Master ─────────────────────────────────────────────────
//  email → module(Agile) → eval-int → module(Leadership) → eval-final → attestation

const p3: StoredProgram = {
  id: 'prog-3',
  status: 'Publié',
  formValues: {
    name: 'Scrum Master',
    description: 'Devenez un chef de projet agile certifié grâce à notre parcours intensif.',
    visible: true,
    deadline: new Date('2026-08-01'),
    category: 'business',
    image: null,
    publishedAt: new Date('2026-02-01'),
    author: 'Pierre Leroy',
    cost: '149',
    currency: 'EUR',
  },
  flow: {
    nodes: [
      n.email('p3-email', 0,       'et1', 'Bienvenue dans le parcours'),
      n.module('p3-m1',   GAP,     'Gestion de projet Agile', 'm8'),
      n.eval('p3-ei',     GAP * 2, 'evaluation-intermediate', 'qb4', 'Gestion de projet Agile', 10, 3),
      n.module('p3-m2',   GAP * 3, 'Leadership & Management', 'm9'),
      n.eval('p3-ef',     GAP * 4, 'evaluation-final',        'qb4', 'Gestion de projet Agile', 20, 1),
      n.attestation('p3-att', GAP * 5, 'Chef de Projet Digital', 'at3'),
    ],
    edges: [
      e('p3-email', 'p3-m1'),
      e('p3-m1',    'p3-ei',  prevCompleted),
      e('p3-ei',    'p3-m2'),
      e('p3-m2',    'p3-ef',  prevCompleted),
      e('p3-ef',    'p3-att', avgScore(12)),
    ],
    nodeOrder: ['p3-email', 'p3-m1', 'p3-ei', 'p3-m2', 'p3-ef', 'p3-att'],
  },
  createdAt: '2026-02-01T11:00:00Z',
  updatedAt: '2026-05-15T16:00:00Z',
};

// ─── Program 4 : Full-Stack JavaScript ───────────────────────────────────────
//  email → module(JS) → module(React) → module(TypeScript) → eval-final → attestation

const p4: StoredProgram = {
  id: 'prog-4',
  status: 'Brouillon',
  formValues: {
    name: 'Full-Stack JavaScript',
    description: "Du débutant au développeur full-stack avec JavaScript, TypeScript et React.",
    visible: false,
    deadline: undefined,
    category: 'tech',
    image: null,
    publishedAt: undefined,
    author: 'Sophie Bernard',
    cost: '0',
    currency: 'EUR',
  },
  flow: {
    nodes: [
      n.email('p4-email', 0,       'et1', 'Bienvenue dans le parcours'),
      n.module('p4-m1',   GAP,     'Introduction au JavaScript', 'm1'),
      n.module('p4-m2',   GAP * 2, 'React Fondamentaux',         'm2'),
      n.module('p4-m3',   GAP * 3, 'TypeScript Essentiel',       'm3'),
      n.eval('p4-ef',     GAP * 4, 'evaluation-final', 'qb1', 'JavaScript Avancé', 40, 2, true, 2, 0),
      n.attestation('p4-att', GAP * 5, 'Développeur Web Full-Stack', 'at1'),
    ],
    edges: [
      e('p4-email', 'p4-m1'),
      e('p4-m1',    'p4-m2', prevCompleted),
      e('p4-m2',    'p4-m3', prevCompleted),
      e('p4-m3',    'p4-ef', allCompleted),
      e('p4-ef',    'p4-att', noRule),
    ],
    nodeOrder: ['p4-email', 'p4-m1', 'p4-m2', 'p4-m3', 'p4-ef', 'p4-att'],
  },
  createdAt: '2026-03-05T08:00:00Z',
  updatedAt: '2026-03-05T08:00:00Z',
};

// ─── Program 5 : Cybersécurité Web ────────────────────────────────────────────
//  email → module(SQL) → eval-int → eval-final(OWASP) → attestation

const p5: StoredProgram = {
  id: 'prog-5',
  status: 'Archivé',
  formValues: {
    name: 'Cybersécurité Web',
    description: 'Protégez vos applications web en appliquant les pratiques OWASP.',
    visible: false,
    deadline: new Date('2026-06-30'),
    category: 'tech',
    image: null,
    publishedAt: new Date('2025-11-01'),
    author: 'Lucas Petit',
    cost: '249',
    currency: 'EUR',
  },
  flow: {
    nodes: [
      n.email('p5-email', 0,       'et4', "Invitation à l'évaluation"),
      n.module('p5-m1',   GAP,     'SQL & Bases de données',  'm4'),
      n.eval('p5-ei',     GAP * 2, 'evaluation-intermediate', 'qb5', 'SQL & NoSQL',          15, 2),
      n.eval('p5-ef',     GAP * 3, 'evaluation-final',        'qb6', 'Sécurité web (OWASP)', 20, 1, true, 1, 0),
      n.attestation('p5-att', GAP * 4, 'Cybersécurité Web', 'at6'),
    ],
    edges: [
      e('p5-email', 'p5-m1'),
      e('p5-m1',    'p5-ei', prevCompleted),
      e('p5-ei',    'p5-ef', minScore(12)),
      e('p5-ef',    'p5-att', finalScore(16)),
    ],
    nodeOrder: ['p5-email', 'p5-m1', 'p5-ei', 'p5-ef', 'p5-att'],
  },
  createdAt: '2025-11-01T10:00:00Z',
  updatedAt: '2026-06-30T12:00:00Z',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const MOCK_PROGRAMS: StoredProgram[] = [p1, p2, p3, p4, p5];
