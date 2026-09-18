import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormationSidebar from '../FormationSidebar';
import EvaluationNode from '../sidebar/EvaluationNode';
import { buildExecutionSummary } from '../../lib/__fixtures__/execution-summary';
import { mapSummaryToFormation } from '../../lib/summary-mapper';
import type { FormationEvaluation } from '../../lib/types';

describe('Indication de repassage sur les nœuds du sommaire', () => {
  it.each([true, false])(
    'signale les modules à refaire même verrouillés (lisible=%s), sans marquer chaque contenu',
    async (readable) => {
      const moduleSpec = {
        id: 'module-1',
        name: 'Module actif',
        requiredToRepeat: true,
        historicalCompleted: true,
        courses: [
          {
            id: 'course-1',
            name: 'Les bases',
            entries: [
              { id: 'entry-1', title: 'Premier contenu', historicalCompleted: true },
              { id: 'entry-2', title: 'Contenu suivant', historicalCompleted: true },
            ],
          },
        ],
      };
      const formation = mapSummaryToFormation(
        buildExecutionSummary({
          modules: [
            moduleSpec,
            { ...moduleSpec, id: 'module-2', name: 'Module à venir', actionable: false, readable },
            {
              ...moduleSpec,
              id: 'module-3',
              name: 'Module non commencé',
              actionable: false,
              requiredToRepeat: false,
              historicalCompleted: false,
            },
          ],
        }),
      );
      const onSelect = jest.fn();
      render(
        <FormationSidebar
          formation={formation}
          activeId="module-1:course-1:entry-1"
          onSelect={onSelect}
        />,
      );

      const active = screen.getByRole('button', { name: /Module actif/ });
      const locked = screen.getByRole('button', { name: /Module à venir/ });
      expect(within(active).getByText('À refaire')).toBeInTheDocument();
      expect(within(locked).getByText('À refaire')).toBeInTheDocument();
      expect(locked).toBeDisabled();
      expect(screen.getAllByText('À refaire')).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Premier contenu' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Contenu suivant' })).toBeDisabled();
      expect(
        within(screen.getByRole('button', { name: /Module non commencé/ })).queryByText(
          'À refaire',
        ),
      ).not.toBeInTheDocument();

      await userEvent.setup().click(locked);
      expect(onSelect).not.toHaveBeenCalled();
    },
  );

  describe.each(['intermediate', 'final'] as const)('évaluation %s', (evaluationType) => {
    it.each([
      { actionable: true, readable: true },
      { actionable: false, readable: true },
      { actionable: false, readable: false },
    ])('affiche À refaire indépendamment du verrouillage (%j)', async (permissions) => {
      const formation = mapSummaryToFormation(
        buildExecutionSummary({
          modules: [],
          finalEvaluations: [
            {
              id: 'evaluation-1',
              title: 'Bilan',
              ...permissions,
              requiredToRepeat: true,
              historicalCompleted: true,
            },
          ],
        }),
      );
      const node = { ...formation.nodes[0], evaluationType } as FormationEvaluation;
      const onSelect = jest.fn();
      render(<EvaluationNode node={node} active={false} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /Bilan/ });
      expect(within(button).getByText('À refaire')).toBeInTheDocument();
      if (permissions.actionable) expect(button).toBeEnabled();
      else expect(button).toBeDisabled();

      await userEvent.setup().click(button);
      expect(onSelect).toHaveBeenCalledTimes(permissions.actionable ? 1 : 0);
    });
  });

  it('ne demande pas de refaire une évaluation acquise sans obligation de repassage', () => {
    const formation = mapSummaryToFormation(
      buildExecutionSummary({
        modules: [],
        finalEvaluations: [{ id: 'evaluation-1', title: 'Bilan', historicalCompleted: true }],
      }),
    );
    render(<FormationSidebar formation={formation} activeId="" onSelect={jest.fn()} />);

    expect(screen.queryByText('À refaire')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bilan/ })).toBeEnabled();
  });
});
