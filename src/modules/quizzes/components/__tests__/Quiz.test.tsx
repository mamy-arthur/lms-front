import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Quiz } from '../Quiz';
import { normalizeQuestion } from '@/modules/shared/lib/question-types';

jest.mock('@/shared/simulation/useSimulationUser', () => ({ useSimulationUser: () => null }));

describe('Quiz piloté par le serveur', () => {
  it('émet chaque modification une fois sous StrictMode sans produire de résultat local', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    render(
      <StrictMode>
        <Quiz
          serverManaged
          title="Test"
          questions={[
            normalizeQuestion({
              id: 'q',
              type: 'multiple_choice',
              options: [{ id: 'a', label: 'Choix' }],
            }),
          ]}
          onAnswerChange={onChange}
          onSubmit={onSubmit}
        />
      </StrictMode>,
    );
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Choix/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Soumettre le quiz' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main', { name: 'Examen : Test' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Choix/ })).toBeChecked();
  });

  it('accepte les associations partielles, exige toutes les paires et émet un effacement à la réinitialisation', () => {
    const onChange = jest.fn();
    render(
      <Quiz
        serverManaged
        questions={[
          normalizeQuestion({
            id: 'q',
            type: 'matching',
            pairs: [
              { id: '0', question: 'Gauche A', answer: 'Droite A' },
              { id: '1', question: 'Gauche B', answer: 'Droite B' },
            ],
          }),
        ]}
        onAnswerChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gauche A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Droite B' }));
    expect(onChange).toHaveBeenLastCalledWith('q', { '0': '1' });
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Gauche B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Droite A' }));
    expect(onChange).toHaveBeenLastCalledWith('q', { '0': '1', '1': '0' });
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les paires' }));
    expect(onChange).toHaveBeenLastCalledWith('q', {});
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeDisabled();
  });

  it('autorise la navigation entre questions mais exige toutes les réponses pour terminer manuellement', () => {
    render(
      <Quiz
        serverManaged
        questions={['one', 'two'].map((id) =>
          normalizeQuestion({
            id,
            type: 'multiple_choice',
            options: [{ id: 'a', label: id }],
          }),
        )}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /two/ }));
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /one/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeEnabled();
  });
});
