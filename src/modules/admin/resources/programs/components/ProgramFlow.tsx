"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Background,
    Controls,
    Handle,
    Position,
    ReactFlow,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
} from "@xyflow/react";
import type {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
    Award,
    BadgeCheck,
    BookOpen,
    ClipboardCheck,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType =
    | "module"
    | "evaluation-intermediate"
    | "evaluation-final"
    | "attestation";

type StepNodeData = {
    stepType: StepType;
    label: string;
};

type StepNode = Node<StepNodeData, "programStep">;

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
    module: {
        label: "Module",
        Icon: BookOpen,
        border: "border-blue-300",
        bg: "bg-blue-50",
        iconColor: "text-blue-500",
        badgeClass: "border-blue-200 bg-blue-100 text-blue-700",
        badgeLabel: "Module",
    },
    "evaluation-intermediate": {
        label: "Évaluation intermédiaire",
        Icon: ClipboardCheck,
        border: "border-orange-300",
        bg: "bg-orange-50",
        iconColor: "text-orange-500",
        badgeClass: "border-orange-200 bg-orange-100 text-orange-700",
        badgeLabel: "Intermédiaire",
    },
    "evaluation-final": {
        label: "Évaluation finale",
        Icon: Award,
        border: "border-red-300",
        bg: "bg-red-50",
        iconColor: "text-red-500",
        badgeClass: "border-red-200 bg-red-100 text-red-700",
        badgeLabel: "Finale",
    },
    attestation: {
        label: "Attestation",
        Icon: BadgeCheck,
        border: "border-emerald-300",
        bg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        badgeClass: "border-emerald-200 bg-emerald-100 text-emerald-700",
        badgeLabel: "Attestation",
    },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const FlowActionsContext = createContext<{
    onDeleteNode: (id: string) => void;
}>({ onDeleteNode: () => {} });

// ─── Custom Node ──────────────────────────────────────────────────────────────

function ProgramStepNode({ id, data, isConnectable }: NodeProps<StepNode>) {
    const { onDeleteNode } = useContext(FlowActionsContext);
    const cfg = STEP_CONFIG[data.stepType];
    const { Icon } = cfg;

    return (
        <div
            className={cn(
                "min-w-55 rounded-xl border-2 px-4 py-3 shadow-sm",
                cfg.border,
                cfg.bg,
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
            />

            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Icon className={cn("size-4 shrink-0", cfg.iconColor)} />
                    <span className="truncate text-sm font-semibold text-foreground">
                        {data.label}
                    </span>
                </div>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onDeleteNode(id)}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-black/10 hover:text-red-500"
                    aria-label="Supprimer ce nœud"
                >
                    <Trash2 className="size-3" />
                </button>
            </div>

            <div className="mt-2">
                <Badge
                    variant="outline"
                    className={cn("text-xs", cfg.badgeClass)}
                >
                    {cfg.badgeLabel}
                </Badge>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
            />
        </div>
    );
}

// nodeTypes must be stable (defined outside component)
const nodeTypes = { programStep: ProgramStepNode };

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_X = 300;
const NODE_GAP = 150;
let _counter = 0;
const genId = () => `step-${++_counter}`;

// ─── ProgramFlow ──────────────────────────────────────────────────────────────

export default function ProgramFlow() {
    const [nodes, setNodes] = useState<StepNode[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [nodeOrder, setNodeOrder] = useState<string[]>([]);

    // Always-fresh refs — avoids stale closures in stable callbacks
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const nodeOrderRef = useRef(nodeOrder);
    nodeOrderRef.current = nodeOrder;

    // ── Business rule flags ──
    const { hasFinalEval, hasAttestation } = useMemo(
        () => ({
            hasFinalEval: nodes.some(
                (n) => n.data.stepType === "evaluation-final",
            ),
            hasAttestation: nodes.some(
                (n) => n.data.stepType === "attestation",
            ),
        }),
        [nodes],
    );

    // ── Delete a node and reconnect its neighbours ──
    const onDeleteNode = useCallback((nodeId: string) => {
        const order = nodeOrderRef.current;
        const idx = order.indexOf(nodeId);
        const prev = order[idx - 1] ?? null;
        const next = order[idx + 1] ?? null;

        setNodes((nds) => nds.filter((n) => n.id !== nodeId));

        setEdges((eds) => {
            const filtered = eds.filter(
                (e) => e.source !== nodeId && e.target !== nodeId,
            );
            if (prev && next) {
                return [
                    ...filtered,
                    {
                        id: `e-${prev}-${next}`,
                        source: prev,
                        target: next,
                        type: "smoothstep",
                        animated: true,
                    },
                ];
            }
            return filtered;
        });

        setNodeOrder((o) => o.filter((id) => id !== nodeId));
    }, []);

    // ── Append a new step to the end of the chain ──
    const addStep = useCallback((stepType: StepType) => {
        const id = genId();
        const order = nodeOrderRef.current;
        const currentNodes = nodesRef.current;
        const lastId = order.at(-1) ?? null;
        const lastNode = lastId
            ? currentNodes.find((n) => n.id === lastId)
            : null;
        const y = lastNode ? lastNode.position.y + NODE_GAP : 0;
        const count =
            currentNodes.filter((n) => n.data.stepType === stepType).length + 1;

        const newNode: StepNode = {
            id,
            type: "programStep",
            position: { x: CANVAS_X, y },
            data: {
                stepType,
                label: `${STEP_CONFIG[stepType].label} ${count}`,
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
                    type: "smoothstep",
                    animated: true,
                },
            ]);
        }

        setNodeOrder((o) => [...o, id]);
    }, []);

    // ── ReactFlow handlers ──
    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes((nds) => applyNodeChanges(changes, nds) as StepNode[]),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [],
    );

    const flowActions = useMemo(() => ({ onDeleteNode }), [onDeleteNode]);

    return (
        <FlowActionsContext.Provider value={flowActions}>
            <div className="flex h-175 flex-col overflow-hidden rounded-xl border bg-card">
                {/* ── Toolbar ── */}
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Ajouter
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={hasFinalEval || hasAttestation}
                        onClick={() => addStep("module")}
                        className="gap-1.5"
                    >
                        <BookOpen className="size-3.5" />
                        Module
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={hasFinalEval || hasAttestation}
                        onClick={() => addStep("evaluation-intermediate")}
                        className="gap-1.5"
                    >
                        <ClipboardCheck className="size-3.5" />
                        Éval. intermédiaire
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={hasFinalEval || hasAttestation}
                        onClick={() => addStep("evaluation-final")}
                        className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                    >
                        <Award className="size-3.5" />
                        Éval. finale
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasFinalEval || hasAttestation}
                        onClick={() => addStep("attestation")}
                        className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        <BadgeCheck className="size-3.5" />
                        Attestation
                    </Button>

                    <span className="ml-auto text-xs text-muted-foreground">
                        {nodes.length} étape{nodes.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* ── Canvas ── */}
                <div className="relative flex-1">
                    {nodes.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                            <BookOpen className="mb-2 size-8 text-muted-foreground/30" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Canvas vide
                            </p>
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
                        fitView
                        fitViewOptions={{ padding: 0.4 }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
        </FlowActionsContext.Provider>
    );
}
