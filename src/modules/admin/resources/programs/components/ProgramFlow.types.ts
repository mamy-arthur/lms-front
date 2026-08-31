import type { Node, Edge } from '@xyflow/react';
import type { EvaluationConfig } from './dialog/AddEvaluationDialog';
import type {
  ApiProgressionRule,
  CreateProgressionRulePayload,
  ProgressionCondition,
  ProgressionNodeRef,
  UpdateProgressionRulePayload,
} from '@/shared/types/progression-rule.types';
import type {
  CreateEvaluationPayload,
  UpdateEvaluationPayload,
} from '@/shared/api/evaluations.api';

export type StepType =
  'email' | 'module' | 'evaluation-intermediate' | 'evaluation-final' | 'attestation';

export type StepNodeData = {
  stepType: StepType;
  label: string;
  moduleId?: string;
  attestationId?: string;
  emailTemplateId?: string;
  emailTemplateName?: string;
  evaluationId?: string;
  evaluationConfig?: Omit<EvaluationConfig, 'stepType'>;
};

export type StepNode = Node<StepNodeData, 'programStep'>;

export type ProgressionRuleData = {
  progressionRuleId: string;
  condition: ProgressionCondition;
  failureTargetNodeId: string | null;
  maxAttempts: number | null;
  exhaustedTargetNodeId: string | null;
};

export type EdgeRuleData = {
  kind?: 'retake';
  retakeForRuleId?: string;
  retakeForEdgeId?: string;
  progressionRule?: ProgressionRuleData;
};

// ─── Payload Types ────────────────────────────────────────────────────────────

type StepPosition = { x: number; y: number };

export type EmailStepPayload = {
  id: string;
  type: 'email';
  position: StepPosition;
  emailTemplateId: string | undefined;
  emailTemplateName: string | undefined;
};

export type ModuleStepPayload = {
  id: string;
  type: 'module';
  position: StepPosition;
  label: string;
  moduleId: string | undefined;
};

export type EvaluationStepPayload = {
  id: string;
  type: 'evaluation-intermediate' | 'evaluation-final';
  position: StepPosition;
  label: string;
  title: string;
  evaluationId?: string;
  questionBankIds: string[];
  questionBankNames: string[];
  questionCount: number;
  attemptCount: number;
  durationEnabled: boolean;
  durationHours: number;
  durationMinutes: number;
};

export type AttestationStepPayload = {
  id: string;
  type: 'attestation';
  position: StepPosition;
  label: string;
  attestationId: string | undefined;
};

export type FlowStepPayload =
  EmailStepPayload | ModuleStepPayload | EvaluationStepPayload | AttestationStepPayload;

export type FlowConnectionPayload = {
  sourceId: string;
  targetId: string;
  estReprise: boolean;
  progressionRule?: {
    ruleId: string | null;
    condition: ProgressionCondition;
    targetOnSuccess: ProgressionNodeRef;
    targetOnFailure: ProgressionNodeRef | null;
    maxAttempts: number | null;
    targetOnExhausted: ProgressionNodeRef | null;
  };
};

export type ProgramFlowPayload = {
  /** Étapes ordonnées du parcours (email de démarrage inclus) */
  etapes: FlowStepPayload[];
  /** Connexions entre les étapes avec leurs règles */
  connexions: FlowConnectionPayload[];
};

export type ProgramFlowHandle = {
  getPayload: () => ProgramFlowPayload;
  getRawFlow: () => {
    nodes: StepNode[];
    edges: Edge<EdgeRuleData>[];
    nodeOrder: string[];
  };
};

export type ProgramFlowProps = {
  initialNodes?: StepNode[];
  initialEdges?: Edge<EdgeRuleData>[];
  initialNodeOrder?: string[];
  onModulesChange?: (hasModules: boolean) => void;
  onModuleAdd?: (moduleId: string, position: { x: number; y: number }) => Promise<void>;
  onModuleRemove?: (moduleId: string) => Promise<void>;
  onModuleMove?: (moduleId: string, position: { x: number; y: number }) => Promise<void>;
  onEvalCreate?: (data: CreateEvaluationPayload) => Promise<string>;
  onEvalDelete?: (evaluationId: string) => Promise<void>;
  onEvalUpdate?: (evaluationId: string, payload: UpdateEvaluationPayload) => Promise<void>;
  onEvalMove?: (evaluationId: string, position: { x: number; y: number }) => Promise<void>;
  onMailTemplateAssign?: (
    mailTemplateId: string,
    position: { x: number; y: number },
  ) => Promise<void>;
  onCertificateAssign?: (
    certificateId: string,
    position: { x: number; y: number },
  ) => Promise<void>;
  onCertificateDetach?: () => Promise<void>;
  onMailTemplateMove?: (position: { x: number; y: number }) => Promise<void>;
  onCertificateMove?: (position: { x: number; y: number }) => Promise<void>;
  learningPathId?: string;
  /** When true the flow is read-only (the learning path has already been sold). */
  isLocked?: boolean;
  onProgressionRuleCreate?: (
    learningPathId: string,
    payload: CreateProgressionRulePayload,
  ) => Promise<ApiProgressionRule>;
  onProgressionRuleUpdate?: (
    ruleId: string,
    learningPathId: string,
    payload: UpdateProgressionRulePayload,
  ) => Promise<ApiProgressionRule>;
  onProgressionRuleDeactivate?: (ruleId: string, learningPathId: string) => Promise<void>;
};
