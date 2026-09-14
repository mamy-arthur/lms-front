import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { portalContentEntriesApi, portalLearningPathsApi } from '@/shared/api/portal.api';
import { portalScormApi, type ApiScormTrackingState } from '@/shared/api/portal-scorm.api';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import FormationPlayer from '../FormationPlayer';

jest.mock('@/shared/api/portal.api', () => ({
  portalLearningPathsApi: { summary: jest.fn(), learnerEvaluations: jest.fn() },
  portalContentEntriesApi: { get: jest.fn(), markComplete: jest.fn() },
  evaluationAttemptsApi: { start: jest.fn(), answer: jest.fn(), submit: jest.fn() },
}));
jest.mock('@/shared/api/portal-scorm.api', () => ({
  portalScormApi: {
    launch: jest.fn(),
    getTracking: jest.fn(),
    commitTracking: jest.fn(),
    getTrackingSequence: jest.fn(),
  },
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const ENROLLMENT_ID = 'enrollment-1';
const SUMMARY: ApiPortalLearningPathSummary = {
  id: 'formation-1',
  name: 'Formation séquentielle',
  progress: { percent: 20, completed: 1, total: 5 },
  modules: [
    {
      id: 'module-1',
      name: 'Les bases',
      accessible: true,
      progress: { percent: 25, completed: 1, total: 4 },
      courses: [
        {
          id: 'course-1',
          name: 'Découverte',
          sections: [
            {
              id: 'section-1',
              name: 'Introduction',
              content_entries: [
                { id: 'entry-1', title: 'Contenu 1', completed: true },
                { id: 'entry-2', title: 'Contenu 2', completed: false },
              ],
            },
            {
              id: 'section-2',
              name: 'Approfondissement',
              content_entries: [{ id: 'entry-3', title: 'Contenu 3', completed: false }],
            },
          ],
        },
        {
          id: 'course-2',
          name: 'Application',
          sections: [
            {
              id: 'section-3',
              name: 'Mise en pratique',
              content_entries: [{ id: 'entry-4', title: 'Contenu 4', completed: false }],
            },
          ],
        },
      ],
      evaluation: null,
    },
    {
      id: 'module-2',
      name: 'La suite',
      accessible: true,
      progress: { percent: 0, completed: 0, total: 1 },
      courses: [
        {
          id: 'course-3',
          name: 'Perfectionnement',
          sections: [
            {
              id: 'section-4',
              name: 'Conclusion',
              content_entries: [{ id: 'entry-5', title: 'Contenu 5', completed: false }],
            },
          ],
        },
      ],
      evaluation: null,
    },
  ],
  final_evaluation: null,
};

const mockSummary = jest.mocked(portalLearningPathsApi.summary);
const mockGetEntry = jest.mocked(portalContentEntriesApi.get);
const mockComplete = jest.mocked(portalContentEntriesApi.markComplete);
let summary: ApiPortalLearningPathSummary;

function completeEntry(entryId: string, competencyId = 'module-1') {
  for (const module of summary.modules) {
    const entries = module.courses.flatMap((course) =>
      course.sections.flatMap((section) => section.content_entries),
    );
    for (const entry of entries) {
      if (module.id === competencyId && entry.id === entryId) entry.completed = true;
    }
    const completed = entries.filter((entry) => entry.completed).length;
    module.progress = {
      completed,
      total: entries.length,
      percent: (completed / entries.length) * 100,
    };
  }
  const completed = summary.modules.reduce((count, module) => count + module.progress.completed, 0);
  const total = summary.modules.reduce((count, module) => count + module.progress.total, 0);
  summary.progress = { completed, total, percent: (completed / total) * 100 };
}

function useSharedCourse(entryCount = 2) {
  summary = {
    ...SUMMARY,
    progress: { completed: 0, total: entryCount * 2, percent: 0 },
    modules: SUMMARY.modules.map((module) => ({
      ...module,
      progress: { completed: 0, total: entryCount, percent: 0 },
      courses: [
        {
          id: 'shared-course',
          name: 'Cours partagé',
          sections: [
            {
              id: 'shared-section',
              name: 'Section partagée',
              content_entries: Array.from({ length: entryCount }, (_, index) => ({
                id: `shared-entry-${index + 1}`,
                title: `Contenu partagé ${index + 1}`,
                completed: false,
              })),
            },
          ],
        },
      ],
    })),
  };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <FormationPlayer enrollmentId={ENROLLMENT_ID} />
    </QueryClientProvider>,
  );
  return { ...view, user: userEvent.setup() };
}

describe('Progression séquentielle du stagiaire', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    summary = JSON.parse(JSON.stringify(SUMMARY)) as ApiPortalLearningPathSummary;
    mockSummary.mockImplementation(async () => ({ data: summary }));
    mockGetEntry.mockImplementation(async (_enrollmentId, _courseId, entryId) => ({
      data: {
        id: entryId,
        content_type_id: 'type-page',
        module_type: 'page',
        data: { body: `Texte de ${entryId}` },
        field_types: { body: 'textarea' },
        is_published: true,
      },
    }));
    mockComplete.mockImplementation(async (_enrollmentId, competencyId, _courseId, entryId) => {
      completeEntry(entryId, competencyId);
    });
  });

  it('reprend le contenu en cours, autorise la relecture et bloque les suivants sur ordinateur et mobile', async () => {
    const { user } = setup();
    await screen.findByText('Texte de entry-2');

    const nextContent = screen.getByRole('button', { name: 'Contenu 3' });
    expect(nextContent).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Contenu 4' })).toBeDisabled();
    await user.click(nextContent);
    expect(screen.getByText('Texte de entry-2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /module la suite/i }));
    expect(screen.getByRole('button', { name: 'Contenu 5' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Contenu 1' }));
    await screen.findByText('Texte de entry-1');
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByText('Texte de entry-2');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
    const mobileNavigation = within(
      screen.getAllByRole('navigation', { name: 'Sommaire de la formation' })[1],
    );
    const mobileLockedContent = mobileNavigation.getByRole('button', { name: 'Contenu 3' });
    expect(mobileLockedContent).toBeDisabled();
    await user.click(mobileLockedContent);
    expect(screen.getByText('Texte de entry-2')).toBeInTheDocument();
    await user.click(mobileNavigation.getByRole('button', { name: 'Contenu 1' }));
    await screen.findByText('Texte de entry-1');
    expect(mockGetEntry.mock.calls.map((call) => call[2])).toEqual(['entry-2', 'entry-1']);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('débloque chaque contenu après validation, y compris entre sections, cours et modules, et conserve la progression au retour', async () => {
    const { user, unmount } = setup();
    await screen.findByText('Texte de entry-2');

    for (const entryNumber of [2, 3, 4]) {
      await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
      await screen.findByText(`Texte de entry-${entryNumber + 1}`);
      await waitFor(() =>
        expect(
          screen.getByRole('button', {
            name: entryNumber === 4 ? 'Terminer' : 'Terminer et continuer',
          }),
        ).toBeEnabled(),
      );
    }

    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());
    expect(mockComplete.mock.calls).toEqual([
      [ENROLLMENT_ID, 'module-1', 'course-1', 'entry-2'],
      [ENROLLMENT_ID, 'module-1', 'course-1', 'entry-3'],
      [ENROLLMENT_ID, 'module-1', 'course-2', 'entry-4'],
      [ENROLLMENT_ID, 'module-2', 'course-3', 'entry-5'],
    ]);

    unmount();
    const reopened = setup();
    await screen.findByText('Texte de entry-5');
    await reopened.user.click(screen.getByRole('button', { name: /module les bases/i }));
    await reopened.user.click(screen.getByRole('button', { name: 'Contenu 2' }));
    await screen.findByText('Texte de entry-2');
    expect(mockComplete).toHaveBeenCalledTimes(4);
  });

  it('attend la sauvegarde puis le résumé actualisé avant de débloquer et charger le suivant', async () => {
    let finishSave!: () => void;
    let finishRefresh!: () => void;
    mockComplete.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = () => {
            completeEntry('entry-2');
            resolve();
          };
        }),
    );
    const { user } = setup();
    await screen.findByText('Texte de entry-2');
    await user.click(screen.getByRole('button', { name: 'Contenu 2' }));
    mockSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ data: summary });
        }),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Contenu 1' }));
    expect(screen.getByText('Texte de entry-2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();

    await act(async () => finishSave());
    await waitFor(() => expect(mockSummary).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
    expect(mockGetEntry).toHaveBeenCalledTimes(1);

    await act(async () => finishRefresh());
    await screen.findByText('Texte de entry-3');
    expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Contenu 4' })).toBeDisabled();
  });

  it('conserve le verrouillage si la sauvegarde échoue et permet de réessayer', async () => {
    mockComplete.mockRejectedValueOnce(new Error('Échec réseau'));
    const { user } = setup();
    await screen.findByText('Texte de entry-2');
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText('Texte de entry-2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
    expect(mockGetEntry).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Texte de entry-3');
    expect(mockComplete).toHaveBeenCalledTimes(2);
  });

  it('ne contourne pas un module verrouillé par le serveur après la dernière validation du module précédent', async () => {
    completeEntry('entry-2');
    completeEntry('entry-3');
    summary.modules[1].accessible = false;
    const { user } = setup();
    await screen.findByText('Texte de entry-4');
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());
    expect(screen.getByText('Texte de entry-4')).toBeInTheDocument();
    expect(mockGetEntry.mock.calls.map((call) => call[2])).toEqual(['entry-4']);
  });

  it('garde les anciens contenus terminés consultables sans débloquer les contenus après une lacune', async () => {
    completeEntry('entry-4');
    completeEntry('entry-5', 'module-2');
    summary.modules[1].accessible = false;
    const { user } = setup();
    await screen.findByText('Texte de entry-2');
    await user.click(screen.getByRole('button', { name: 'Contenu 4' }));
    await screen.findByText('Texte de entry-4');
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /module la suite/i }));
    await user.click(screen.getByRole('button', { name: 'Contenu 5' }));
    await screen.findByText('Texte de entry-5');
    expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('termine chaque occurrence d’un cours partagé indépendamment sans contourner l’ordre', async () => {
    useSharedCourse();
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    await user.click(screen.getByRole('button', { name: /module la suite/i }));
    expect(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Texte de shared-entry-2');
    expect(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]).toBeDisabled();
    expect(summary.modules[1].progress.completed).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Contenu 3 / 4');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );
    expect(screen.getByText('Texte de shared-entry-1')).toBeInTheDocument();
    expect(summary.modules[0].progress.completed).toBe(2);
    expect(summary.modules[1].progress.completed).toBe(0);
    expect(screen.getAllByRole('button', { name: 'Contenu partagé 2' })[1]).toBeDisabled();

    // Re-reading the first occurrence must not select or complete the second one.
    await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[0]);
    await screen.findByText('Contenu 1 / 4');
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled();
    await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]);
    await screen.findByText('Contenu 3 / 4');

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Contenu 4 / 4');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Terminer' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());

    expect(mockComplete.mock.calls).toEqual([
      [ENROLLMENT_ID, 'module-1', 'shared-course', 'shared-entry-1'],
      [ENROLLMENT_ID, 'module-1', 'shared-course', 'shared-entry-2'],
      [ENROLLMENT_ID, 'module-2', 'shared-course', 'shared-entry-1'],
      [ENROLLMENT_ID, 'module-2', 'shared-course', 'shared-entry-2'],
    ]);
    expect(summary.modules.map((module) => module.progress.completed)).toEqual([2, 2]);
    // GET still uses the raw UUID, never the module-scoped navigation identity.
    expect(mockGetEntry.mock.calls).toEqual([
      [ENROLLMENT_ID, 'shared-course', 'shared-entry-1'],
      [ENROLLMENT_ID, 'shared-course', 'shared-entry-2'],
    ]);
  });

  it('reprend la bonne occurrence après rechargement et permet de la sélectionner sur mobile', async () => {
    useSharedCourse(1);
    completeEntry('shared-entry-1');
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    expect(screen.getByText('Contenu 2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terminer' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
    const mobileNavigation = within(
      screen.getAllByRole('navigation', { name: 'Sommaire de la formation' })[1],
    );
    await user.click(mobileNavigation.getByRole('button', { name: /module les bases/i }));
    await user.click(mobileNavigation.getAllByRole('button', { name: 'Contenu partagé 1' })[0]);
    await screen.findByText('Contenu 1 / 2');
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
    const reopenedNavigation = within(
      screen.getAllByRole('navigation', { name: 'Sommaire de la formation' })[1],
    );
    await user.click(reopenedNavigation.getByRole('button', { name: /module la suite/i }));
    await user.click(reopenedNavigation.getAllByRole('button', { name: 'Contenu partagé 1' })[1]);
    await screen.findByText('Contenu 2 / 2');
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockComplete).toHaveBeenCalledWith(
      ENROLLMENT_ID,
      'module-2',
      'shared-course',
      'shared-entry-1',
    );
  });

  it('réessaie une réponse perdue pour le même module sans valider l’autre occurrence', async () => {
    useSharedCourse(1);
    mockComplete.mockImplementationOnce(async (_enrollmentId, competencyId, _courseId, entryId) => {
      completeEntry(entryId, competencyId);
      throw new Error('Réponse perdue après enregistrement');
    });
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Contenu 2 / 2');
    expect(mockComplete.mock.calls).toEqual([
      [ENROLLMENT_ID, 'module-1', 'shared-course', 'shared-entry-1'],
      [ENROLLMENT_ID, 'module-1', 'shared-course', 'shared-entry-1'],
    ]);
    expect(summary.modules.map((module) => module.progress.completed)).toEqual([1, 0]);
  });

  it('attribue la validation SCORM au nouveau module lors du passage au même contenu partagé', async () => {
    useSharedCourse(1);
    mockGetEntry.mockResolvedValue({
      data: {
        id: 'shared-entry-1',
        content_type_id: 'type-scorm',
        module_type: 'scorm',
        data: { scorm_package_id: 'package-1' },
        field_types: {},
        is_published: true,
      },
    });
    const tracking: ApiScormTrackingState = {
      content_entry_id: 'shared-entry-1',
      lesson_status: 'incomplete',
      score_raw: null,
      score_min: null,
      score_max: null,
      session_time: 0,
      total_time: 0,
      cmi_data: {},
      last_commit_id: null,
      last_sequence: 0,
      updated_at: null,
    };
    jest.mocked(portalScormApi.launch).mockResolvedValue({
      data: {
        content_entry_id: 'shared-entry-1',
        scorm_package_id: 'package-1',
        version: '1.2',
        launch_path: 'index.html',
        launch_url: 'about:blank',
      },
    });
    jest.mocked(portalScormApi.getTracking).mockResolvedValue({ data: tracking });
    jest.mocked(portalScormApi.commitTracking).mockResolvedValue({
      data: { ...tracking, lesson_status: 'completed', last_sequence: 1 },
    });
    const { user } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    // Manual completion does not alter the SCORM tracking endpoint.
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Contenu 2 / 2');
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Terminer' })).toBeEnabled());

    const scormApi = (
      window as unknown as {
        API: {
          LMSSetValue: (key: string, value: string) => string;
          LMSCommit: () => string;
        };
      }
    ).API;
    await act(async () => {
      scormApi.LMSSetValue('cmi.core.lesson_status', 'completed');
      scormApi.LMSCommit();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());
    expect(mockComplete.mock.calls).toEqual([
      [ENROLLMENT_ID, 'module-1', 'shared-course', 'shared-entry-1'],
      [ENROLLMENT_ID, 'module-2', 'shared-course', 'shared-entry-1'],
    ]);
  });
});
