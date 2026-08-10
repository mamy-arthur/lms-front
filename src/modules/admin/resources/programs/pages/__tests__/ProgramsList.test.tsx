/**
 * Tests fonctionnels — Gestion des parcours (ProgramsList)
 *
 * Vérifie les scénarios CRUD du point de vue utilisateur :
 * - Consultation de la liste des parcours
 * - Création d'un parcours
 * - Modification d'un parcours
 * - Suppression d'un parcours
 */

// ─── Polyfills ────────────────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ProgramFlow utilise ReactFlow (canvas) — incompatible avec jsdom
jest.mock('@/modules/admin/resources/programs/components/ProgramFlow', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/modules/admin/resources/programs/hooks/useLearningPathsQuery', () => ({
  useLearningPathsQuery: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useLearningPathCategoriesQuery', () => ({
  useLearningPathCategoriesQuery: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDeleteLearningPath', () => ({
  useDeleteLearningPath: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useCreateLearningPath', () => ({
  useCreateLearningPath: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useUpdateLearningPath', () => ({
  useUpdateLearningPath: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useUploadLearningPathMedia', () => ({
  useUploadLearningPathMedia: jest.fn(),
}));

jest.mock('@/modules/admin/resources/programs/hooks/useLinkCompetencyToLearningPath', () => ({
  useLinkCompetencyToLearningPath: jest.fn(),
}));

jest.mock('@/modules/admin/resources/programs/hooks/useUnlinkCompetencyFromLearningPath', () => ({
  useUnlinkCompetencyFromLearningPath: jest.fn(),
}));

// Hooks internes de LearningPathCategoriesDrawer — non testés ici
jest.mock('@/modules/admin/resources/programs/hooks/useCreateLearningPathCategory', () => ({
  useCreateLearningPathCategory: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useUpdateLearningPathCategory', () => ({
  useUpdateLearningPathCategory: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDeleteLearningPathCategory', () => ({
  useDeleteLearningPathCategory: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

// useModules est utilisé par LearningPathFormDrawer — on évite l'appel API réel
jest.mock('@/modules/admin/resources/modules/hooks/useModules', () => ({
  useModules: jest.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
}));

// Requêtes individuelles utilisées par LearningPathFormDrawer en mode édition
jest.mock('@/modules/admin/resources/programs/hooks/useLearningPathQuery', () => ({
  useLearningPathQuery: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useEvaluationsQuery', () => ({
  useEvaluationsQuery: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useProgressionRulesQuery', () => ({
  useProgressionRulesQuery: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useCreateEvaluation', () => ({
  useCreateEvaluation: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDeleteEvaluation', () => ({
  useDeleteEvaluation: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useAssignMailTemplate', () => ({
  useAssignMailTemplate: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useAssignCertificate', () => ({
  useAssignCertificate: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDetachCertificate', () => ({
  useDetachCertificate: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useCreateProgressionRule', () => ({
  useCreateProgressionRule: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ id: 'rule-1' }),
    isPending: false,
  }),
}));
jest.mock('@/modules/admin/resources/programs/hooks/usePatchProgressionRule', () => ({
  usePatchProgressionRule: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ id: 'rule-1' }),
    isPending: false,
  }),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDeactivateProgressionRule', () => ({
  useDeactivateProgressionRule: () => ({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { useLearningPathsQuery } from '../../hooks/useLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../../hooks/useLearningPathCategoriesQuery';
import { useDeleteLearningPath } from '../../hooks/useDeleteLearningPath';
import { useCreateLearningPath } from '../../hooks/useCreateLearningPath';
import { useUpdateLearningPath } from '../../hooks/useUpdateLearningPath';
import { useUploadLearningPathMedia } from '../../hooks/useUploadLearningPathMedia';
import { useLinkCompetencyToLearningPath } from '../../hooks/useLinkCompetencyToLearningPath';
import { useUnlinkCompetencyFromLearningPath } from '../../hooks/useUnlinkCompetencyFromLearningPath';
import { useLearningPathQuery } from '../../hooks/useLearningPathQuery';
import { useEvaluationsQuery } from '../../hooks/useEvaluationsQuery';
import { useProgressionRulesQuery } from '../../hooks/useProgressionRulesQuery';
import { useCreateEvaluation } from '../../hooks/useCreateEvaluation';
import { useDeleteEvaluation } from '../../hooks/useDeleteEvaluation';
import { useAssignMailTemplate } from '../../hooks/useAssignMailTemplate';
import { useAssignCertificate } from '../../hooks/useAssignCertificate';
import { useDetachCertificate } from '../../hooks/useDetachCertificate';
import type { CreateEvaluationPayload } from '@/shared/api/evaluations.api';
import ProgramFlow from '../../components/ProgramFlow';
import type { ProgramFlowProps } from '../../components/ProgramFlow';
import { ProgramsList } from '../ProgramsList';
import type { LearningPath } from '../../types';

const mockUseLearningPathsQuery = jest.mocked(useLearningPathsQuery);
const mockUseLearningPathCategoriesQuery = jest.mocked(useLearningPathCategoriesQuery);
const mockUseDeleteLearningPath = jest.mocked(useDeleteLearningPath);
const mockUseCreateLearningPath = jest.mocked(useCreateLearningPath);
const mockUseUpdateLearningPath = jest.mocked(useUpdateLearningPath);
const mockUseUploadLearningPathMedia = jest.mocked(useUploadLearningPathMedia);
const mockUseLinkCompetency = jest.mocked(useLinkCompetencyToLearningPath);
const mockUseUnlinkCompetency = jest.mocked(useUnlinkCompetencyFromLearningPath);
const mockUseLearningPathQuery = jest.mocked(useLearningPathQuery);
const mockUseEvaluationsQuery = jest.mocked(useEvaluationsQuery);
const mockUseProgressionRulesQuery = jest.mocked(useProgressionRulesQuery);
const mockUseCreateEvaluation = jest.mocked(useCreateEvaluation);
const mockUseDeleteEvaluation = jest.mocked(useDeleteEvaluation);
const mockUseAssignMailTemplate = jest.mocked(useAssignMailTemplate);
const mockUseAssignCertificate = jest.mocked(useAssignCertificate);
const mockUseDetachCertificate = jest.mocked(useDetachCertificate);
const MockProgramFlow = jest.mocked(ProgramFlow);
const mockToast = jest.mocked(toast);

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_PATH_1: LearningPath = {
  id: 'lp-1',
  tenantId: 'tenant-1',
  name: 'Parcours Chef de projet',
  description: 'Un parcours complet',
  idnumber: 'CP-001',
  categoryId: null,
  price: null,
  currency: null,
  image: null,
  publishedAt: null,
  authorId: null,
  showInShop: false,
  isPublished: false,
  isSellable: false,
  duration: null,
  competencies: [],
  evaluations: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_PATH_WITH_COMPETENCY: LearningPath = {
  ...MOCK_PATH_1,
  id: 'lp-with-comp',
  name: 'Parcours avec compétence',
  competencies: [
    {
      competencyId: 'comp-1',
      position: 0,
      locationX: 300,
      locationY: 150,
    },
  ],
};

const MOCK_PATH_2: LearningPath = {
  ...MOCK_PATH_1,
  id: 'lp-2',
  name: 'Parcours Data Science',
  idnumber: 'DS-001',
};

const EVAL_PAYLOAD: CreateEvaluationPayload = {
  title: 'Évaluation intermédiaire',
  type: 'PARTIAL',
  question_bank_ids: ['qb1'],
  question_count: 10,
  max_attempts: 2,
  location_x: 200,
  location_y: 100,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDefaults({
  paths = [MOCK_PATH_1, MOCK_PATH_2],
  isLoading = false,
  deleteMutateAsync = jest.fn().mockResolvedValue(undefined),
  createMutateAsync = jest.fn().mockResolvedValue({ data: { id: 'new-lp' } }),
  updateMutateAsync = jest.fn().mockResolvedValue(undefined),
  linkMutateAsync = jest.fn().mockResolvedValue(undefined),
  unlinkMutateAsync = jest.fn().mockResolvedValue(undefined),
  createEvaluationMutateAsync = jest.fn().mockResolvedValue({ id: 'eval-new' }),
  deleteEvaluationMutateAsync = jest.fn().mockResolvedValue(undefined),
  assignMailTemplateMutateAsync = jest.fn().mockResolvedValue(undefined),
  assignCertificateMutateAsync = jest.fn().mockResolvedValue(undefined),
  detachCertificateMutateAsync = jest.fn().mockResolvedValue(undefined),
}: {
  paths?: LearningPath[];
  isLoading?: boolean;
  deleteMutateAsync?: jest.Mock;
  createMutateAsync?: jest.Mock;
  updateMutateAsync?: jest.Mock;
  linkMutateAsync?: jest.Mock;
  unlinkMutateAsync?: jest.Mock;
  createEvaluationMutateAsync?: jest.Mock;
  deleteEvaluationMutateAsync?: jest.Mock;
  assignMailTemplateMutateAsync?: jest.Mock;
  assignCertificateMutateAsync?: jest.Mock;
  detachCertificateMutateAsync?: jest.Mock;
} = {}) {
  mockUseLearningPathsQuery.mockReturnValue({
    data: paths,
    isLoading,
  } as unknown as ReturnType<typeof useLearningPathsQuery>);

  mockUseLearningPathCategoriesQuery.mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useLearningPathCategoriesQuery>);

  mockUseDeleteLearningPath.mockReturnValue({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteLearningPath>);

  mockUseCreateLearningPath.mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateLearningPath>);

  mockUseUpdateLearningPath.mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateLearningPath>);

  mockUseUploadLearningPathMedia.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUploadLearningPathMedia>);

  mockUseLinkCompetency.mockReturnValue({
    mutateAsync: linkMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useLinkCompetencyToLearningPath>);

  mockUseUnlinkCompetency.mockReturnValue({
    mutateAsync: unlinkMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUnlinkCompetencyFromLearningPath>);

  // Retourne le parcours correspondant à l'ID demandé (utilisé par LearningPathFormDrawer)
  mockUseLearningPathQuery.mockImplementation(
    (id: string | null) =>
      ({
        data: id ? paths.find((p) => p.id === id) : undefined,
        isLoading: false,
      }) as unknown as ReturnType<typeof useLearningPathQuery>,
  );

  mockUseEvaluationsQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof useEvaluationsQuery>);

  mockUseProgressionRulesQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof useProgressionRulesQuery>);

  mockUseCreateEvaluation.mockReturnValue({
    mutateAsync: createEvaluationMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateEvaluation>);

  mockUseDeleteEvaluation.mockReturnValue({
    mutateAsync: deleteEvaluationMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteEvaluation>);

  mockUseAssignMailTemplate.mockReturnValue({
    mutateAsync: assignMailTemplateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useAssignMailTemplate>);

  mockUseAssignCertificate.mockReturnValue({
    mutateAsync: assignCertificateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useAssignCertificate>);

  mockUseDetachCertificate.mockReturnValue({
    mutateAsync: detachCertificateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDetachCertificate>);

  // Par défaut ProgramFlow ne fait rien — les tests spécifiques remplacent cette implémentation
  MockProgramFlow.mockReturnValue(null);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProgramsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaults();
  });

  // ── Consultation de la liste ───────────────────────────────────────────────

  describe('liste des parcours', () => {
    it("affiche les parcours renvoyés par l'API", () => {
      render(<ProgramsList />, { wrapper: createWrapper() });

      expect(screen.getByText('Parcours Chef de projet')).toBeInTheDocument();
      expect(screen.getByText('Parcours Data Science')).toBeInTheDocument();
    });

    it("affiche un état vide si aucun parcours n'est renvoyé", () => {
      mockDefaults({ paths: [] });

      render(<ProgramsList />, { wrapper: createWrapper() });

      expect(screen.queryByText('Parcours Chef de projet')).not.toBeInTheDocument();
    });

    it("affiche l'état de chargement pendant la récupération des données", () => {
      mockDefaults({ paths: [], isLoading: true });

      render(<ProgramsList />, { wrapper: createWrapper() });

      // Le tableau affiche des squelettes pendant le chargement
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    });
  });

  // ── Création ──────────────────────────────────────────────────────────────

  describe("création d'un parcours", () => {
    it('ouvre le drawer au clic sur « Nouveau parcours »', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('soumet le formulaire avec le nom saisi et ferme le drawer', async () => {
      const createMutateAsync = jest.fn().mockResolvedValue({ data: { id: 'new-lp' } });
      mockDefaults({ createMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir le drawer
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      // Remplir le champ nom
      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nouveau parcours test');

      // Soumettre
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(createMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Nouveau parcours test' }),
        );
      });
    });

    it('affiche un toast de succès après la création', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Parcours succès');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Parcours créé');
      });
    });

    it("affiche un toast d'erreur si l'API échoue lors de la création", async () => {
      const createMutateAsync = jest.fn().mockRejectedValue(new Error('Server error'));
      mockDefaults({ createMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Parcours erreur');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  // ── Modification ──────────────────────────────────────────────────────────

  describe("modification d'un parcours", () => {
    it('ouvre le drawer avec les données du parcours existant', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir le menu d'actions pour le premier parcours
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      // Le champ nom doit contenir le nom du parcours
      const nameInput = screen.getByLabelText(/nom du parcours/i);
      expect(nameInput).toHaveValue(MOCK_PATH_1.name);
    });

    it('envoie la mise à jour avec les nouvelles valeurs', async () => {
      const updateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ updateMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode édition
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      // Modifier le nom
      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nom modifié');

      // Soumettre
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(updateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ id: MOCK_PATH_1.id, name: 'Nom modifié' }),
        );
      });
    });

    it('affiche un toast de succès après la modification', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nom modifié');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Parcours mis à jour');
      });
    });

    it("affiche un toast d'erreur si l'API échoue lors de la modification", async () => {
      const updateMutateAsync = jest.fn().mockRejectedValue(new Error('Server error'));
      mockDefaults({ updateMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom du parcours/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nom modifié');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  // ── Visible en boutique (canPublish) ──────────────────────────────────────

  describe('visible en boutique', () => {
    it('le switch est désactivé si aucun module dans le flow et aucune compétence sauvegardée', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      const toggle = await screen.findByRole('switch', { name: /visible en boutique/i });
      expect(toggle).toBeDisabled();
    });

    it("le switch s'active dès qu'un module est ajouté dans le flow", async () => {
      let capturedOnModulesChange: ((v: boolean) => void) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnModulesChange = props.onModulesChange;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      // Avant l'ajout d'un module
      const toggle = await screen.findByRole('switch', { name: /visible en boutique/i });
      expect(toggle).toBeDisabled();

      // Le flow signal un module présent
      act(() => capturedOnModulesChange?.(true));

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /visible en boutique/i })).not.toBeDisabled();
      });
    });

    it('le switch est actif si le parcours a déjà des compétences sauvegardées', async () => {
      mockDefaults({ paths: [MOCK_PATH_WITH_COMPETENCY] });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(
        screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_WITH_COMPETENCY.name}` }),
      );
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const toggle = await screen.findByRole('switch', { name: /visible en boutique/i });
      expect(toggle).not.toBeDisabled();
    });
  });

  // ── Détachement de compétences ───────────────────────────────────────────

  describe('détachement de compétences', () => {
    it('détache la compétence immédiatement lors de la suppression du nœud dans le flow', async () => {
      const unlinkMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ paths: [MOCK_PATH_WITH_COMPETENCY], unlinkMutateAsync });

      let capturedOnModuleRemove: ((id: string) => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnModuleRemove = props.onModuleRemove;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(
        screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_WITH_COMPETENCY.name}` }),
      );
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      // Simuler la suppression d'un nœud dans le flow
      await act(async () => {
        await capturedOnModuleRemove?.('comp-1');
      });

      // L'API doit être appelée immédiatement, sans attendre l'enregistrement
      expect(unlinkMutateAsync).toHaveBeenCalledWith({
        id: MOCK_PATH_WITH_COMPETENCY.id,
        competencyId: 'comp-1',
      });
    });

    it("ne détache pas la compétence si le parcours n'a pas encore d'identifiant", async () => {
      const unlinkMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ unlinkMutateAsync });

      let capturedOnModuleRemove: ((id: string) => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnModuleRemove = props.onModuleRemove;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création (aucun ID de parcours)
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      // Simuler la suppression d'un nœud
      await act(async () => {
        await capturedOnModuleRemove?.('comp-1');
      });

      // Sans ID de parcours, l'API ne doit pas être appelée
      expect(unlinkMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ── Gestion des évaluations dans le flow ──────────────────────────────────

  describe('gestion des évaluations dans le flow', () => {
    it("crée l'évaluation via l'API immédiatement lors de l'ajout dans le flow (mode édition)", async () => {
      const createEvaluationMutateAsync = jest.fn().mockResolvedValue({ id: 'eval-new' });
      mockDefaults({ createEvaluationMutateAsync });

      let capturedOnEvalCreate: ((data: CreateEvaluationPayload) => Promise<string>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnEvalCreate = props.onEvalCreate;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode édition (LP avec ID existant)
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      let returnedId: string | undefined;
      await act(async () => {
        returnedId = await capturedOnEvalCreate?.(EVAL_PAYLOAD);
      });

      expect(createEvaluationMutateAsync).toHaveBeenCalledWith({
        learningPathId: MOCK_PATH_1.id,
        ...EVAL_PAYLOAD,
      });
      expect(returnedId).toBe('eval-new');
    });

    it("affiche une erreur si on tente d'ajouter une évaluation sans avoir configuré l'email", async () => {
      const createEvaluationMutateAsync = jest.fn();
      mockDefaults({ createEvaluationMutateAsync });

      let capturedOnEvalCreate: ((data: CreateEvaluationPayload) => Promise<string>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnEvalCreate = props.onEvalCreate;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création (aucun email configuré, aucun ID de parcours)
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      // Simuler l'ajout d'une évaluation sans email préalable
      await act(async () => {
        try {
          await capturedOnEvalCreate?.(EVAL_PAYLOAD);
        } catch {
          // expected
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Configurez d'abord l'email de démarrage avant d'ajouter des éléments.",
      );
      expect(createEvaluationMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ── Assignation de l'email de démarrage ────────────────────────────────────

  describe("assignation de l'email de démarrage", () => {
    it("assigne le template email via l'API en mode édition", async () => {
      const assignMailTemplateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ assignMailTemplateMutateAsync });

      let capturedOnMailTemplateAssign:
        | ((mailTemplateId: string, position: { x: number; y: number }) => Promise<void>)
        | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnMailTemplateAssign = props.onMailTemplateAssign;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode édition (LP avec ID existant)
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      await act(async () => {
        await capturedOnMailTemplateAssign?.('mail-tpl-1', { x: 120, y: 240 });
      });

      expect(assignMailTemplateMutateAsync).toHaveBeenCalledWith({
        learningPathId: MOCK_PATH_1.id,
        mailTemplateId: 'mail-tpl-1',
        locationX: 120,
        locationY: 240,
      });
    });

    it('crée le parcours puis assigne le template email en mode création', async () => {
      const createMutateAsync = jest.fn().mockResolvedValue({ data: { id: 'lp-created' } });
      const assignMailTemplateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ createMutateAsync, assignMailTemplateMutateAsync });

      let capturedOnMailTemplateAssign:
        | ((mailTemplateId: string, position: { x: number; y: number }) => Promise<void>)
        | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnMailTemplateAssign = props.onMailTemplateAssign;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      await act(async () => {
        await capturedOnMailTemplateAssign?.('mail-tpl-1', { x: 90, y: 180 });
      });

      // Le LP doit être créé en premier
      expect(createMutateAsync).toHaveBeenCalled();
      // Puis le template assigné avec l'ID du nouveau LP
      expect(assignMailTemplateMutateAsync).toHaveBeenCalledWith({
        learningPathId: 'lp-created',
        mailTemplateId: 'mail-tpl-1',
        locationX: 90,
        locationY: 180,
      });
    });

    it("permet d'ajouter une évaluation après avoir configuré l'email en mode création", async () => {
      const createMutateAsync = jest.fn().mockResolvedValue({ data: { id: 'lp-created' } });
      const assignMailTemplateMutateAsync = jest.fn().mockResolvedValue(undefined);
      const createEvaluationMutateAsync = jest.fn().mockResolvedValue({ id: 'eval-new' });
      mockDefaults({
        createMutateAsync,
        assignMailTemplateMutateAsync,
        createEvaluationMutateAsync,
      });

      let capturedOnMailTemplateAssign:
        | ((mailTemplateId: string, position: { x: number; y: number }) => Promise<void>)
        | undefined;
      let capturedOnEvalCreate: ((data: CreateEvaluationPayload) => Promise<string>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnMailTemplateAssign = props.onMailTemplateAssign;
        capturedOnEvalCreate = props.onEvalCreate;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      // Configurer l'email en premier (crée le LP automatiquement)
      await act(async () => {
        await capturedOnMailTemplateAssign?.('mail-tpl-1', { x: 200, y: 110 });
      });

      // Ajouter une évaluation (le LP existe maintenant via lazyLpId)
      let returnedId: string | undefined;
      await act(async () => {
        returnedId = await capturedOnEvalCreate?.(EVAL_PAYLOAD);
      });

      expect(createEvaluationMutateAsync).toHaveBeenCalledWith({
        learningPathId: 'lp-created',
        ...EVAL_PAYLOAD,
      });
      expect(returnedId).toBe('eval-new');
    });
  });

  // ── Assignation du certificat ──────────────────────────────────────────────

  describe('assignation du certificat', () => {
    it("assigne le certificat via l'API en mode édition", async () => {
      const assignCertificateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ assignCertificateMutateAsync });

      let capturedOnCertificateAssign:
        | ((certificateId: string, position: { x: number; y: number }) => Promise<void>)
        | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnCertificateAssign = props.onCertificateAssign;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      await act(async () => {
        await capturedOnCertificateAssign?.('cert-1', { x: 310, y: 95 });
      });

      expect(assignCertificateMutateAsync).toHaveBeenCalledWith({
        learningPathId: MOCK_PATH_1.id,
        certificateId: 'cert-1',
        locationX: 310,
        locationY: 95,
      });
    });

    it("détache le certificat via l'API en mode édition", async () => {
      const detachCertificateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ detachCertificateMutateAsync });

      let capturedOnCertificateDetach: (() => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnCertificateDetach = props.onCertificateDetach;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      await act(async () => {
        await capturedOnCertificateDetach?.();
      });

      expect(detachCertificateMutateAsync).toHaveBeenCalledWith({
        learningPathId: MOCK_PATH_1.id,
      });
    });

    it("ne détache pas le certificat si le parcours n'a pas encore d'identifiant", async () => {
      const detachCertificateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ detachCertificateMutateAsync });

      let capturedOnCertificateDetach: (() => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnCertificateDetach = props.onCertificateDetach;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création (aucun ID de parcours)
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      await act(async () => {
        await capturedOnCertificateDetach?.();
      });

      expect(detachCertificateMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ── Gestion des évaluations (suite) ───────────────────────────────────────

  describe('suppression des évaluations dans le flow', () => {
    it("supprime l'évaluation via l'API immédiatement lors du retrait dans le flow (mode édition)", async () => {
      const deleteEvaluationMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ deleteEvaluationMutateAsync });

      let capturedOnEvalDelete: ((evaluationId: string) => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnEvalDelete = props.onEvalDelete;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode édition
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      await act(async () => {
        await capturedOnEvalDelete?.('eval-1');
      });

      expect(deleteEvaluationMutateAsync).toHaveBeenCalledWith({
        evaluationId: 'eval-1',
        learningPathId: MOCK_PATH_1.id,
      });
    });

    it("ne supprime pas l'évaluation si le parcours n'a pas encore d'identifiant", async () => {
      const deleteEvaluationMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ deleteEvaluationMutateAsync });

      let capturedOnEvalDelete: ((evaluationId: string) => Promise<void>) | undefined;
      MockProgramFlow.mockImplementation((props: ProgramFlowProps) => {
        capturedOnEvalDelete = props.onEvalDelete;
        return null;
      });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir en mode création (aucun ID de parcours)
      await user.click(screen.getByRole('button', { name: /nouveau parcours/i }));

      await act(async () => {
        await capturedOnEvalDelete?.('eval-1');
      });

      // Sans ID de parcours, l'API ne doit pas être appelée
      expect(deleteEvaluationMutateAsync).not.toHaveBeenCalled();
    });
  });
});
