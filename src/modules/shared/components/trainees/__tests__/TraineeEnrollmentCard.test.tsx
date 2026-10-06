import { render, screen } from '@testing-library/react';
import type { TraineeEnrollment } from '@/shared/types/trainee-detail.types';
import { TraineeDate, TraineeEnrollmentCard } from '../TraineeEnrollmentCard';

const enrollment: TraineeEnrollment = {
  id: 'inscription-1',
  status: 'in_progress',
  progress_percent: 37.5,
  completed_modules: 2,
  total_modules: 6,
  time_spent_seconds: 3661,
  enrolled_at: '2026-08-01T23:30:00Z',
  started_at: '2026-08-03T10:00:00Z',
  completed_at: null,
  failed_at: null,
  failure_reason: null,
  expires_at: '2026-12-31T00:00:00Z',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-09-30T00:00:00Z',
  learning_path: {
    id: 'formation-1',
    name: 'Sécurité incendie',
    description: 'Prévenir les risques',
    image: null,
    totalModules: 8,
    duration: 90,
    category_learning_path: { id: 'categorie-1', name: 'Prévention' },
  },
};

function mount(changes: Partial<TraineeEnrollment> = {}) {
  return render(
    <ul>
      <TraineeEnrollmentCard enrollment={{ ...enrollment, ...changes }} />
    </ul>,
  );
}

function field(label: string) {
  const value = screen.getByText(label).parentElement?.querySelector('dd');
  expect(value).not.toBeNull();
  return value as HTMLElement;
}

describe('Carte d’inscription', () => {
  it.each([
    ['in_progress', 'En cours', 37.5],
    ['completed', 'Terminée', 62.5],
    ['not_started', 'Non commencée', 0],
    ['failed', 'Échouée', 100],
    ['expired', 'Expirée', 12],
  ] as const)(
    'affiche le statut %s et les métriques serveur indépendamment de la progression',
    (status, label, progress) => {
      mount({ status, progress_percent: progress });
      expect(screen.getByRole('article', { name: 'Sécurité incendie' })).toBeVisible();
      expect(screen.getByText(label)).toBeVisible();
      expect(screen.getByText(`${progress}%`)).toBeVisible();
      expect(
        screen.getByRole('progressbar', { name: 'Progression de Sécurité incendie' }),
      ).toHaveAttribute('aria-valuenow', String(progress));
      expect(field('Modules terminés')).toHaveTextContent(/^2 \/ 6$/);
      expect(field('Temps passé')).toHaveTextContent(/^1 h 1 min 1 s$/);
      expect(screen.queryByText('Durée théorique')).not.toBeInTheDocument();
      expect(screen.queryByText('Catégorie')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );

  it.each([NaN, Infinity, -1, 101, null, undefined])(
    'ne remplace pas une progression invalide (%s) par une valeur fictive',
    (progress_percent) => {
      // Les valeurs nulles/absentes simulent une réponse réseau hors contrat.
      mount({ progress_percent } as Partial<TraineeEnrollment>);
      expect(screen.getByText('Progression indisponible')).toBeVisible();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.queryByText(/^\d+(\.\d+)?%$/)).not.toBeInTheDocument();
    },
  );

  it.each(['completed', 'failed'] as const)(
    'utilise les dates serveur de la tentative %s, jamais created_at ou updated_at',
    (status) => {
      mount({ status, completed_at: '2026-08-15T12:00:00Z', failed_at: '2026-08-20T12:00:00Z' });
      expect(field('Inscription :').querySelector('time')).toHaveAttribute(
        'datetime',
        enrollment.enrolled_at,
      );
      expect(field('Inscription :')).toHaveTextContent('01/08/2026');
      expect(field('Début :').querySelector('time')).toHaveAttribute(
        'datetime',
        enrollment.started_at,
      );
      expect(field('Fin :').querySelector('time')).toHaveAttribute(
        'datetime',
        status === 'failed' ? '2026-08-20T12:00:00Z' : '2026-08-15T12:00:00Z',
      );
      expect(field('Expiré le :').querySelector('time')).toHaveAttribute(
        'datetime',
        enrollment.expires_at,
      );
      expect(screen.queryByText('01/07/2026')).not.toBeInTheDocument();
      expect(screen.queryByText('30/09/2026')).not.toBeInTheDocument();
    },
  );

  it.each([null, undefined])(
    'tolère une formation et des dates absentes (%s), même à 100 %%',
    (missing) => {
      const { container } = mount({
        status: 'completed',
        progress_percent: 100,
        learning_path: missing,
        enrolled_at: missing,
        started_at: missing,
        completed_at: missing,
        failed_at: missing,
        expires_at: missing,
      } as unknown as Partial<TraineeEnrollment>);
      expect(screen.getByRole('article', { name: 'Formation indisponible' })).toBeVisible();
      expect(field('Inscription :')).toHaveTextContent(/^—$/);
      expect(field('Début :')).toHaveTextContent('Non démarré');
      expect(field('Fin :')).toHaveTextContent(/^—$/);
      expect(field('Expiré le :')).toHaveTextContent('Sans échéance');
      expect(field('Modules terminés')).toHaveTextContent(/^2 \/ 6$/);
      expect(field('Temps passé')).toHaveTextContent(/^1 h 1 min 1 s$/);
      expect(screen.queryByText('Durée théorique')).not.toBeInTheDocument();
      expect(container.querySelector('time')).toBeNull();
    },
  );

  it('conserve les métriques de l’inscription quand les métadonnées du catalogue sont nulles', () => {
    mount({
      learning_path: {
        ...enrollment.learning_path!,
        totalModules: null,
        duration: null,
        category_learning_path: null,
      },
    });
    expect(field('Modules terminés')).toHaveTextContent(/^2 \/ 6$/);
    expect(field('Temps passé')).toHaveTextContent(/^1 h 1 min 1 s$/);
    expect(screen.queryByText('Durée théorique')).not.toBeInTheDocument();
    expect(screen.queryByText('Catégorie')).not.toBeInTheDocument();
    expect(screen.getByText('37.5%')).toBeVisible();
  });

  it.each([
    [0, '0 s'],
    [59, '59 s'],
    [60, '1 min'],
    [61, '1 min 1 s'],
    [3600, '1 h'],
  ])('affiche exactement %i secondes de temps passé', (seconds, text) => {
    mount({ completed_modules: 0, total_modules: 0, time_spent_seconds: seconds });
    expect(field('Modules terminés')).toHaveTextContent(/^0 \/ 0$/);
    expect(field('Temps passé').textContent).toBe(text);
  });

  it.each([null, undefined, NaN, Infinity, -1, 1.5])(
    'ne remplace pas les métriques absentes ou invalides (%s) par des données du catalogue',
    (value) => {
      mount({ completed_modules: value, time_spent_seconds: value } as Partial<TraineeEnrollment>);
      expect(field('Modules terminés')).toHaveTextContent(/^—$/);
      expect(field('Temps passé')).toHaveTextContent(/^—$/);
      expect(screen.queryByText('1 h 30 min')).not.toBeInTheDocument();
    },
  );

  it.each([null, undefined, -1, 1, 1.5, Infinity])(
    'n’affiche pas un total de modules invalide (%s)',
    (total_modules) => {
      mount({ total_modules } as Partial<TraineeEnrollment>);
      expect(field('Modules terminés')).toHaveTextContent(/^—$/);
    },
  );
});

describe('Dates du stagiaire', () => {
  it.each([null, undefined, '', 'date-invalide'])(
    'affiche le remplacement sans balise time pour %s',
    (value) => {
      const { container } = render(
        <TraineeDate value={value as string | null} empty="Non renseignée" />,
      );
      expect(screen.getByText('Non renseignée')).toBeVisible();
      expect(container.querySelector('time')).toBeNull();
    },
  );

  it('formate une date en français et conserve sa valeur ISO exacte', () => {
    render(<TraineeDate value="2026-10-02T23:30:00Z" />);
    expect(screen.getByText('02/10/2026')).toHaveAttribute('datetime', '2026-10-02T23:30:00Z');
  });
});
