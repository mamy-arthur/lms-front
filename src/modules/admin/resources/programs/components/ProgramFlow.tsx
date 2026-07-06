'use client';

import { createContext, forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getSmoothStepPath,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  EdgeChange,
  EdgeProps,
  Node,
  NodeChange,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Award, BadgeCheck, BookOpen, ClipboardCheck, Mail, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { AccessRulesDialog, type AccessRules } from './dialog/AccessRulesDialog';
import {
  AttestationRulesDialog,
  type AttestationRules,
  type NodeOption,
} from './dialog/AttestationRulesDialog';
import { SelectModuleDialog, type ModuleItem } from './dialog/SelectModuleDialog';
import { AddEvaluationDialog, type EvaluationConfig } from './dialog/AddEvaluationDialog';
import { SelectAttestationDialog, type AttestationItem } from './dialog/SelectAttestationDialog';
import {
  SelectEmailTemplateDialog,
  type EmailTemplate,
} from './dialog/SelectEmailTemplateDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = 'email' | 'module' | 'evaluation-intermediate' | 'evaluation-final' | 'attestation';

type StepNodeData = {
  stepType: StepType;
  label: string;
  moduleId?: string;
  attestationId?: string;
  emailTemplateId?: string;
  emailTemplateName?: string;
  evaluationConfig?: Omit<EvaluationConfig, 'stepType'>;
};

type StepNode = Node<StepNodeData, 'programStep'>;

type EdgeRuleData = {
  kind?: 'retake';
  accessRules?: AccessRules;
  attestationRules?: AttestationRules;
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
  questionBankId: string | null;
  questionBankName: string | null;
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
  | EmailStepPayload
  | ModuleStepPayload
  | EvaluationStepPayload
  | AttestationStepPayload;

export type AccessRulesPayload = {
  modulePrecedentTermine: boolean;
  tousLesAutresModulesTermines: boolean;
  modulePrecedentScoreMinimumAtteint: boolean;
  /** Valeur du score minimum — non null uniquement si `modulePrecedentScoreMinimumAtteint` est vrai */
  scoreMinimum: number | null;
};

export type AttestationRulesPayload = {
  scoreMoyenRequis: boolean;
  /** Non null uniquement si `scoreMoyenRequis` est vrai */
  scoreMoyenMinimum: number | null;
  scoreFinalRequis: boolean;
  /** Non null uniquement si `scoreFinalRequis` est vrai */
  scoreFinalMinimum: number | null;
  aucuneRegle: boolean;
  reprise: boolean;
  /** Non null uniquement si `reprise` est vrai */
  repriseVersNoeudId: string | null;
};

export type FlowConnectionPayload = {
  sourceId: string;
  targetId: string;
  estReprise: boolean;
  reglesAcces?: AccessRulesPayload;
  reglesAttestation?: AttestationRulesPayload;
};

export type ProgramFlowPayload = {
  /** Étapes ordonnées du parcours (email de démarrage inclus) */
  etapes: FlowStepPayload[];
  /** Connexions entre les étapes avec leurs règles */
  connexions: FlowConnectionPayload[];
};

export type ProgramFlowHandle = {
  getPayload: () => ProgramFlowPayload;
};

// ─── Step config ──────────────────────────────────────────────────────────────

type StepConfig = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  iconColor: string;
  badgeClass: string;
  badgeLabel: string;
};

const STEP_CONFIG: Record<StepType, StepConfig> = {
  email: {
    label: 'Email de démarrage',
    Icon: Mail,
    border: 'border-violet-300',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    badgeClass: 'border-violet-200 bg-violet-100 text-violet-700',
    badgeLabel: 'Email',
  },
  module: {
    label: 'Module',
    Icon: BookOpen,
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeClass: 'border-blue-200 bg-blue-100 text-blue-700',
    badgeLabel: 'Module',
  },
  'evaluation-intermediate': {
    label: 'Évaluation intermédiaire',
    Icon: ClipboardCheck,
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    badgeClass: 'border-orange-200 bg-orange-100 text-orange-700',
    badgeLabel: 'Intermédiaire',
  },
  'evaluation-final': {
    label: 'Évaluation finale',
    Icon: Award,
    border: 'border-red-300',
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeClass: 'border-red-200 bg-red-100 text-red-700',
    badgeLabel: 'Finale',
  },
  attestation: {
    label: 'Attestation',
    Icon: BadgeCheck,
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    badgeClass: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    badgeLabel: 'Attestation',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const FlowActionsContext = createContext<{
  onDeleteNode: (id: string) => void;
  onConfigureEdge: (edgeId: string) => void;
  onEditNode: (id: string) => void;
}>({ onDeleteNode: () => {}, onConfigureEdge: () => {}, onEditNode: () => {} });

// ─── Custom Node ──────────────────────────────────────────────────────────────

function ProgramStepNode({ id, data, isConnectable }: NodeProps<StepNode>) {
  const { onDeleteNode, onEditNode } = useContext(FlowActionsContext);
  const cfg = STEP_CONFIG[data.stepType];
  const { Icon } = cfg;
  const isEmail = data.stepType === 'email';

  return (
    <div
      className={cn(
        'min-w-55 cursor-pointer rounded-md border px-4 py-3 shadow-sm',
        cfg.border,
        cfg.bg,
      )}
      onClick={() => onEditNode(id)}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', cfg.iconColor)} />
          <span className="truncate text-sm font-semibold text-foreground">{data.label}</span>
        </div>
        {!isEmail && (
          <Button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(id);
            }}
            className="flex size-5 shrink-0 bg-gray-50 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-black/10 hover:text-red-500"
            aria-label="Supprimer ce nœud"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      <div className="mt-2">
        <Badge variant="outline" className={cn('text-xs', cfg.badgeClass)}>
          {cfg.badgeLabel}
        </Badge>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}

// nodeTypes must be stable (defined outside component)
const nodeTypes = { programStep: ProgramStepNode };

// ─── Custom Edge ──────────────────────────────────────────────────────────────

function ConfigurableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const { onConfigureEdge } = useContext(FlowActionsContext);
  const ruleData = data as EdgeRuleData | undefined;
  const isRetake = ruleData?.kind === 'retake';

  const hasRules =
    (ruleData?.accessRules &&
      (ruleData.accessRules.prevModuleCompleted ||
        ruleData.accessRules.allModulesCompleted ||
        ruleData.accessRules.prevModuleMinScore)) ||
    (ruleData?.attestationRules &&
      (ruleData.attestationRules.avgScore ||
        ruleData.attestationRules.finalScore ||
        ruleData.attestationRules.noRule ||
        ruleData.attestationRules.retake));

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = isRetake
    ? { stroke: '#ef4444', strokeDasharray: '6 3', ...style }
    : hasRules
      ? { stroke: '#6366f1', strokeWidth: 2, ...style }
      : style;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {!isRetake && (
        <EdgeLabelRenderer>
          <button
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={
              hasRules
                ? 'nodrag nopan flex size-5 items-center justify-center rounded-full border-2 border-indigo-400 bg-indigo-50 shadow-sm transition-colors hover:bg-indigo-100'
                : 'nodrag nopan flex size-5 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted'
            }
            onClick={(e) => {
              e.stopPropagation();
              onConfigureEdge(id);
            }}
            title="Configurer les règles d'accès"
          >
            <Settings2
              className={hasRules ? 'size-3 text-indigo-500' : 'size-3 text-muted-foreground'}
            />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// edgeTypes must be stable (defined outside component)
const edgeTypes = { configurableEdge: ConfigurableEdge };

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_X = 300;
const NODE_GAP = 150;
let _counter = 0;
const genId = () => `step-${++_counter}`;

const EMAIL_NODE_ID = 'email-start';

const initialEmailNode: StepNode = {
  id: EMAIL_NODE_ID,
  type: 'programStep',
  position: { x: CANVAS_X, y: 0 },
  data: { stepType: 'email', label: 'Email de démarrage' },
};

// ─── ProgramFlow ──────────────────────────────────────────────────────────────

const ProgramFlow = forwardRef<ProgramFlowHandle>(function ProgramFlow(_, ref) {
  const [nodes, setNodes] = useState<StepNode[]>([initialEmailNode]);
  const [edges, setEdges] = useState<Edge<EdgeRuleData>[]>([]);
  const [nodeOrder, setNodeOrder] = useState<string[]>([EMAIL_NODE_ID]);

  // Always-fresh refs — avoids stale closures in stable callbacks
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const nodeOrderRef = useRef(nodeOrder);
  nodeOrderRef.current = nodeOrder;

  // ── Add-node dialog states ──
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [attestationDialogOpen, setAttestationDialogOpen] = useState(false);

  // ── Rule configuration dialog states ──
  const [accessDialog, setAccessDialog] = useState<{
    edgeId: string;
    sourceNodeId: string;
    initialRules?: AccessRules;
  } | null>(null);

  const [attestationDialog, setAttestationDialog] = useState<{
    edgeId: string;
    attestationNodeId: string;
    incomingSourceNodeId: string;
    initialRules?: AttestationRules;
  } | null>(null);

  // ── Edit-node dialog states ──
  const [editModuleDialog, setEditModuleDialog] = useState<{
    nodeId: string;
    moduleId?: string;
  } | null>(null);

  const [editEvalDialog, setEditEvalDialog] = useState<{
    nodeId: string;
    config: EvaluationConfig;
    hasFinalEval: boolean;
  } | null>(null);

  const [editAttestationDialog, setEditAttestationDialog] = useState<{
    nodeId: string;
    attestationId?: string;
  } | null>(null);

  const [editEmailDialog, setEditEmailDialog] = useState<{
    nodeId: string;
    emailTemplateId?: string;
  } | null>(null);

  // ── Business rule flags ──
  const { hasFinalEval, hasAttestation, hasModule } = useMemo(
    () => ({
      hasModule: nodes.some((n) => n.data.stepType === 'module'),
      hasFinalEval: nodes.some((n) => n.data.stepType === 'evaluation-final'),
      hasAttestation: nodes.some((n) => n.data.stepType === 'attestation'),
    }),
    [nodes],
  );

  // ── IDs of modules already present in the flow ──
  const usedModuleIds = useMemo(
    () => nodes.filter((n) => n.data.moduleId).map((n) => n.data.moduleId!),
    [nodes],
  );

  // ── Retake target options (all non-attestation nodes) ──
  const retakeNodeOptions: NodeOption[] = useMemo(
    () =>
      nodes
        .filter((n) => n.data.stepType !== 'attestation')
        .map((n) => ({
          id: n.id,
          label: n.data.label,
          stepType: n.data.stepType as NodeOption['stepType'],
        })),
    [nodes],
  );

  // ── Open the right dialog when an edge settings button is clicked ──
  const onConfigureEdge = useCallback((edgeId: string) => {
    const edge = edgesRef.current.find((e) => e.id === edgeId);
    if (!edge) return;

    const targetNode = nodesRef.current.find((n) => n.id === edge.target);

    if (targetNode?.data.stepType === 'attestation') {
      setAttestationDialog({
        edgeId,
        attestationNodeId: edge.target,
        incomingSourceNodeId: edge.source,
        initialRules: edge.data?.attestationRules,
      });
    } else {
      setAccessDialog({
        edgeId,
        sourceNodeId: edge.source,
        initialRules: edge.data?.accessRules,
      });
    }
  }, []);

  // ── Save access rules ──
  const handleAccessSave = useCallback(
    (rules: AccessRules) => {
      if (!accessDialog) return;
      setEdges((eds) =>
        eds.map((e) =>
          e.id === accessDialog.edgeId ? { ...e, data: { ...e.data, accessRules: rules } } : e,
        ),
      );
      setAccessDialog(null);
    },
    [accessDialog],
  );

  // ── Save attestation rules (also handles retake edge) ──
  const handleAttestationSave = useCallback(
    (rules: AttestationRules) => {
      if (!attestationDialog) return;
      const { edgeId, attestationNodeId, incomingSourceNodeId } = attestationDialog;
      const retakePrefix = `retake-${attestationNodeId}-`;

      setEdges((eds) => {
        const withRules = eds.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                data: { ...e.data, attestationRules: rules },
              }
            : e,
        );
        const withoutOldRetake = withRules.filter((e) => !e.id.startsWith(retakePrefix));

        if (rules.retake && rules.retakeTargetNodeId) {
          return [
            ...withoutOldRetake,
            {
              id: `${retakePrefix}${rules.retakeTargetNodeId}`,
              source: incomingSourceNodeId,
              target: rules.retakeTargetNodeId,
              type: 'configurableEdge',
              animated: false,
              data: { kind: 'retake' as const },
            },
          ];
        }
        return withoutOldRetake;
      });

      setAttestationDialog(null);
    },
    [attestationDialog],
  );

  // ── Delete a node and reconnect its neighbours ──
  const onDeleteNode = useCallback((nodeId: string) => {
    // The email start node is mandatory and cannot be removed
    if (nodeId === EMAIL_NODE_ID) return;

    const order = nodeOrderRef.current;
    const idx = order.indexOf(nodeId);
    const prev = order[idx - 1] ?? null;
    const next = order[idx + 1] ?? null;

    setNodes((nds) => nds.filter((n) => n.id !== nodeId));

    setEdges((eds) => {
      const filtered = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
      if (prev && next) {
        return [
          ...filtered,
          {
            id: `e-${prev}-${next}`,
            source: prev,
            target: next,
            type: 'configurableEdge',
            animated: true,
          },
        ];
      }
      return filtered;
    });

    setNodeOrder((o) => o.filter((id) => id !== nodeId));
  }, []);

  // ── Open the right edit dialog when a node is clicked ──
  const onEditNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    switch (node.data.stepType) {
      case 'email':
        setEditEmailDialog({
          nodeId,
          emailTemplateId: node.data.emailTemplateId,
        });
        break;
      case 'module':
        setEditModuleDialog({ nodeId, moduleId: node.data.moduleId });
        break;
      case 'evaluation-intermediate':
      case 'evaluation-final':
        setEditEvalDialog({
          nodeId,
          config: {
            stepType: node.data.stepType,
            durationEnabled: node.data.evaluationConfig?.durationEnabled ?? false,
            durationHours: node.data.evaluationConfig?.durationHours ?? 0,
            durationMinutes: node.data.evaluationConfig?.durationMinutes ?? 30,
            questionCount: node.data.evaluationConfig?.questionCount ?? 20,
            attemptCount: node.data.evaluationConfig?.attemptCount ?? 1,
            questionBankId: node.data.evaluationConfig?.questionBankId ?? null,
            questionBankName: node.data.evaluationConfig?.questionBankName ?? null,
          },
          hasFinalEval: nodesRef.current.some(
            (n) => n.data.stepType === 'evaluation-final' && n.id !== nodeId,
          ),
        });
        break;
      case 'attestation':
        setEditAttestationDialog({ nodeId, attestationId: node.data.attestationId });
        break;
    }
  }, []);

  // ── Append a new step to the end of the chain ──
  const addStep = useCallback(
    (
      stepType: StepType,
      opts?: {
        label?: string;
        moduleId?: string;
        attestationId?: string;
        evaluationConfig?: Omit<EvaluationConfig, 'stepType'>;
      },
    ) => {
      const id = genId();
      const order = nodeOrderRef.current;
      const currentNodes = nodesRef.current;
      const lastId = order.at(-1) ?? null;
      const lastNode = lastId ? currentNodes.find((n) => n.id === lastId) : null;
      const y = lastNode ? lastNode.position.y + NODE_GAP : 0;
      const count = currentNodes.filter((n) => n.data.stepType === stepType).length + 1;

      const newNode: StepNode = {
        id,
        type: 'programStep',
        position: { x: CANVAS_X, y },
        data: {
          stepType,
          label: opts?.label ?? `${STEP_CONFIG[stepType].label} ${count}`,
          moduleId: opts?.moduleId,
          attestationId: opts?.attestationId,
          evaluationConfig: opts?.evaluationConfig,
        },
      };

      setNodes((nds) => [...nds, newNode]);

      if (lastId) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${lastId}-${id}`,
            source: lastId,
            target: id,
            type: 'configurableEdge',
            animated: true,
          },
        ]);
      }

      setNodeOrder((o) => [...o, id]);
    },
    [],
  );

  // ── Handle module selection ──
  const handleModuleSelect = useCallback(
    (mod: ModuleItem) => {
      addStep('module', { label: mod.name, moduleId: mod.id });
    },
    [addStep],
  );

  // ── Handle evaluation configuration ──
  const handleEvalConfirm = useCallback(
    (cfg: EvaluationConfig) => {
      const { stepType, ...rest } = cfg;
      addStep(stepType, {
        label: cfg.questionBankName ?? undefined,
        evaluationConfig: rest,
      });
    },
    [addStep],
  );

  // ── Handle attestation selection ──
  const handleAttestationSelect = useCallback(
    (att: AttestationItem) => {
      addStep('attestation', {
        label: att.name,
        attestationId: att.id,
      });
    },
    [addStep],
  );

  // ── Edit handlers ──
  const handleEditModuleSave = useCallback(
    (mod: ModuleItem) => {
      if (!editModuleDialog) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editModuleDialog.nodeId
            ? { ...n, data: { ...n.data, label: mod.name, moduleId: mod.id } }
            : n,
        ),
      );
      setEditModuleDialog(null);
    },
    [editModuleDialog],
  );

  const handleEditEvalSave = useCallback(
    (cfg: EvaluationConfig) => {
      if (!editEvalDialog) return;
      const { stepType, ...rest } = cfg;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editEvalDialog.nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  stepType,
                  label: cfg.questionBankName ?? n.data.label,
                  evaluationConfig: rest,
                },
              }
            : n,
        ),
      );
      setEditEvalDialog(null);
    },
    [editEvalDialog],
  );

  const handleEditAttestationSave = useCallback(
    (att: AttestationItem) => {
      if (!editAttestationDialog) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editAttestationDialog.nodeId
            ? { ...n, data: { ...n.data, label: att.name, attestationId: att.id } }
            : n,
        ),
      );
      setEditAttestationDialog(null);
    },
    [editAttestationDialog],
  );

  const handleEditEmailSave = useCallback(
    (template: EmailTemplate) => {
      if (!editEmailDialog) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editEmailDialog.nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: template.name,
                  emailTemplateId: template.id,
                  emailTemplateName: template.name,
                },
              }
            : n,
        ),
      );
      setEditEmailDialog(null);
    },
    [editEmailDialog],
  );

  // ── Used module IDs excluding the one currently being edited ──
  const editModuleUsedIds = useMemo(
    () => usedModuleIds.filter((id) => id !== editModuleDialog?.moduleId),
    [usedModuleIds, editModuleDialog?.moduleId],
  );

  // ── Build the serializable payload ──
  const buildPayload = useCallback((): ProgramFlowPayload => {
    const etapes: FlowStepPayload[] = nodeOrderRef.current.map((nodeId) => {
      const node = nodesRef.current.find((n) => n.id === nodeId)!;
      const d = node.data;

      switch (d.stepType) {
        case 'email':
          return { id: nodeId, type: 'email', position: node.position, emailTemplateId: d.emailTemplateId, emailTemplateName: d.emailTemplateName };
        case 'module':
          return { id: nodeId, type: 'module', position: node.position, label: d.label, moduleId: d.moduleId };
        case 'evaluation-intermediate':
        case 'evaluation-final':
          return {
            id: nodeId,
            type: d.stepType,
            position: node.position,
            label: d.label,
            questionBankId: d.evaluationConfig?.questionBankId ?? null,
            questionBankName: d.evaluationConfig?.questionBankName ?? null,
            questionCount: d.evaluationConfig?.questionCount ?? 0,
            attemptCount: d.evaluationConfig?.attemptCount ?? 0,
            durationEnabled: d.evaluationConfig?.durationEnabled ?? false,
            durationHours: d.evaluationConfig?.durationHours ?? 0,
            durationMinutes: d.evaluationConfig?.durationMinutes ?? 0,
          };
        case 'attestation':
          return { id: nodeId, type: 'attestation', position: node.position, label: d.label, attestationId: d.attestationId };
      }
    });

    const connexions: FlowConnectionPayload[] = edgesRef.current.map((edge) => {
      const ruleData = edge.data as EdgeRuleData | undefined;
      const isRetake = ruleData?.kind === 'retake';

      let reglesAcces: AccessRulesPayload | undefined;
      if (!isRetake && ruleData?.accessRules) {
        const r = ruleData.accessRules;
        if (r.prevModuleCompleted || r.allModulesCompleted || r.prevModuleMinScore) {
          reglesAcces = {
            modulePrecedentTermine: r.prevModuleCompleted,
            tousLesAutresModulesTermines: r.allModulesCompleted,
            modulePrecedentScoreMinimumAtteint: r.prevModuleMinScore,
            scoreMinimum: r.prevModuleMinScore ? r.prevModuleMinScoreValue : null,
          };
        }
      }

      let reglesAttestation: AttestationRulesPayload | undefined;
      if (!isRetake && ruleData?.attestationRules) {
        const r = ruleData.attestationRules;
        if (r.avgScore || r.finalScore || r.noRule || r.retake) {
          reglesAttestation = {
            scoreMoyenRequis: r.avgScore,
            scoreMoyenMinimum: r.avgScore ? r.avgScoreMin : null,
            scoreFinalRequis: r.finalScore,
            scoreFinalMinimum: r.finalScore ? r.finalScoreMin : null,
            aucuneRegle: r.noRule,
            reprise: r.retake,
            repriseVersNoeudId: r.retake ? r.retakeTargetNodeId : null,
          };
        }
      }

      const conn: FlowConnectionPayload = {
        sourceId: edge.source,
        targetId: edge.target,
        estReprise: isRetake,
      };
      if (reglesAcces) conn.reglesAcces = reglesAcces;
      if (reglesAttestation) conn.reglesAttestation = reglesAttestation;
      return conn;
    });

    return { etapes, connexions };
  }, []);

  useImperativeHandle(ref, () => ({ getPayload: buildPayload }), [buildPayload]);

  // ── ReactFlow handlers ──
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as StepNode[]),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const flowActions = useMemo(
    () => ({ onDeleteNode, onConfigureEdge, onEditNode }),
    [onDeleteNode, onConfigureEdge, onEditNode],
  );

  return (
    <FlowActionsContext.Provider value={flowActions}>
      <div className="flex h-175 flex-col overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <Button
            variant="outline"
            disabled={hasFinalEval || hasAttestation}
            onClick={() => setModuleDialogOpen(true)}
            className="gap-1.5"
          >
            <BookOpen className="size-3.5" />
            Module
          </Button>

          <Button
            variant="outline"
            disabled={!hasModule || hasFinalEval || hasAttestation}
            onClick={() => setEvalDialogOpen(true)}
            className="gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-700"
          >
            <ClipboardCheck className="size-3.5" />
            Évaluation
          </Button>

          <Button
            variant="outline"
            disabled={!hasModule || !hasFinalEval || hasAttestation}
            onClick={() => setAttestationDialogOpen(true)}
            className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <BadgeCheck className="size-3.5" />
            Attestation
          </Button>

          <span className="ml-auto text-xs text-muted-foreground">
            {nodes.filter((n) => n.data.stepType !== 'email').length} étape{nodes.filter((n) => n.data.stepType !== 'email').length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Canvas ── */}
        <div className="relative flex-1">
          {nodes.every((n) => n.data.stepType === 'email') && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <BookOpen className="mb-2 size-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Canvas vide</p>
              <p className="text-xs text-muted-foreground/60">
                Ajoutez un module pour commencer votre parcours
              </p>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.8, maxZoom: 0.9 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* ── Add-node dialogs ── */}
      <SelectModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        usedModuleIds={usedModuleIds}
        onSelect={handleModuleSelect}
      />
      <AddEvaluationDialog
        open={evalDialogOpen}
        onOpenChange={setEvalDialogOpen}
        hasFinalEval={hasFinalEval}
        onConfirm={handleEvalConfirm}
      />
      <SelectAttestationDialog
        open={attestationDialogOpen}
        onOpenChange={setAttestationDialogOpen}
        onSelect={handleAttestationSelect}
      />

      {/* ── Access rules dialog (modules & evaluations) ── */}
      <AccessRulesDialog
        open={accessDialog !== null}
        onOpenChange={(open) => {
          if (!open) setAccessDialog(null);
        }}
        initialRules={accessDialog?.initialRules}
        onSave={handleAccessSave}
      />

      {/* ── Attestation rules dialog ── */}
      <AttestationRulesDialog
        open={attestationDialog !== null}
        onOpenChange={(open) => {
          if (!open) setAttestationDialog(null);
        }}
        initialRules={attestationDialog?.initialRules}
        nodeOptions={retakeNodeOptions}
        onSave={handleAttestationSave}
      />

      {/* ── Edit-node dialogs ── */}
      <SelectEmailTemplateDialog
        key={editEmailDialog?.nodeId}
        open={editEmailDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditEmailDialog(null);
        }}
        initialTemplateId={editEmailDialog?.emailTemplateId}
        onSelect={handleEditEmailSave}
      />
      <SelectModuleDialog
        key={editModuleDialog?.nodeId}
        open={editModuleDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditModuleDialog(null);
        }}
        usedModuleIds={editModuleUsedIds}
        onSelect={handleEditModuleSave}
      />
      <AddEvaluationDialog
        key={editEvalDialog?.nodeId}
        open={editEvalDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditEvalDialog(null);
        }}
        hasFinalEval={editEvalDialog?.hasFinalEval ?? false}
        initialConfig={editEvalDialog?.config}
        onConfirm={handleEditEvalSave}
      />
      <SelectAttestationDialog
        key={editAttestationDialog?.nodeId}
        open={editAttestationDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditAttestationDialog(null);
        }}
        initialAttestationId={editAttestationDialog?.attestationId}
        onSelect={handleEditAttestationSave}
      />
    </FlowActionsContext.Provider>
  );
});

export default ProgramFlow;
