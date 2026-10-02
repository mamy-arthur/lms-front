import { createRef, useContext } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ProgramFlow from '../ProgramFlow';
import { FlowDialogs } from '../FlowDialogs';
import { FlowActionsContext } from '../ProgramFlow.context';
import type { ProgramFlowHandle, ProgramFlowProps, StepNode, StepType } from '../ProgramFlow.types';
import type { ProgressionRuleFormData } from '../dialog/ProgressionRuleDialog';

jest.mock('@xyflow/react', () => ({
  ReactFlow: () => null,
  Background: () => null,
  Controls: () => null,
}));
jest.mock('../ProgramStepNode', () => ({ nodeTypes: {} }));
jest.mock('../ConfigurableEdge', () => ({ edgeTypes: {} }));
jest.mock('../FlowDialogs', () => ({ FlowDialogs: jest.fn() }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

const steps: [string, StepType][] = [
  ['start', 'email'],
  ['M1', 'module'],
  ['E1', 'evaluation-intermediate'],
  ['M2', 'module'],
  ['E-final', 'evaluation-final'],
  ['certificate', 'attestation'],
];
const order = steps.map(([id]) => id);
const nodes = steps.map<StepNode>(([id, stepType]) => ({
  id,
  type: 'programStep',
  data: { label: id, stepType, moduleId: id, evaluationId: id },
  position: { x: 0, y: 0 },
}));
const rule: ProgressionRuleFormData = {
  condition: { type: 'evaluation_passed', min_score_percentage: 70 },
  failureTargetNodeId: 'E1',
  maxAttempts: 3,
  exhaustedTargetNodeId: null,
};

function ConfigureRule() {
  const { onConfigureEdge } = useContext(FlowActionsContext);
  return <button onClick={() => onConfigureEdge('edge-E1')}>Configurer E1</button>;
}

function dialogProps() {
  return jest.mocked(FlowDialogs).mock.calls.at(-1)![0];
}

async function renderFlow(existing: boolean, isLocked = false) {
  const onCreate = jest.fn().mockResolvedValue({ id: 'created-rule' });
  const onUpdate = jest.fn().mockResolvedValue({ id: 'existing-rule' });
  const ref = createRef<ProgramFlowHandle>();
  const edges: ProgramFlowProps['initialEdges'] = [
    {
      id: 'edge-E1',
      source: 'E1',
      target: 'M2',
      data: existing
        ? {
            progressionRule: {
              ...rule,
              condition: rule.condition!,
              progressionRuleId: 'existing-rule',
              failureTargetNodeId: 'E-final',
            },
          }
        : undefined,
    },
  ];
  render(
    <TooltipProvider>
      <ProgramFlow
        ref={ref}
        initialNodes={[...nodes].reverse()}
        initialNodeOrder={order}
        initialEdges={edges}
        learningPathId="path"
        isLocked={isLocked}
        onProgressionRuleCreate={onCreate}
        onProgressionRuleUpdate={onUpdate}
      />
    </TooltipProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Configurer E1' }));
  return { onCreate, onUpdate, ref, edges };
}

describe('ProgramFlow — règles de reprise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(FlowDialogs).mockImplementation(() => <ConfigureRule />);
  });

  it('transmet au modal les étapes jusqu’à la source, indépendamment du tableau du canvas', async () => {
    await renderFlow(false);
    expect(dialogProps().retakeNodeOptions.map((node) => node.id)).toEqual(['M1', 'E1']);
  });

  it.each([false, true])(
    'refuse les deux cibles ultérieures avant tout appel API (existante : %s)',
    async (existing) => {
      const { onCreate, onUpdate, ref, edges } = await renderFlow(existing);
      for (const field of ['failureTargetNodeId', 'exhaustedTargetNodeId'] as const) {
        await act(async () => {
          await dialogProps().onProgressionRuleSave({ ...rule, [field]: 'E-final' });
        });
        expect(onCreate).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
        expect(ref.current?.getRawFlow().edges).toEqual(edges);
        expect(dialogProps().progressionRuleDialog).not.toBeNull();
      }
      expect(toast.error).toHaveBeenCalledTimes(2);
    },
  );

  it.each([false, true])(
    'enregistre une reprise sur la source (existante : %s)',
    async (existing) => {
      const { onCreate, onUpdate } = await renderFlow(existing);
      await act(async () => {
        await dialogProps().onProgressionRuleSave(rule);
      });
      const payload = expect.objectContaining({
        target_on_failure: { type: 'evaluation', id: 'E1' },
        target_on_exhausted: null,
      });
      if (existing) expect(onUpdate).toHaveBeenCalledWith('existing-rule', 'path', payload);
      else expect(onCreate).toHaveBeenCalledWith('path', payload);
      expect(dialogProps().progressionRuleDialog).toBeNull();
      expect(toast.error).not.toHaveBeenCalled();
    },
  );

  it('conserve les anciennes cibles en lecture seule et interdit leur sauvegarde', async () => {
    const { onCreate, onUpdate } = await renderFlow(true, true);
    expect(dialogProps().retakeNodeOptions.map((node) => node.id)).toEqual([
      'M1',
      'E1',
      'M2',
      'E-final',
    ]);
    expect(dialogProps().progressionRuleDialog?.initialFormData?.failureTargetNodeId).toBe(
      'E-final',
    );
    await act(async () => {
      await dialogProps().onProgressionRuleSave(rule);
    });
    expect(onCreate).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
