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
        formationFailed={false}
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
        formationFailed={false}
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
        formationFailed={false}
        target={null}
        remainingAttempts={null}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.queryByText(/tentative/)).not.toBeInTheDocument();
    expect(screen.getByText('Évaluation non validée')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();
  });

  it.each([null, MODULE, EVALUATION])(
    'annonce l’échec de la formation sans proposer de reprise, même si une cible subsiste (%#)',
    async (target) => {
      const onConfirm = jest.fn();
      render(
        <EvaluationFailureDialog
          score={0}
          passingScore={50}
          formationFailed
          target={target}
          remainingAttempts={1}
          onConfirm={onConfirm}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Formation non validée' })).toBeInTheDocument();
      expect(
        screen.getByText('Vous avez échoué à cette formation. Votre parcours est terminé.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/en dessous du seuil requis de 50%/)).toHaveTextContent('0%');
      expect(screen.queryByText('Évaluation non validée')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Votre parcours a été mis à jour|Votre parcours vous ramène/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/tentative/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Revoir|Repasser|Continuer/ }),
      ).not.toBeInTheDocument();

      await userEvent.setup().click(screen.getByRole('button', { name: 'Fermer' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    },
  );
});
