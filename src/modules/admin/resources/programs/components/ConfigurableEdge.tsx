'use client';

import { useContext } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Lock, Settings2 } from 'lucide-react';
import { FlowActionsContext } from './ProgramFlow.context';
import type { EdgeRuleData } from './ProgramFlow.types';

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
export const edgeTypes = { configurableEdge: ConfigurableEdge };
