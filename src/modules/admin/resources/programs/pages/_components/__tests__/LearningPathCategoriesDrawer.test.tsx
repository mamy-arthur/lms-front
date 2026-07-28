/**
 * Tests fonctionnels — Gestion des catégories de parcours (LearningPathCategoriesDrawer)
 *
 * Vérifie les scénarios CRUD du point de vue utilisateur :
 * - Consultation de la liste des catégories
 * - Création d'une catégorie
 * - Modification d'une catégorie
 * - Suppression d'une catégorie
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

jest.mock('@/modules/admin/resources/programs/hooks/useCreateLearningPathCategory', () => ({
  useCreateLearningPathCategory: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useUpdateLearningPathCategory', () => ({
  useUpdateLearningPathCategory: jest.fn(),
}));
jest.mock('@/modules/admin/resources/programs/hooks/useDeleteLearningPathCategory', () => ({
  useDeleteLearningPathCategory: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { useCreateLearningPathCategory } from '@/modules/admin/resources/programs/hooks/useCreateLearningPathCategory';
import { useUpdateLearningPathCategory } from '@/modules/admin/resources/programs/hooks/useUpdateLearningPathCategory';
import { useDeleteLearningPathCategory } from '@/modules/admin/resources/programs/hooks/useDeleteLearningPathCategory';
import { LearningPathCategoriesDrawer } from '../learning-path-categories-drawer';
import type { LearningPathCategory } from '../../../types';

const mockUseCreate = jest.mocked(useCreateLearningPathCategory);
const mockUseUpdate = jest.mocked(useUpdateLearningPathCategory);
const mockUseDelete = jest.mocked(useDeleteLearningPathCategory);
const mockToast = jest.mocked(toast);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CAT_1: LearningPathCategory = {
  id: 'cat-1',
  tenantId: 'tenant-1',
  name: 'Management',
  description: 'Formations en management',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_CAT_2: LearningPathCategory = {
  ...MOCK_CAT_1,
  id: 'cat-2',
  name: 'Data Science',
  description: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDefaults({
  createMutateAsync = jest.fn().mockResolvedValue(undefined),
  updateMutateAsync = jest.fn().mockResolvedValue(undefined),
  deleteMutateAsync = jest.fn().mockResolvedValue(undefined),
}: {
  createMutateAsync?: jest.Mock;
  updateMutateAsync?: jest.Mock;
  deleteMutateAsync?: jest.Mock;
} = {}) {
  mockUseCreate.mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateLearningPathCategory>);

  mockUseUpdate.mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateLearningPathCategory>);

  mockUseDelete.mockReturnValue({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteLearningPathCategory>);
}

function renderDrawer(
  categories: LearningPathCategory[] = [MOCK_CAT_1, MOCK_CAT_2],
  isLoading = false,
) {
  return render(
    <LearningPathCategoriesDrawer
      open={true}
      onOpenChange={jest.fn()}
      categories={categories}
      isLoading={isLoading}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LearningPathCategoriesDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaults();
  });

  // ── Liste des catégories ───────────────────────────────────────────────────

  describe('liste des catégories', () => {
    it('affiche les catégories transmises en props', () => {
      renderDrawer();

      expect(screen.getByText('Management')).toBeInTheDocument();
      expect(screen.getByText('Data Science')).toBeInTheDocument();
    });

    it('affiche un message vide si aucune catégorie', () => {
      renderDrawer([]);

      expect(screen.getByText('Aucune catégorie créée.')).toBeInTheDocument();
    });

    it('affiche un indicateur de chargement', () => {
      renderDrawer([], true);

      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });
  });

  // ── Création ──────────────────────────────────────────────────────────────

  describe("création d'une catégorie", () => {
    it('ouvre le dialog au clic sur « Ajouter »', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('soumet le formulaire avec le nom saisi', async () => {
      const createMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ createMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nouvelle catégorie');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(createMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Nouvelle catégorie' }),
        );
      });
    });

    it('affiche un toast de succès après la création', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Catégorie test');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Catégorie créée');
      });
    });

    it("affiche un toast d'erreur si l'API échoue lors de la création", async () => {
      const createMutateAsync = jest.fn().mockRejectedValue(new Error('Server error'));
      mockDefaults({ createMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Catégorie erreur');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  // ── Modification ──────────────────────────────────────────────────────────

  describe("modification d'une catégorie", () => {
    it('ouvre le dialog avec les données existantes', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      expect(nameInput).toHaveValue(MOCK_CAT_1.name);
    });

    it('envoie la mise à jour avec les nouvelles valeurs', async () => {
      const updateMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ updateMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Management modifié');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(updateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ id: MOCK_CAT_1.id, name: 'Management modifié' }),
        );
      });
    });

    it('affiche un toast de succès après la modification', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Management modifié');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Catégorie mise à jour');
      });
    });

    it("affiche un toast d'erreur si l'API échoue lors de la modification", async () => {
      const updateMutateAsync = jest.fn().mockRejectedValue(new Error('Server error'));
      mockDefaults({ updateMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /modifier/i }));

      const nameInput = screen.getByLabelText(/nom/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Nom modifié');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  // ── Suppression ───────────────────────────────────────────────────────────

  describe("suppression d'une catégorie", () => {
    it('appelle la mutation de suppression avec le bon identifiant', async () => {
      const deleteMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockDefaults({ deleteMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(deleteMutateAsync).toHaveBeenCalledWith(MOCK_CAT_1.id);
      });
    });

    it('affiche un toast de succès après la suppression', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Catégorie supprimée');
      });
    });

    it("affiche un toast d'erreur si la catégorie est liée à des parcours", async () => {
      const deleteMutateAsync = jest.fn().mockRejectedValue(new Error('has_paths'));
      mockDefaults({ deleteMutateAsync });

      const user = userEvent.setup();
      renderDrawer();

      await user.click(screen.getByRole('button', { name: `Actions pour ${MOCK_CAT_1.name}` }));
      await user.click(screen.getByRole('menuitem', { name: /supprimer/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('has_paths');
      });
    });
  });
});
