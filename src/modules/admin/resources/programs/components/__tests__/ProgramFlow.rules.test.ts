import { getRetakeNodeOptions, getRetakeTargetErrors } from '../ProgramFlow.rules';
import type { StepNode, StepType } from '../ProgramFlow.types';
import type { ProgressionRuleFormData } from '../dialog/ProgressionRuleDialog';

const steps: [string, StepType][] = [
  ['start', 'email'],
  ['M1', 'module'],
  ['E1', 'evaluation-intermediate'],
  ['M2', 'module'],
  ['E2', 'evaluation-intermediate'],
  ['M3', 'module'],
  ['E3', 'evaluation-intermediate'],
  ['E-final', 'evaluation-final'],
  ['certificate', 'attestation'],
];
const order = steps.map(([id]) => id);
// Canvas insertion order and coordinates must not decide the available targets.
const nodes: StepNode[] = steps
  .map<StepNode>(([id, stepType]) => ({
    id,
    type: 'programStep',
    data: { label: id, stepType },
    position: { x: 0, y: 0 },
  }))
  .reverse();
const rule: ProgressionRuleFormData = {
  condition: { type: 'evaluation_passed', min_score_percentage: 70 },
  failureTargetNodeId: 'M1',
  maxAttempts: 3,
  exhaustedTargetNodeId: null,
};

describe('cibles de reprise du parcours', () => {
  it.each([
    ['E1', ['M1', 'E1']],
    ['E2', ['M1', 'E1', 'M2', 'E2']],
    ['E3', ['M1', 'E1', 'M2', 'E2', 'M3', 'E3']],
    ['E-final', ['M1', 'E1', 'M2', 'E2', 'M3', 'E3', 'E-final']],
  ])('limite les cibles jusqu’à %s incluse dans l’ordre du parcours', (source, expected) => {
    expect(getRetakeNodeOptions(nodes, order, source).map((node) => node.id)).toEqual(expected);
  });

  it('recalcule les cibles si l’ordre change', () => {
    const reordered = ['start', 'M2', 'M1', 'E2', 'E1', 'M3', 'E3', 'E-final', 'certificate'];
    const options = getRetakeNodeOptions(nodes, reordered, 'E2');
    expect(options.map((node) => node.id)).toEqual(['M2', 'M1', 'E2']);
    expect(
      getRetakeTargetErrors({ ...rule, failureTargetNodeId: 'E1' }, options).failure,
    ).not.toBeNull();
  });

  it('préserve les cibles ultérieures pour la consultation seule', () => {
    expect(getRetakeNodeOptions(nodes, order, 'E1', true).map((node) => node.id)).toEqual([
      'M1',
      'E1',
      'M2',
      'E2',
      'M3',
      'E3',
      'E-final',
    ]);
  });

  it.each([null, 'unknown'])('ne propose rien sans source valide (%s)', (source) => {
    expect(getRetakeNodeOptions(nodes, order, source)).toEqual([]);
  });

  it('exclut les nœuds supprimés, même encore présents dans l’ordre', () => {
    expect(
      getRetakeNodeOptions(
        nodes.filter((node) => node.id !== 'M1'),
        order,
        'E1',
      ),
    ).toEqual([{ id: 'E1', label: 'E1', stepType: 'evaluation-intermediate' }]);
    expect(
      getRetakeNodeOptions(
        nodes.filter((node) => node.id !== 'E1'),
        order,
        'E1',
      ),
    ).toEqual([]);
  });

  it.each(['M2', 'E-final', 'start', 'certificate', 'deleted'])(
    'refuse %s dans les deux branches d’une règle sur E1',
    (target) => {
      const errors = getRetakeTargetErrors(
        { ...rule, failureTargetNodeId: target, exhaustedTargetNodeId: target },
        getRetakeNodeOptions(nodes, order, 'E1'),
      );
      expect(errors.failure).not.toBeNull();
      expect(errors.exhausted).not.toBeNull();
    },
  );

  it('autorise le retour à la source et l’échec terminal après épuisement', () => {
    expect(
      getRetakeTargetErrors(
        { ...rule, failureTargetNodeId: 'E1' },
        getRetakeNodeOptions(nodes, order, 'E1'),
      ),
    ).toEqual({ failure: null, exhausted: null });
  });

  it('permet de désactiver une ancienne règle invalide', () => {
    expect(
      getRetakeTargetErrors({ ...rule, condition: null, failureTargetNodeId: 'E-final' }, []),
    ).toEqual({ failure: null, exhausted: null });
  });
});
