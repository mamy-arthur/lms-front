'use client';

import {
  ProgressionRuleDialog,
  type NodeOption,
  type ProgressionRuleFormData,
} from './dialog/ProgressionRuleDialog';
import { SelectModuleDialog, type ModuleItem } from './dialog/SelectModuleDialog';
import { AddEvaluationDialog, type EvaluationConfig } from './dialog/AddEvaluationDialog';
import { SelectAttestationDialog, type AttestationItem } from './dialog/SelectAttestationDialog';
import { SelectEmailTemplateDialog, type EmailTemplate } from './dialog/SelectEmailTemplateDialog';

// ─── Dialog state shapes (exported for ProgramFlow's useState) ────────────────

export type ProgressionRuleDialogState = {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceNodeType: 'module' | 'evaluation';
  initialFormData?: ProgressionRuleFormData;
  hasExistingRule: boolean;
};

export type EditEmailDialogState = {
  nodeId: string;
  emailTemplateId?: string;
};

export type EditModuleDialogState = {
  nodeId: string;
  moduleId?: string;
};

export type EditEvalDialogState = {
  nodeId: string;
  evaluationId?: string;
  config: EvaluationConfig;
  hasFinalEval: boolean;
};

export type EditAttestationDialogState = {
  nodeId: string;
  attestationId?: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type FlowDialogsProps = {
  moduleDialogOpen: boolean;
  setModuleDialogOpen: (open: boolean) => void;
  usedModuleIds: string[];
  onModuleSelect: (mod: ModuleItem) => Promise<void>;

  evalDialogOpen: boolean;
  setEvalDialogOpen: (open: boolean) => void;
  hasFinalEval: boolean;
  hasPartialForLastModule: boolean;
  lastNodeIsEvaluation: boolean;
  allUsedBankIds: string[];
  learningPathId: string;
  precedingModuleId?: string;
  allModuleIds: string[];
  moduleNameById: Record<string, string>;
  onEvalConfirm: (cfg: EvaluationConfig) => Promise<void>;

  attestationDialogOpen: boolean;
  setAttestationDialogOpen: (open: boolean) => void;
  onAttestationSelect: (att: AttestationItem) => Promise<void>;

  progressionRuleDialog: ProgressionRuleDialogState | null;
  setProgressionRuleDialog: (state: ProgressionRuleDialogState | null) => void;
  retakeNodeOptions: NodeOption[];
  onProgressionRuleSave: (formData: ProgressionRuleFormData) => Promise<void>;

  editEmailDialog: EditEmailDialogState | null;
  setEditEmailDialog: (state: EditEmailDialogState | null) => void;
  onEditEmailSave: (template: EmailTemplate) => Promise<void>;

  editModuleDialog: EditModuleDialogState | null;
  setEditModuleDialog: (state: EditModuleDialogState | null) => void;
  editModuleUsedIds: string[];
  onEditModuleSave: (mod: ModuleItem) => void;

  editEvalDialog: EditEvalDialogState | null;
  setEditEvalDialog: (state: EditEvalDialogState | null) => void;
  onEditEvalSave: (cfg: EvaluationConfig) => Promise<void>;

  editAttestationDialog: EditAttestationDialogState | null;
  setEditAttestationDialog: (state: EditAttestationDialogState | null) => void;
  onEditAttestationSave: (att: AttestationItem) => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FlowDialogs({
  moduleDialogOpen,
  setModuleDialogOpen,
  usedModuleIds,
  onModuleSelect,
  evalDialogOpen,
  setEvalDialogOpen,
  hasFinalEval,
  hasPartialForLastModule,
  lastNodeIsEvaluation,
  allUsedBankIds,
  learningPathId,
  precedingModuleId,
  allModuleIds,
  moduleNameById,
  onEvalConfirm,
  attestationDialogOpen,
  setAttestationDialogOpen,
  onAttestationSelect,
  progressionRuleDialog,
  setProgressionRuleDialog,
  retakeNodeOptions,
  onProgressionRuleSave,
  editEmailDialog,
  setEditEmailDialog,
  onEditEmailSave,
  editModuleDialog,
  setEditModuleDialog,
  editModuleUsedIds,
  onEditModuleSave,
  editEvalDialog,
  setEditEvalDialog,
  onEditEvalSave,
  editAttestationDialog,
  setEditAttestationDialog,
  onEditAttestationSave,
}: FlowDialogsProps) {
  return (
    <>
      {/* ── Add-node dialogs ── */}
      <SelectModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        usedModuleIds={usedModuleIds}
        onSelect={onModuleSelect}
      />
      <AddEvaluationDialog
        open={evalDialogOpen}
        onOpenChange={setEvalDialogOpen}
        hasFinalEval={hasFinalEval}
        hasPartialForLastModule={hasPartialForLastModule || lastNodeIsEvaluation}
        alreadyUsedBankIds={allUsedBankIds}
        learningPathId={learningPathId}
        precedingModuleId={precedingModuleId}
        allModuleIds={allModuleIds}
        moduleNameById={moduleNameById}
        onConfirm={onEvalConfirm}
      />
      <SelectAttestationDialog
        open={attestationDialogOpen}
        onOpenChange={setAttestationDialogOpen}
        onSelect={onAttestationSelect}
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
        onSave={onProgressionRuleSave}
      />

      {/* ── Edit-node dialogs ── */}
      <SelectEmailTemplateDialog
        key={editEmailDialog?.nodeId}
        open={editEmailDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditEmailDialog(null);
        }}
        initialTemplateId={editEmailDialog?.emailTemplateId}
        onSelect={onEditEmailSave}
      />
      <SelectModuleDialog
        key={editModuleDialog?.nodeId}
        open={editModuleDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditModuleDialog(null);
        }}
        usedModuleIds={editModuleUsedIds}
        onSelect={onEditModuleSave}
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
        learningPathId={learningPathId}
        allModuleIds={allModuleIds}
        moduleNameById={moduleNameById}
        onConfirm={onEditEvalSave}
      />
      <SelectAttestationDialog
        key={editAttestationDialog?.nodeId}
        open={editAttestationDialog !== null}
        onOpenChange={(open) => {
          if (!open) setEditAttestationDialog(null);
        }}
        initialAttestationId={editAttestationDialog?.attestationId}
        onSelect={onEditAttestationSave}
      />
    </>
  );
}
