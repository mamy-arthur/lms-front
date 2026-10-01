/**
 * Tests fonctionnels — ProgressionRuleDialog
 *
 * Vérifie les parcours utilisateur :
 * - Parcours verrouillé : les règles déjà appliquées restent consultables mais non modifiables
 * - Parcours modifiable : l'enregistrement d'une règle reste possible
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ProgressionRuleDialog,
  type NodeOption,
  type ProgressionRuleFormData,
} from '../ProgressionRuleDialog';

const NODE_OPTIONS: NodeOption[] = [
  { id: 'n-email', label: 'Email de démarrage', stepType: 'email' },
  { id: 'n-module', label: 'Module Sécurité', stepType: 'module' },
  { id: 'n-eval', label: 'Évaluation finale', stepType: 'evaluation-final' },
];

const EXISTING_RULE: ProgressionRuleFormData = {
  condition: { type: 'evaluation_passed', min_score_percentage: 70 },
  failureTargetNodeId: 'n-module',
  maxAttempts: 3,
  exhaustedTargetNodeId: null,
};

function renderDialog(props: Partial<React.ComponentProps<typeof ProgressionRuleDialog>> = {}) {
  const onSave = jest.fn();
  const view = render(
    <ProgressionRuleDialog
      open
      onOpenChange={jest.fn()}
      sourceNodeType="evaluation"
      hasExistingRule
      initialFormData={EXISTING_RULE}
      nodeOptions={NODE_OPTIONS}
      onSave={onSave}
      {...props}
    />,
  );
  return { ...view, onSave };
}

async function openTarget(name: RegExp) {
  fireEvent.keyDown(screen.getByRole('combobox', { name }), { key: 'ArrowDown' });
  await screen.findByRole('listbox');
}

describe('ProgressionRuleDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('parcours verrouillé (lecture seule)', () => {
    it('affiche les valeurs de la règle enregistrée', () => {
      renderDialog({ readOnly: true });

      expect(screen.getByLabelText('Score minimum')).toHaveValue(70);
      expect(screen.getByPlaceholderText('Illimité')).toHaveValue(3);
      expect(
        screen.getByText('Après épuisement des tentatives, rediriger vers'),
      ).toBeInTheDocument();
    });

    it('ne permet de modifier aucun champ', () => {
      renderDialog({ readOnly: true });

      expect(screen.getByLabelText('Évaluation réussie avec un score minimum')).toBeDisabled();
      expect(screen.getByLabelText('Évaluation complétée (quel que soit le score)')).toBeDisabled();
      expect(screen.getByLabelText('Score minimum')).toBeDisabled();
      expect(screen.getByPlaceholderText('Illimité')).toBeDisabled();
      for (const select of screen.getAllByRole('combobox')) {
        expect(select).toBeDisabled();
      }
    });

    it('ne propose ni enregistrement ni désactivation de la règle', async () => {
      const { onSave } = renderDialog({ readOnly: true });

      expect(screen.queryByRole('button', { name: 'Appliquer' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Aucune règle (désactiver)')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('garde visible la cible ultérieure d’une ancienne règle en consultation', () => {
      renderDialog({
        readOnly: true,
        initialFormData: { ...EXISTING_RULE, failureTargetNodeId: 'n-eval' },
      });
      expect(screen.getByRole('combobox', { name: /^Rediriger vers/ })).toHaveTextContent(
        'Évaluation finale',
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('parcours modifiable', () => {
    it('enregistre la règle configurée', async () => {
      const { onSave } = renderDialog();

      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(EXISTING_RULE);
    });

    it('permet de désactiver une règle existante', async () => {
      const { onSave } = renderDialog();

      await userEvent.click(screen.getByLabelText('Aucune règle (désactiver)'));
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ condition: null, failureTargetNodeId: null }),
      );
    });

    it.each([/^Rediriger vers/, /^Après épuisement/])(
      'affiche uniquement les étapes autorisées dans %s',
      async (name) => {
        renderDialog();
        await openTarget(name);
        const labels = screen.getAllByRole('option').map((option) => option.textContent);
        expect(labels).toEqual(
          name.test('Après épuisement')
            ? ['Échec de la formation', 'Module Sécurité', 'Évaluation finale']
            : ['Module Sécurité', 'Évaluation finale'],
        );
      },
    );

    it('permet de retenter l’évaluation source dans les deux branches', async () => {
      const { onSave } = renderDialog();
      for (const name of [/^Rediriger vers/, /^Après épuisement/]) {
        await openTarget(name);
        await userEvent.click(screen.getByRole('option', { name: 'Évaluation finale' }));
      }
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(onSave).toHaveBeenCalledWith({
        ...EXISTING_RULE,
        failureTargetNodeId: 'n-eval',
        exhaustedTargetNodeId: 'n-eval',
      });
    });

    it.each(['failureTargetNodeId', 'exhaustedTargetNodeId'] as const)(
      'bloque une ancienne cible ultérieure (%s) jusqu’à sa correction explicite',
      async (field) => {
        const { onSave } = renderDialog({
          initialFormData: { ...EXISTING_RULE, [field]: 'n-later' },
        });
        expect(screen.getByRole('alert')).toHaveTextContent('n’est plus autorisée');
        expect(screen.getByRole('button', { name: 'Appliquer' })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
        expect(onSave).not.toHaveBeenCalled();

        await openTarget(field === 'failureTargetNodeId' ? /^Rediriger vers/ : /^Après épuisement/);
        expect(screen.queryByRole('option', { name: 'n-later' })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('option', { name: 'Module Sécurité' }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
        expect(onSave).toHaveBeenCalledWith({ ...EXISTING_RULE, [field]: 'n-module' });
      },
    );

    it('permet de remplacer une cible d’épuisement invalide par l’échec de la formation', async () => {
      const { onSave } = renderDialog({
        initialFormData: { ...EXISTING_RULE, exhaustedTargetNodeId: 'n-later' },
      });
      await openTarget(/^Après épuisement/);
      await userEvent.click(screen.getByRole('option', { name: 'Échec de la formation' }));
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(onSave).toHaveBeenCalledWith(EXISTING_RULE);
    });

    it('efface la cible d’épuisement lorsque les tentatives deviennent illimitées', async () => {
      const { onSave } = renderDialog({
        initialFormData: { ...EXISTING_RULE, exhaustedTargetNodeId: 'n-later' },
      });
      await userEvent.clear(screen.getByPlaceholderText('Illimité'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /^Après épuisement/ })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(onSave).toHaveBeenCalledWith({ ...EXISTING_RULE, maxAttempts: null });
    });

    it('revalide une sélection si les cibles changent pendant l’édition sans la remplacer', async () => {
      const { rerender, onSave } = renderDialog();
      rerender(
        <ProgressionRuleDialog
          open
          onOpenChange={jest.fn()}
          sourceNodeType="evaluation"
          hasExistingRule
          initialFormData={EXISTING_RULE}
          nodeOptions={[NODE_OPTIONS[2]]}
          onSave={onSave}
        />,
      );
      expect(screen.getByRole('button', { name: 'Appliquer' })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent('n’est plus autorisée');
      await userEvent.click(screen.getByLabelText('Aucune règle (désactiver)'));
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ condition: null, failureTargetNodeId: null }),
      );
    });

    it('sélectionne une cible autorisée par défaut en activant la condition de réussite', async () => {
      const { onSave } = renderDialog({
        hasExistingRule: false,
        initialFormData: undefined,
      });
      await userEvent.click(screen.getByLabelText('Évaluation réussie avec un score minimum'));
      await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ failureTargetNodeId: 'n-module' }),
      );
    });

    it('bloque la condition de réussite sans aucune cible disponible', async () => {
      const { onSave } = renderDialog({
        initialFormData: undefined,
        nodeOptions: [],
      });
      await userEvent.click(screen.getByLabelText('Évaluation réussie avec un score minimum'));
      expect(screen.getByRole('button', { name: 'Appliquer' })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent('Choisissez une cible en cas d’échec.');
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
