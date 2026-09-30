/**
 * Tests fonctionnels — ProgressionRuleDialog
 *
 * Vérifie les parcours utilisateur :
 * - Parcours verrouillé : les règles déjà appliquées restent consultables mais non modifiables
 * - Parcours modifiable : l'enregistrement d'une règle reste possible
 */

import { render, screen } from '@testing-library/react';
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
  render(
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
  return { onSave };
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
  });
});
