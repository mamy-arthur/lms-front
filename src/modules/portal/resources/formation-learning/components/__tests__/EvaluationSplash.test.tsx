/**
 * Tests unitaires — EvaluationSplash
 *
 * Le cœur du fichier est la course signalée en production : le CTA « Commencer »
 * s'affichait pendant que le quota de tentatives était encore en chargement, donc
 * des apprenants le cliquaient sur une évaluation déjà épuisée. La règle testée
 * ici est simple — tant que le quota n'est pas connu, aucun bouton actionnable.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EvaluationSplash from '../EvaluationSplash';

const baseProps = {
  title: 'Évaluation finale',
  evaluationType: 'final' as const,
  onStart: jest.fn(),
};

const START_LABEL = /commencer l’évaluation|commencer l'évaluation/i;

describe('EvaluationSplash', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── La course corrigée ─────────────────────────────────────────────────────

  describe('tant que le quota de tentatives est inconnu', () => {
    it('n’affiche pas le bouton Commencer', () => {
      render(<EvaluationSplash {...baseProps} isCheckingAttempts />);

      expect(screen.queryByRole('button', { name: START_LABEL })).not.toBeInTheDocument();
    });

    it('affiche un état d’attente annoncé, et aucun contrôle du tout', async () => {
      render(<EvaluationSplash {...baseProps} isCheckingAttempts />);

      // role="status" plutôt qu'un bouton désactivé : rien à cliquer, donc rien
      // qui ressemble à un contrôle — ni pour l'œil, ni dans l'arbre a11y.
      const placeholder = screen.getByRole('status');
      expect(placeholder).toHaveTextContent(/vérification de vos tentatives/i);
      expect(screen.queryAllByRole('button')).toHaveLength(0);

      await userEvent.click(placeholder);
      expect(baseProps.onStart).not.toHaveBeenCalled();
    });

    it('ne promet pas non plus que l’évaluation est disponible', () => {
      render(<EvaluationSplash {...baseProps} isCheckingAttempts />);

      expect(screen.queryByText(/vous pourrez commencer/i)).not.toBeInTheDocument();
    });

    it('ne conclut pas à tort que les tentatives sont épuisées', () => {
      render(<EvaluationSplash {...baseProps} isCheckingAttempts attemptsRemaining={undefined} />);

      expect(screen.queryByText(/tentatives épuisées/i)).not.toBeInTheDocument();
    });
  });

  // ── Quota connu ────────────────────────────────────────────────────────────

  it('propose le démarrage une fois le quota chargé et non épuisé', async () => {
    render(<EvaluationSplash {...baseProps} maxAttempts={3} attemptsRemaining={2} />);

    expect(screen.getByText(/2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: START_LABEL }));
    expect(baseProps.onStart).toHaveBeenCalledTimes(1);
  });

  it('remplace le CTA par un message définitif quand les tentatives sont épuisées', () => {
    render(<EvaluationSplash {...baseProps} maxAttempts={3} attemptsRemaining={0} />);

    expect(screen.getByText(/tentatives épuisées/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: START_LABEL })).not.toBeInTheDocument();
  });

  it('autorise le démarrage quand le nombre de tentatives est illimité', () => {
    render(<EvaluationSplash {...baseProps} maxAttempts={null} attemptsRemaining={null} />);

    expect(screen.getByRole('button', { name: START_LABEL })).toBeEnabled();
  });

  // ── Quota non récupérable ──────────────────────────────────────────────────

  describe('quand le quota ne peut pas être récupéré', () => {
    it('le signale et offre de réessayer plutôt que de laisser démarrer à l’aveugle', async () => {
      const onRetryAttempts = jest.fn();
      render(
        <EvaluationSplash {...baseProps} hasAttemptsError onRetryAttempts={onRetryAttempts} />,
      );

      expect(screen.getByText(/impossible de vérifier vos tentatives/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: START_LABEL })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));
      expect(onRetryAttempts).toHaveBeenCalledTimes(1);
    });
  });

  // ── Démarrage en cours ─────────────────────────────────────────────────────

  it('signale le démarrage en cours et bloque un double clic', async () => {
    render(<EvaluationSplash {...baseProps} isLoading maxAttempts={3} attemptsRemaining={1} />);

    const cta = screen.getByRole('button', { name: /démarrage/i });
    expect(cta).toBeDisabled();
    expect(cta).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(cta);
    expect(baseProps.onStart).not.toHaveBeenCalled();
  });

  // ── Mode mock (aucune donnée de tentative) ─────────────────────────────────

  it('reste utilisable quand aucune information de tentative n’est fournie', async () => {
    render(<EvaluationSplash {...baseProps} />);

    await userEvent.click(screen.getByRole('button', { name: START_LABEL }));
    expect(baseProps.onStart).toHaveBeenCalledTimes(1);
  });
});
