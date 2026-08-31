'use client';

import { useContext, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FlowActionsContext } from './ProgramFlow.context';
import { STEP_CONFIG } from './ProgramFlow.config';
import type { StepNode } from './ProgramFlow.types';

function ProgramStepNode({ id, data, isConnectable }: NodeProps<StepNode>) {
  const { onDeleteNode, onEditNode, isLocked, lastNodeId } = useContext(FlowActionsContext);
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

  const isClickable = !isLocked && !(isConfigured && !isEmail && !isAttestation);

  return (
    <div
      className={cn(
        'min-w-55 rounded-md border px-4 py-3 shadow-sm',
        isClickable ? 'cursor-pointer' : 'cursor-default',
        cfg.border,
        cfg.bg,
      )}
      onClick={isClickable ? () => onEditNode(id) : undefined}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable && !isLocked} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', cfg.iconColor)} />
          <span className="truncate text-sm font-semibold text-foreground">{data.label}</span>
        </div>
        {!isEmail && !isLocked && id === lastNodeId && (
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
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable && !isLocked} />
    </div>
  );
}

// nodeTypes must be stable (defined outside component)
export const nodeTypes = { programStep: ProgramStepNode };
