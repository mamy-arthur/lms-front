import { fireEvent, render, screen } from '@testing-library/react';
import { AddEvaluationDialog, type EvaluationConfig } from '../AddEvaluationDialog';

jest.mock('../../../hooks/useEvaluationQuery', () => ({
  useEvaluationQuery: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('../../../hooks/useQuestionPoolCheck', () => ({
  useQuestionPoolCheck: () => ({ data: undefined, isLoading: false, isError: false }),
}));
jest.mock('@/modules/admin/resources/quizzes/hooks/useQuizzesQuery', () => ({
  useQuizzesQuery: () => ({ data: undefined, isLoading: false }),
}));

const CONFIG: EvaluationConfig = {
  stepType: 'evaluation-final',
  title: 'Évaluation finale',
  timeLimitMinutes: null,
  questionCount: 1,
  attemptCount: 1,
  questionBankIds: ['bank-1'],
  questionBankNames: ['Banque'],
};

function setup(config: EvaluationConfig = CONFIG) {
  const onConfirm = jest.fn();
  render(
    <AddEvaluationDialog
      open
      onOpenChange={jest.fn()}
      hasFinalEval={false}
      initialConfig={config}
      learningPathId="path-1"
      allModuleIds={['module-1']}
      moduleNameById={{ 'module-1': 'Module' }}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, submit: screen.getByRole('button', { name: "Modifier l'évaluation" }) };
}

describe('AddEvaluationDialog — limite de temps', () => {
  it('reste illimitée par défaut et accepte une seule saisie supérieure à 59 minutes', () => {
    const { onConfirm, submit } = setup();
    expect(screen.queryByLabelText('Durée maximale (minutes)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Limiter le temps de l’évaluation' }));
    fireEvent.change(screen.getByLabelText('Durée maximale (minutes)'), {
      target: { value: '90' },
    });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ timeLimitMinutes: 90 }));
  });

  it('relit puis supprime une limite existante', () => {
    const { onConfirm, submit } = setup({ ...CONFIG, timeLimitMinutes: 120 });
    expect(screen.getByLabelText('Durée maximale (minutes)')).toHaveValue(120);
    fireEvent.click(screen.getByRole('switch', { name: 'Limiter le temps de l’évaluation' }));
    fireEvent.click(submit);
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ timeLimitMinutes: null }));
  });

  it.each(['0', '-1', '1.5', '2147483648', ''])(
    'bloque la confirmation pour une durée invalide : %s',
    (value) => {
      const { onConfirm, submit } = setup({ ...CONFIG, timeLimitMinutes: 30 });
      fireEvent.change(screen.getByLabelText('Durée maximale (minutes)'), { target: { value } });
      expect(submit).toBeDisabled();
      expect(screen.getByLabelText('Durée maximale (minutes)')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      fireEvent.click(submit);
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );
});
