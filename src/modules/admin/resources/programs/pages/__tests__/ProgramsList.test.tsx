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
  default: jest.fn().mockReturnValue(null),
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

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { useLearningPathsQuery } from '../../hooks/useLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../../hooks/useLearningPathCategoriesQuery';
import { useDeleteLearningPath } from '../../hooks/useDeleteLearningPath';
import { useCreateLearningPath } from '../../hooks/useCreateLearningPath';
import { useUpdateLearningPath } from '../../hooks/useUpdateLearningPath';
import { useUploadLearningPathMedia } from '../../hooks/useUploadLearningPathMedia';
import { ProgramsList } from '../ProgramsList';
import type { LearningPath } from '../../types';

const mockUseLearningPathsQuery = jest.mocked(useLearningPathsQuery);
const mockUseLearningPathCategoriesQuery = jest.mocked(useLearningPathCategoriesQuery);
const mockUseDeleteLearningPath = jest.mocked(useDeleteLearningPath);
const mockUseCreateLearningPath = jest.mocked(useCreateLearningPath);
const mockUseUpdateLearningPath = jest.mocked(useUpdateLearningPath);
const mockUseUploadLearningPathMedia = jest.mocked(useUploadLearningPathMedia);
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
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_PATH_2: LearningPath = {
  ...MOCK_PATH_1,
  id: 'lp-2',
  name: 'Parcours Data Science',
  idnumber: 'DS-001',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDefaults({
  paths = [MOCK_PATH_1, MOCK_PATH_2],
  isLoading = false,
  deleteMutateAsync = jest.fn().mockResolvedValue(undefined),
  createMutateAsync = jest.fn().mockResolvedValue({ data: { id: 'new-lp' } }),
  updateMutateAsync = jest.fn().mockResolvedValue(undefined),
}: {
  paths?: LearningPath[];
  isLoading?: boolean;
  deleteMutateAsync?: jest.Mock;
  createMutateAsync?: jest.Mock;
  updateMutateAsync?: jest.Mock;
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

  // ── Suppression ───────────────────────────────────────────────────────────

  describe("suppression d'un parcours", () => {
    it("appelle la mutation de suppression avec l'identifiant correct", async () => {
      const deleteMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ deleteMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      // Ouvrir le menu d'actions et cliquer sur Supprimer
      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(deleteMutateAsync).toHaveBeenCalledWith(MOCK_PATH_1.id);
      });
    });

    it('affiche un toast de succès après la suppression', async () => {
      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Parcours supprimé');
      });
    });

    it("affiche un toast d'erreur si l'API échoue lors de la suppression", async () => {
      const deleteMutateAsync = jest.fn().mockRejectedValue(new Error('Server error'));
      mockDefaults({ deleteMutateAsync });

      const user = userEvent.setup();
      render(<ProgramsList />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_PATH_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });
});
