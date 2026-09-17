import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EvaluationFailureDialog from '../EvaluationFailureDialog';
import type { FormationEvaluation, FormationModule, NodeExecutionState } from '../../lib/types';

const NODE_EXECUTION: NodeExecutionState = {
  currentExecutionId: 'exec-1',
  readExecutionId: 'exec-1',
  currentVisit: null,
  current: true,
  actionable: true,
  readable: true,
  requiredToRepeat: true,
  historicalCompleted: true,
  currentScore: null,
  currentResult: null,
  round: null,
  nextAction: 'complete_content',
  progressPercent: 0,
  coveragePercent: 100,
};

const MODULE: FormationModule = {
  id: 'module-1',
  formationId: 'f1',
  type: 'module',
  title: 'Les bases',
  status: 'retry',
  progress: 0,
  order: 1,
  courses: [],
  execution: NODE_EXECUTION,
};

const EVALUATION: FormationEvaluation = {
  id: 'evaluation-1',
  formationId: 'f1',
  type: 'evaluation',
  evaluationType: 'final',
  title: 'Évaluation finale',
  status: 'retry',
  order: 2,
  passingScore: 80,
  execution: { ...NODE_EXECUTION, nextAction: 'start_evaluation' },
};

describe('Annonce d’échec à une évaluation', () => {
  it('nomme le module que le moteur impose de refaire', async () => {
    const onConfirm = jest.fn();
    render(
      <EvaluationFailureDialog
        score={50}
        passingScore={80}
        target={MODULE}
        remainingAttempts={2}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Évaluation non validée')).toBeInTheDocument();
    expect(screen.getByText('Les bases')).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Revoir le module/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('propose de repasser l’évaluation quand la boucle y revient', () => {
    render(
      <EvaluationFailureDialog
        score={70}
        passingScore={80}
        target={EVALUATION}
        remainingAttempts={1}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Repasser l’évaluation/ })).toBeInTheDocument();
  });

  it('n’annonce pas de tentative restante quand le budget est inconnu', () => {
    render(
      <EvaluationFailureDialog
        score={10}
        passingScore={80}
        target={null}
        remainingAttempts={null}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.queryByText(/tentative/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();
  });
});
