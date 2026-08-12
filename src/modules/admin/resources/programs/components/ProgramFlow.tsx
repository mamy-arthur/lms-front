'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
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

import {
  Award,
  BadgeCheck,
  BookOpen,
  ClipboardCheck,
  Info,
  Lock,
  Mail,
  Settings2,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ProgressionRuleDialog,
  type NodeOption,
  type ProgressionRuleFormData,
} from './dialog/ProgressionRuleDialog';
import type {
  ProgressionCondition,
  ProgressionNodeRef,
  ProgressionNodeType,
} from '@/shared/types/progression-rule.types';
import { SelectModuleDialog, type ModuleItem } from './dialog/SelectModuleDialog';
import { AddEvaluationDialog, type EvaluationConfig } from './dialog/AddEvaluationDialog';
import { SelectAttestationDialog, type AttestationItem } from './dialog/SelectAttestationDialog';
import { SelectEmailTemplateDialog, type EmailTemplate } from './dialog/SelectEmailTemplateDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import type { CreateEvaluationPayload } from '@/shared/api/evaluations.api';
import { getApiErrorMessage } from '@/shared/lib/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = 'email' | 'module' | 'evaluation-intermediate' | 'evaluation-final' | 'attestation';

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
  onDeleteNode: (id: string) => void | Promise<void>;
  onConfigureEdge: (edgeId: string) => void;
  onEditNode: (id: string) => void;
}>({
  onDeleteNode: () => {},
  onConfigureEdge: () => {},
  onEditNode: () => {},
});

// ─── Custom Node ──────────────────────────────────────────────────────────────

function ProgramStepNode({ id, data, isConnectable }: NodeProps<StepNode>) {
  const { onDeleteNode, onEditNode } = useContext(FlowActionsContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cfg = STEP_CONFIG[data.stepType];
  const { Icon } = cfg;
  const isEmail = data.stepType === 'email';
  const isAttestation = data.stepType === 'attestation';

  const isConfigured =
    (data.stepType === 'email' && !!data.emailTemplateId) ||
    (data.stepType === 'module' && !!data.moduleId) ||
    ((data.stepType === 'evaluation-intermediate' || data.stepType === 'evaluation-final') &&
      !!data.evaluationId) ||
    (data.stepType === 'attestation' && !!data.attestationId);

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDeleteNode(id);
  };

  return (
    <div
      className={cn(
        'min-w-55 rounded-md border px-4 py-3 shadow-sm',
        isConfigured && !isEmail && !isAttestation ? 'cursor-default' : 'cursor-pointer',
        cfg.border,
        cfg.bg,
      )}
      onClick={isConfigured && !isEmail && !isAttestation ? undefined : () => onEditNode(id)}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', cfg.iconColor)} />
          <span className="truncate text-sm font-semibold text-foreground">{data.label}</span>
        </div>
        {!isEmail && (
          <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
            <PopoverTrigger asChild>
              <Button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen((v) => !v);
                }}
                className="flex size-5 shrink-0 bg-gray-50 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-black/10 hover:text-red-500"
                aria-label="Supprimer ce nœud"
              >
                <Trash2 className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              className="w-52 p-3"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-medium">Supprimer cette étape ?</p>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDelete();
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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

  const hasRules = !!ruleData?.progressionRule;

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
            {hasRules ? (
              <Lock className="size-3 text-indigo-500" />
            ) : (
              <Settings2 className="size-3 text-muted-foreground" />
            )}
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
  data: { stepType: 'email', label: "Choisir l'email de démarrage" },
};

// ─── ProgramFlow ──────────────────────────────────────────────────────────────

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
  onProgressionRuleCreate?: (
    learningPathId: string,
    payload: import('@/shared/types/progression-rule.types').CreateProgressionRulePayload,
  ) => Promise<import('@/shared/types/progression-rule.types').ApiProgressionRule>;
  onProgressionRuleUpdate?: (
    ruleId: string,
    learningPathId: string,
    payload: import('@/shared/types/progression-rule.types').UpdateProgressionRulePayload,
  ) => Promise<import('@/shared/types/progression-rule.types').ApiProgressionRule>;
  onProgressionRuleDeactivate?: (ruleId: string, learningPathId: string) => Promise<void>;
};

const ProgramFlow = forwardRef<ProgramFlowHandle, ProgramFlowProps>(function ProgramFlow(
  {
    initialNodes,
    initialEdges,
    initialNodeOrder,
    onModulesChange,
    onModuleAdd,
    onModuleRemove,
    onModuleMove,
    onEvalCreate,
    onEvalDelete,
    onEvalMove,
    onMailTemplateAssign,
    onCertificateAssign,
    onCertificateDetach,
    onMailTemplateMove,
    onCertificateMove,
    learningPathId,
    onProgressionRuleCreate,
    onProgressionRuleUpdate,
    onProgressionRuleDeactivate,
  },
  ref,
) {
  const [nodes, setNodes] = useState<StepNode[]>(initialNodes ?? [initialEmailNode]);
  const [edges, setEdges] = useState<Edge<EdgeRuleData>[]>(initialEdges ?? []);
  const [nodeOrder, setNodeOrder] = useState<string[]>(initialNodeOrder ?? [EMAIL_NODE_ID]);

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

  // ── Rule configuration dialog state ──
  const [progressionRuleDialog, setProgressionRuleDialog] = useState<{
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceNodeType: 'module' | 'evaluation';
    initialFormData?: ProgressionRuleFormData;
    hasExistingRule: boolean;
  } | null>(null);

  // ── Edit-node dialog states ──
  const [editModuleDialog, setEditModuleDialog] = useState<{
    nodeId: string;
    moduleId?: string;
  } | null>(null);

  const [editEvalDialog, setEditEvalDialog] = useState<{
    nodeId: string;
    evaluationId?: string;
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
  const {
    hasFinalEval,
    hasAttestation,
    hasModule,
    hasPartialForLastModule,
    lastNodeIsEvaluation,
    hasEmailConfigured,
  } = useMemo(() => {
    const lastNodeId = nodeOrder.at(-1);
    const lastNodeStepType = nodes.find((n) => n.id === lastNodeId)?.data.stepType;

    const lastModuleIdx = nodeOrder.reduce<number>(
      (last, id, idx) => (nodes.find((n) => n.id === id)?.data.stepType === 'module' ? idx : last),
      -1,
    );
    const partialAfterLastModule =
      lastModuleIdx !== -1 &&
      nodeOrder.slice(lastModuleIdx + 1).some((id) => {
        return nodes.find((n) => n.id === id)?.data.stepType === 'evaluation-intermediate';
      });
    return {
      hasModule: nodes.some((n) => n.data.stepType === 'module'),
      hasFinalEval: nodes.some((n) => n.data.stepType === 'evaluation-final'),
      hasAttestation: nodes.some((n) => n.data.stepType === 'attestation'),
      hasPartialForLastModule: partialAfterLastModule,
      lastNodeIsEvaluation:
        lastNodeStepType === 'evaluation-intermediate' || lastNodeStepType === 'evaluation-final',
      hasEmailConfigured: nodes.some(
        (n) => n.data.stepType === 'email' && !!n.data.emailTemplateId,
      ),
    };
  }, [nodes, nodeOrder]);

  // Notify parent whenever the presence of module nodes changes
  useEffect(() => {
    onModulesChange?.(hasModule);
  }, [hasModule, onModulesChange]);

  // ── IDs of modules already present in the flow ──
  const usedModuleIds = useMemo(
    () => nodes.filter((n) => n.data.moduleId).map((n) => n.data.moduleId!),
    [nodes],
  );

  // ── Bank IDs already used by evaluations in the flow ──
  const allUsedBankIds = useMemo(
    () => [...new Set(nodes.flatMap((n) => n.data.evaluationConfig?.questionBankIds ?? []))],
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

  // ── Open the rule dialog when an edge settings button is clicked ──
  const onConfigureEdge = useCallback((edgeId: string) => {
    const edge = edgesRef.current.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodesRef.current.find((n) => n.id === edge.source);
    if (!sourceNode) return;

    const stepType = sourceNode.data.stepType;
    // Only modules and evaluations can be rule sources
    if (
      stepType !== 'module' &&
      stepType !== 'evaluation-intermediate' &&
      stepType !== 'evaluation-final'
    )
      return;

    const sourceNodeType: 'module' | 'evaluation' = stepType === 'module' ? 'module' : 'evaluation';

    const existing = edge.data?.progressionRule;
    const initialFormData: ProgressionRuleFormData | undefined = existing
      ? {
          condition: existing.condition,
          failureTargetNodeId: existing.failureTargetNodeId,
          maxAttempts: existing.maxAttempts,
          exhaustedTargetNodeId: existing.exhaustedTargetNodeId,
        }
      : undefined;

    setProgressionRuleDialog({
      edgeId,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      sourceNodeType,
      initialFormData,
      hasExistingRule: !!existing,
    });
  }, []);

  // ── Save progression rule ──
  const handleProgressionRuleSave = useCallback(
    async (formData: ProgressionRuleFormData) => {
      if (!progressionRuleDialog) return;
      const { edgeId, sourceNodeId, targetNodeId, sourceNodeType } = progressionRuleDialog;
      const existing = edgesRef.current.find((e) => e.id === edgeId)?.data?.progressionRule;

      // "Deactivate" path — condition set to null means the user wants to remove the rule
      if (formData.condition === null) {
        const deactivatedRuleId = existing?.progressionRuleId ?? null;
        if (existing?.progressionRuleId && onProgressionRuleDeactivate && learningPathId) {
          try {
            await onProgressionRuleDeactivate(existing.progressionRuleId, learningPathId);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Impossible de désactiver la règle.'));
            return;
          }
        }
        setEdges((eds) => {
          const withoutRetakeForRule = deactivatedRuleId
            ? eds.filter(
                (e) =>
                  !(
                    e.data?.kind === 'retake' &&
                    (e.data.retakeForEdgeId === edgeId ||
                      e.data.retakeForRuleId === deactivatedRuleId ||
                      e.id.startsWith(`retake-${deactivatedRuleId}-`))
                  ),
              )
            : eds.filter((e) => !(e.data?.kind === 'retake' && e.data.retakeForEdgeId === edgeId));

          return withoutRetakeForRule.map((e) =>
            e.id === edgeId ? { ...e, data: { ...e.data, progressionRule: undefined } } : e,
          );
        });
        setProgressionRuleDialog(null);
        return;
      }

      // Determine source node type for the API call
      const nodeTypeForApi: ProgressionNodeType =
        sourceNodeType === 'module' ? 'module' : 'evaluation';

      // Determine target-on-success node type
      const targetNode = nodesRef.current.find((n) => n.id === targetNodeId);
      const targetTypeForApi: ProgressionNodeType =
        targetNode?.data.stepType === 'attestation'
          ? 'certificate'
          : targetNode?.data.stepType === 'module'
            ? 'module'
            : 'evaluation';

      // Source entity ID (moduleId or evaluationId)
      const sourceEntityId =
        sourceNodeType === 'module'
          ? nodesRef.current.find((n) => n.id === sourceNodeId)?.data.moduleId
          : nodesRef.current.find((n) => n.id === sourceNodeId)?.data.evaluationId;

      // Target-on-success entity ID
      const targetEntityId =
        targetTypeForApi === 'certificate'
          ? nodesRef.current.find((n) => n.id === targetNodeId)?.data.attestationId
          : targetTypeForApi === 'module'
            ? nodesRef.current.find((n) => n.id === targetNodeId)?.data.moduleId
            : nodesRef.current.find((n) => n.id === targetNodeId)?.data.evaluationId;

      if (!sourceEntityId || !targetEntityId) {
        toast.error('Impossible de trouver les identifiants des nœuds.');
        return;
      }

      const buildNodeRef = (nodeId: string): ProgressionNodeRef | null => {
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) return null;
        const type: ProgressionNodeType =
          node.data.stepType === 'attestation'
            ? 'certificate'
            : node.data.stepType === 'module'
              ? 'module'
              : 'evaluation';
        const id =
          type === 'certificate'
            ? node.data.attestationId
            : type === 'module'
              ? node.data.moduleId
              : node.data.evaluationId;
        return id ? { type, id } : null;
      };

      const failureRef = formData.failureTargetNodeId
        ? buildNodeRef(formData.failureTargetNodeId)
        : null;

      const exhaustedRef = formData.exhaustedTargetNodeId
        ? buildNodeRef(formData.exhaustedTargetNodeId)
        : null;

      const rulePayload = {
        condition: formData.condition,
        target_on_success: { type: targetTypeForApi, id: targetEntityId },
        target_on_failure: failureRef,
        max_attempts: formData.maxAttempts,
        target_on_exhausted: exhaustedRef,
      };

      let ruleId = existing?.progressionRuleId ?? null;

      if (learningPathId) {
        try {
          if (ruleId && onProgressionRuleUpdate) {
            await onProgressionRuleUpdate(ruleId, learningPathId, rulePayload);
          } else if (!ruleId && onProgressionRuleCreate) {
            const created = await onProgressionRuleCreate(learningPathId, {
              source: { type: nodeTypeForApi, id: sourceEntityId },
              ...rulePayload,
            });
            ruleId = created.id;
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible de sauvegarder la règle.'));
          return;
        }
      }

      setEdges((eds) => {
        const retakeRuleId = ruleId ?? existing?.progressionRuleId ?? null;
        const cleaned = eds
          .filter(
            (e) =>
              !(
                e.data?.kind === 'retake' &&
                (e.data.retakeForEdgeId === edgeId ||
                  (retakeRuleId && e.data.retakeForRuleId === retakeRuleId) ||
                  (retakeRuleId && e.id.startsWith(`retake-${retakeRuleId}-`)))
              ),
          )
          .map((e) =>
            e.id === edgeId
              ? {
                  ...e,
                  data: {
                    ...e.data,
                    progressionRule: ruleId
                      ? {
                          progressionRuleId: ruleId,
                          condition: formData.condition!,
                          failureTargetNodeId: formData.failureTargetNodeId,
                          maxAttempts: formData.maxAttempts,
                          exhaustedTargetNodeId: formData.exhaustedTargetNodeId,
                        }
                      : undefined,
                  },
                }
              : e,
          );

        if (!formData.failureTargetNodeId) {
          return cleaned;
        }

        const retakeId = retakeRuleId
          ? `retake-${retakeRuleId}-${formData.failureTargetNodeId}`
          : `retake-${edgeId}-${formData.failureTargetNodeId}`;

        return [
          ...cleaned,
          {
            id: retakeId,
            source: sourceNodeId,
            target: formData.failureTargetNodeId,
            type: 'configurableEdge',
            animated: false,
            data: {
              kind: 'retake',
              retakeForRuleId: retakeRuleId ?? undefined,
              retakeForEdgeId: edgeId,
            },
          },
        ];
      });

      setProgressionRuleDialog(null);
    },
    [
      progressionRuleDialog,
      learningPathId,
      onProgressionRuleCreate,
      onProgressionRuleUpdate,
      onProgressionRuleDeactivate,
    ],
  );

  // ── Delete a node and reconnect its neighbours ──
  const onDeleteNode = useCallback(
    async (nodeId: string) => {
      const targetNode = nodesRef.current.find((n) => n.id === nodeId);
      if (targetNode?.data.stepType === 'email') return;

      // Immediately unlink competency when a module node is removed
      if (targetNode?.data.stepType === 'module' && targetNode.data.moduleId && onModuleRemove) {
        try {
          await onModuleRemove(targetNode.data.moduleId);
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible de détacher la compétence.'));
          return;
        }
      }

      // Immediately delete evaluation from the API when an evaluation node is removed
      if (
        (targetNode?.data.stepType === 'evaluation-intermediate' ||
          targetNode?.data.stepType === 'evaluation-final') &&
        targetNode.data.evaluationId
      ) {
        try {
          if (onEvalDelete) {
            await onEvalDelete(targetNode.data.evaluationId);
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Impossible de supprimer l'évaluation."));
          return;
        }
      }

      // Detach certificate from the LP when the attestation node is removed
      if (targetNode?.data.stepType === 'attestation' && targetNode.data.attestationId) {
        try {
          if (onCertificateDetach) {
            await onCertificateDetach();
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Impossible de détacher l'attestation."));
          return;
        }
      }

      // Deactivate any progression rules attached to edges incident on this node
      if (learningPathId && onProgressionRuleDeactivate) {
        const incidentEdges = edgesRef.current.filter(
          (e) => e.source === nodeId || e.target === nodeId,
        );
        for (const edge of incidentEdges) {
          const ruleId = edge.data?.progressionRule?.progressionRuleId;
          if (ruleId) {
            try {
              await onProgressionRuleDeactivate(ruleId, learningPathId);
            } catch {
              // Best-effort — don't block node deletion if deactivation fails
            }
          }
        }
      }

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
    },
    [
      onModuleRemove,
      onEvalDelete,
      onCertificateDetach,
      learningPathId,
      onProgressionRuleDeactivate,
    ],
  );

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
          evaluationId: node.data.evaluationId,
          config: {
            stepType: node.data.stepType,
            title: node.data.evaluationConfig?.title ?? '',
            durationEnabled: node.data.evaluationConfig?.durationEnabled ?? false,
            durationHours: node.data.evaluationConfig?.durationHours ?? 0,
            durationMinutes: node.data.evaluationConfig?.durationMinutes ?? 30,
            questionCount: node.data.evaluationConfig?.questionCount ?? 20,
            attemptCount: node.data.evaluationConfig?.attemptCount ?? 1,
            questionBankIds: node.data.evaluationConfig?.questionBankIds ?? [],
            questionBankNames: node.data.evaluationConfig?.questionBankNames ?? [],
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
        evaluationId?: string;
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
          evaluationId: opts?.evaluationId,
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
    async (mod: ModuleItem) => {
      if (onModuleAdd) {
        const lastId = nodeOrderRef.current.at(-1) ?? null;
        const lastNode = lastId ? nodesRef.current.find((n) => n.id === lastId) : null;
        const y = lastNode ? lastNode.position.y + NODE_GAP : 0;
        try {
          await onModuleAdd(mod.id, { x: CANVAS_X, y });
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible de lier la compétence.'));
          return;
        }
      }
      addStep('module', { label: mod.name, moduleId: mod.id });
    },
    [addStep, onModuleAdd],
  );

  // ── Handle evaluation configuration ──
  const handleEvalConfirm = useCallback(
    async (cfg: EvaluationConfig) => {
      const { stepType, ...rest } = cfg;
      let evaluationId: string | undefined;

      if (onEvalCreate && cfg.questionBankIds.length > 0) {
        const lastId = nodeOrderRef.current.at(-1) ?? null;
        const lastNode = lastId ? nodesRef.current.find((n) => n.id === lastId) : null;
        const locationY = lastNode ? lastNode.position.y + NODE_GAP : 0;
        try {
          evaluationId = await onEvalCreate({
            title: cfg.title,
            type: stepType === 'evaluation-intermediate' ? 'PARTIAL' : 'FINAL',
            question_bank_ids: cfg.questionBankIds,
            question_count: cfg.questionCount,
            max_attempts: cfg.attemptCount > 0 ? cfg.attemptCount : null,
            location_x: Math.round(CANVAS_X),
            location_y: Math.round(locationY),
          });
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Impossible d'ajouter l'évaluation."));
          return;
        }
      }

      addStep(stepType, {
        label: cfg.title || cfg.questionBankNames[0] || undefined,
        evaluationId,
        evaluationConfig: rest,
      });
    },
    [addStep, onEvalCreate],
  );

  // ── Handle attestation selection ──
  const handleAttestationSelect = useCallback(
    async (att: AttestationItem): Promise<void> => {
      const lastId = nodeOrderRef.current.at(-1) ?? null;
      const lastNode = lastId ? nodesRef.current.find((n) => n.id === lastId) : null;
      const position = { x: CANVAS_X, y: lastNode ? lastNode.position.y + NODE_GAP : 0 };
      try {
        await onCertificateAssign?.(att.id, position);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Impossible d'assigner l'attestation."));
        throw err;
      }
      addStep('attestation', {
        label: att.name,
        attestationId: att.id,
      });
    },
    [addStep, onCertificateAssign],
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
    async (cfg: EvaluationConfig) => {
      if (!editEvalDialog) return;
      const { stepType, ...rest } = cfg;

      const node = nodesRef.current.find((n) => n.id === editEvalDialog.nodeId);
      if (node?.data.evaluationId) {
        try {
          await evaluationsApi.update(node.data.evaluationId, {
            title: cfg.title,
            question_bank_ids: cfg.questionBankIds.length > 0 ? cfg.questionBankIds : undefined,
            question_count: cfg.questionCount,
            max_attempts: cfg.attemptCount > 0 ? cfg.attemptCount : null,
          });
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Impossible de modifier l'évaluation."));
          return;
        }
      }

      setNodes((nds) =>
        nds.map((n) =>
          n.id === editEvalDialog.nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  stepType,
                  label: cfg.title || cfg.questionBankNames[0] || n.data.label,
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
    async (att: AttestationItem): Promise<void> => {
      if (!editAttestationDialog) return;
      const node = nodesRef.current.find((n) => n.id === editAttestationDialog.nodeId);
      const position = node
        ? { x: Math.round(node.position.x), y: Math.round(node.position.y) }
        : { x: CANVAS_X, y: 0 };
      try {
        await onCertificateAssign?.(att.id, position);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Impossible d'assigner l'attestation."));
        throw err;
      }
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editAttestationDialog.nodeId
            ? { ...n, data: { ...n.data, label: att.name, attestationId: att.id } }
            : n,
        ),
      );
      setEditAttestationDialog(null);
    },
    [editAttestationDialog, onCertificateAssign],
  );

  const handleEditEmailSave = useCallback(
    async (template: EmailTemplate): Promise<void> => {
      if (!editEmailDialog) return;
      const emailNode = nodesRef.current.find((n) => n.id === editEmailDialog.nodeId);
      const position = emailNode
        ? { x: Math.round(emailNode.position.x), y: Math.round(emailNode.position.y) }
        : { x: CANVAS_X, y: 0 };
      try {
        await onMailTemplateAssign?.(template.id, position);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Impossible d'assigner le template mail."));
        throw err;
      }
      // Mise à jour locale uniquement après succès API
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
    [editEmailDialog, onMailTemplateAssign],
  );

  // ── Used module IDs excluding the one currently being edited ──
  const editModuleUsedIds = useMemo(
    () => usedModuleIds.filter((id) => id !== editModuleDialog?.moduleId),
    [usedModuleIds, editModuleDialog?.moduleId],
  );

  // ── Persist position when a node is dragged ──
  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: StepNode) => {
      const { stepType, moduleId, evaluationId } = node.data;
      const pos = { x: Math.round(node.position.x), y: Math.round(node.position.y) };

      if (stepType === 'module' && moduleId && onModuleMove) {
        onModuleMove(moduleId, pos).catch(() => {});
      } else if (
        (stepType === 'evaluation-intermediate' || stepType === 'evaluation-final') &&
        evaluationId &&
        onEvalMove
      ) {
        onEvalMove(evaluationId, pos).catch(() => {});
      } else if (stepType === 'email' && onMailTemplateMove) {
        onMailTemplateMove(pos).catch(() => {});
      } else if (stepType === 'attestation' && onCertificateMove) {
        onCertificateMove(pos).catch(() => {});
      }
    },
    [onModuleMove, onEvalMove, onMailTemplateMove, onCertificateMove],
  );

  // ── Build the serializable payload ──
  const buildPayload = useCallback((): ProgramFlowPayload => {
    const etapes: FlowStepPayload[] = nodeOrderRef.current.map((nodeId) => {
      const node = nodesRef.current.find((n) => n.id === nodeId)!;
      const d = node.data;

      switch (d.stepType) {
        case 'email':
          return {
            id: nodeId,
            type: 'email',
            position: node.position,
            emailTemplateId: d.emailTemplateId,
            emailTemplateName: d.emailTemplateName,
          };
        case 'module':
          return {
            id: nodeId,
            type: 'module',
            position: node.position,
            label: d.label,
            moduleId: d.moduleId,
          };
        case 'evaluation-intermediate':
        case 'evaluation-final':
          return {
            id: nodeId,
            type: d.stepType,
            position: node.position,
            label: d.label,
            title: d.evaluationConfig?.title ?? '',
            evaluationId: d.evaluationId,
            questionBankIds: d.evaluationConfig?.questionBankIds ?? [],
            questionBankNames: d.evaluationConfig?.questionBankNames ?? [],
            questionCount: d.evaluationConfig?.questionCount ?? 0,
            attemptCount: d.evaluationConfig?.attemptCount ?? 0,
            durationEnabled: d.evaluationConfig?.durationEnabled ?? false,
            durationHours: d.evaluationConfig?.durationHours ?? 0,
            durationMinutes: d.evaluationConfig?.durationMinutes ?? 0,
          };
        case 'attestation':
          return {
            id: nodeId,
            type: 'attestation',
            position: node.position,
            label: d.label,
            attestationId: d.attestationId,
          };
      }
    });

    const connexions: FlowConnectionPayload[] = edgesRef.current.map((edge) => {
      const ruleData = edge.data as EdgeRuleData | undefined;
      const isRetake = ruleData?.kind === 'retake';

      const conn: FlowConnectionPayload = {
        sourceId: edge.source,
        targetId: edge.target,
        estReprise: isRetake,
      };

      if (!isRetake && ruleData?.progressionRule) {
        const r = ruleData.progressionRule;
        const sourceNode = nodesRef.current.find((n) => n.id === edge.source);
        const targetNode = nodesRef.current.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          const sourceType: ProgressionNodeRef['type'] =
            sourceNode.data.stepType === 'module' ? 'module' : 'evaluation';
          const targetType: ProgressionNodeRef['type'] =
            targetNode.data.stepType === 'attestation'
              ? 'certificate'
              : targetNode.data.stepType === 'module'
                ? 'module'
                : 'evaluation';
          const sourceId =
            sourceType === 'module' ? sourceNode.data.moduleId : sourceNode.data.evaluationId;
          const targetId =
            targetType === 'certificate'
              ? targetNode.data.attestationId
              : targetType === 'module'
                ? targetNode.data.moduleId
                : targetNode.data.evaluationId;
          if (sourceId && targetId) {
            const buildRef = (nodeId: string | null): ProgressionNodeRef | null => {
              if (!nodeId) return null;
              const node = nodesRef.current.find((n) => n.id === nodeId);
              if (!node) return null;
              const type: ProgressionNodeRef['type'] =
                node.data.stepType === 'attestation'
                  ? 'certificate'
                  : node.data.stepType === 'module'
                    ? 'module'
                    : 'evaluation';
              const id =
                type === 'certificate'
                  ? node.data.attestationId
                  : type === 'module'
                    ? node.data.moduleId
                    : node.data.evaluationId;
              return id ? { type, id } : null;
            };
            conn.progressionRule = {
              ruleId: r.progressionRuleId,
              condition: r.condition,
              targetOnSuccess: { type: targetType, id: targetId },
              targetOnFailure: buildRef(r.failureTargetNodeId),
              maxAttempts: r.maxAttempts,
              targetOnExhausted: buildRef(r.exhaustedTargetNodeId),
            };
          }
        }
      }

      return conn;
    });

    return { etapes, connexions };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getPayload: buildPayload,
      getRawFlow: () => ({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        nodeOrder: nodeOrderRef.current,
      }),
    }),
    [buildPayload],
  );

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
    () => ({
      onDeleteNode,
      onConfigureEdge,
      onEditNode,
    }),
    [onDeleteNode, onConfigureEdge, onEditNode],
  );

  return (
    <FlowActionsContext.Provider value={flowActions}>
      <div className="flex h-175 flex-col overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={hasFinalEval || hasAttestation}
                onClick={() => {
                  if (hasEmailConfigured) setModuleDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <BookOpen className="size-3.5" />
                Module
              </Button>
            </TooltipTrigger>
            {!hasEmailConfigured && (
              <TooltipContent side="bottom">
                Configurez d&apos;abord l&apos;email de démarrage
              </TooltipContent>
            )}
          </Tooltip>
          <Button
            variant="outline"
            disabled={
              !hasModule ||
              hasFinalEval ||
              hasAttestation ||
              (hasPartialForLastModule && !lastNodeIsEvaluation)
            }
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

          <span className="ml-auto flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
            <Info className="size-3 shrink-0" />
            Les modifications du canvas sont enregistrées automatiquement
          </span>
        </div>

        {/* ── Canvas ── */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={handleNodeDragStop}
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
        hasPartialForLastModule={hasPartialForLastModule || lastNodeIsEvaluation}
        alreadyUsedBankIds={allUsedBankIds}
        onConfirm={handleEvalConfirm}
      />
      <SelectAttestationDialog
        open={attestationDialogOpen}
        onOpenChange={setAttestationDialogOpen}
        onSelect={handleAttestationSelect}
      />

      {/* ── Progression rule dialog ── */}
      <ProgressionRuleDialog
        open={progressionRuleDialog !== null}
        onOpenChange={(open) => {
          if (!open) setProgressionRuleDialog(null);
        }}
        sourceNodeType={progressionRuleDialog?.sourceNodeType ?? 'module'}
        hasExistingRule={progressionRuleDialog?.hasExistingRule ?? false}
        initialFormData={progressionRuleDialog?.initialFormData}
        nodeOptions={retakeNodeOptions}
        onSave={handleProgressionRuleSave}
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
        evaluationId={editEvalDialog?.evaluationId}
        alreadyUsedBankIds={allUsedBankIds}
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
