import type { StepNode } from './ProgramFlow.types';
import type { NodeOption, ProgressionRuleFormData } from './dialog/ProgressionRuleDialog';

/** Failure paths can go back or retry the source, never skip ahead. */
export function getRetakeNodeOptions(
  nodes: readonly StepNode[],
  nodeOrder: readonly string[],
  sourceNodeId: string | null,
  readOnly = false,
): NodeOption[] {
  const sourceIndex = sourceNodeId === null ? -1 : nodeOrder.indexOf(sourceNodeId);
  if (sourceIndex < 0 || !nodes.some((node) => node.id === sourceNodeId)) return [];

  // Existing forward targets must remain visible when consulting a locked path.
  const candidateIds = readOnly ? nodeOrder : nodeOrder.slice(0, sourceIndex + 1);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return candidateIds.flatMap((id) => {
    const node = byId.get(id);
    const stepType = node?.data.stepType;
    if (
      !node ||
      (stepType !== 'module' &&
        stepType !== 'evaluation-intermediate' &&
        stepType !== 'evaluation-final')
    ) {
      return [];
    }
    return [{ id, label: node.data.label, stepType }];
  });
}

/** Validate stored values too: hiding an option does not clear it from the form. */
export function getRetakeTargetErrors(
  form: ProgressionRuleFormData,
  nodeOptions: readonly NodeOption[],
): { failure: string | null; exhausted: string | null } {
  if (form.condition === null) return { failure: null, exhausted: null };

  const allowedIds = new Set(
    nodeOptions.filter((node) => node.stepType !== 'email').map((node) => node.id),
  );
  const failure =
    form.failureTargetNodeId !== null && !allowedIds.has(form.failureTargetNodeId)
      ? 'La cible d’échec n’est plus autorisée. Choisissez une étape précédente ou l’évaluation courante.'
      : form.condition.type === 'evaluation_passed' && !form.failureTargetNodeId
        ? 'Choisissez une cible en cas d’échec.'
        : null;
  const exhausted =
    form.exhaustedTargetNodeId !== null && !allowedIds.has(form.exhaustedTargetNodeId)
      ? 'La cible après épuisement n’est plus autorisée. Choisissez une étape précédente, l’évaluation courante ou l’échec de la formation.'
      : null;

  return { failure, exhausted };
}
