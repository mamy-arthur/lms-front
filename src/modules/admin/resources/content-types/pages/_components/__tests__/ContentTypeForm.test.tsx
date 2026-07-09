/**
 * Tests fonctionnels — ContentTypeForm
 *
 * On teste depuis la perspective utilisateur :
 *  - le rendu et la sélection du module (cards)
 *  - la validation du formulaire (zod + react-hook-form)
 *  - la soumission en mode création et édition
 *  - les retours API (toast succès / erreur, fermeture du Sheet)
 *  - l'ajout de champs dans le SchemaBuilder
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

// ─── Mock DnD (SchemaBuilder + FieldCard) ────────────────────────────────────

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCenter: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// ─── Mock mutations et toast ──────────────────────────────────────────────────

const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/modules/admin/resources/content-types/hooks/useCreateContentType', () => ({
  useCreateContentType: () => ({ mutate: mockCreate, isPending: false }),
}));

jest.mock('@/modules/admin/resources/content-types/hooks/useUpdateContentType', () => ({
  useUpdateContentType: () => ({ mutate: mockUpdate, isPending: false }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ContentTypeForm } from '../content-type-form';
import { ContentType } from '../../../types';

const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CONTENT_TYPE: ContentType = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: 'Description existante',
  fields: [
    {
      id: 'f-1',
      type: 'text',
      name: 'titre',
      label: 'Titre',
      required: true,
      is_archived: false,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RenderFormOptions {
  contentType?: ContentType;
  usedModuleTypes?: string[];
  onOpenChange?: jest.Mock;
}

function renderForm({
  contentType,
  usedModuleTypes = [],
  onOpenChange = jest.fn(),
}: RenderFormOptions = {}) {
  const result = render(
    <TooltipProvider>
      <ContentTypeForm
        open={true}
        onOpenChange={onOpenChange}
        contentType={contentType}
        usedModuleTypes={usedModuleTypes as import('../../../types').ModuleType[]}
      />
    </TooltipProvider>,
  );
  return { ...result, onOpenChange };
}

/**
 * Soumet le formulaire après avoir rempli les champs obligatoires.
 * Le module_type 'page' est pré-sélectionné par défaut.
 */
async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, title = 'Mon Content Type') {
  const titleInput = screen.getByPlaceholderText(/fiche pédagogique/i);
  await user.clear(titleInput);
  await user.type(titleInput, title);
  await user.click(screen.getByRole('button', { name: /créer le type de contenu/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContentTypeForm', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Validation du formulaire ───────────────────────────────────────────────

  describe('validation', () => {
    it('affiche une erreur si le titre est vide à la soumission', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: /créer le type de contenu/i }));

      await waitFor(() => {
        expect(screen.getByText(/titre requis/i)).toBeInTheDocument();
      });
    });

    it("n'affiche pas d'erreur quand le titre est rempli", async () => {
      const user = userEvent.setup();
      renderForm();
      mockCreate.mockImplementation(() => {}); // ne pas déclencher onSuccess

      await fillAndSubmit(user, 'Mon Content Type');

      expect(screen.queryByText(/titre requis/i)).not.toBeInTheDocument();
    });
  });

  // ── Soumission en mode création ────────────────────────────────────────────

  describe('création', () => {
    it('appelle createMutation avec le bon payload', async () => {
      const user = userEvent.setup();
      renderForm();
      mockCreate.mockImplementation(() => {});

      await fillAndSubmit(user, 'Ma fiche');

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          module_type: 'page',
          title: 'Ma fiche',
        }),
        expect.any(Object),
      );
    });

    it('inclut la description dans le payload', async () => {
      const user = userEvent.setup();
      renderForm();
      mockCreate.mockImplementation(() => {});

      const titleInput = screen.getByPlaceholderText(/fiche pédagogique/i);
      await user.type(titleInput, 'Ma fiche');
      const descInput = screen.getByPlaceholderText(/description optionnelle/i);
      await user.type(descInput, 'Une belle description');
      await user.click(screen.getByRole('button', { name: /créer le type de contenu/i }));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Une belle description' }),
        expect.any(Object),
      );
    });

    it('affiche toast.success et ferme le formulaire après la création', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderForm();

      // Simule un onSuccess synchrone
      mockCreate.mockImplementation((_vars: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });

      await fillAndSubmit(user, 'Ma fiche');

      expect(mockToastSuccess).toHaveBeenCalledWith('Content Type créé');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('affiche toast.error quand la mutation échoue', async () => {
      const user = userEvent.setup();
      renderForm();

      mockCreate.mockImplementation((_vars: unknown, options: { onError?: () => void }) => {
        options?.onError?.();
      });

      await fillAndSubmit(user, 'Ma fiche');

      expect(mockToastError).toHaveBeenCalledWith('Erreur lors de la création');
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it("n'appelle pas updateMutation en mode création", async () => {
      const user = userEvent.setup();
      renderForm();
      mockCreate.mockImplementation(() => {});

      await fillAndSubmit(user);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── Soumission en mode édition ─────────────────────────────────────────────

  describe('édition', () => {
    it('pré-remplit le titre avec la valeur existante', () => {
      renderForm({ contentType: MOCK_CONTENT_TYPE });
      const titleInput = screen.getByDisplayValue('Fiche pédagogique');
      expect(titleInput).toBeInTheDocument();
    });

    it('pré-remplit la description avec la valeur existante', () => {
      renderForm({ contentType: MOCK_CONTENT_TYPE });
      expect(screen.getByDisplayValue('Description existante')).toBeInTheDocument();
    });

    it("appelle updateMutation avec l'id et le payload", async () => {
      const user = userEvent.setup();
      renderForm({ contentType: MOCK_CONTENT_TYPE });
      mockUpdate.mockImplementation(() => {});

      const titleInput = screen.getByDisplayValue('Fiche pédagogique');
      await user.clear(titleInput);
      await user.type(titleInput, 'Nouveau titre');
      await user.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ct-1',
          payload: expect.objectContaining({ title: 'Nouveau titre' }),
        }),
        expect.any(Object),
      );
    });

    it('affiche toast.success et ferme le formulaire après la mise à jour', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderForm({ contentType: MOCK_CONTENT_TYPE });

      mockUpdate.mockImplementation((_vars: unknown, options: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      });

      const titleInput = screen.getByDisplayValue('Fiche pédagogique');
      await user.clear(titleInput);
      await user.type(titleInput, 'Titre modifié');
      await user.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

      expect(mockToastSuccess).toHaveBeenCalledWith('Content Type mis à jour');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('affiche toast.error si la mise à jour échoue', async () => {
      const user = userEvent.setup();
      renderForm({ contentType: MOCK_CONTENT_TYPE });

      mockUpdate.mockImplementation((_vars: unknown, options: { onError?: () => void }) => {
        options?.onError?.();
      });

      const titleInput = screen.getByDisplayValue('Fiche pédagogique');
      await user.clear(titleInput);
      await user.type(titleInput, 'Titre modifié');
      await user.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

      expect(mockToastError).toHaveBeenCalledWith('Erreur lors de la mise à jour');
    });

    it("n'appelle pas createMutation en mode édition", async () => {
      const user = userEvent.setup();
      renderForm({ contentType: MOCK_CONTENT_TYPE });
      mockUpdate.mockImplementation(() => {});

      const titleInput = screen.getByDisplayValue('Fiche pédagogique');
      await user.clear(titleInput);
      await user.type(titleInput, 'Titre modifié');
      await user.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── Actions secondaires ────────────────────────────────────────────────────

  describe('bouton Annuler', () => {
    it('ferme le formulaire sans appeler les mutations', async () => {
      const user = userEvent.setup();
      const { onOpenChange } = renderForm();

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── SchemaBuilder : champs dans le payload ────────────────────────────────

  describe('ajout de champs', () => {
    it('inclut les champs dans le payload de création', async () => {
      const user = userEvent.setup();
      renderForm();
      mockCreate.mockImplementation(() => {});

      // Ajoute un champ (2 boutons existent dans l'état vide, on prend le premier)
      await user.click(screen.getAllByRole('button', { name: /ajouter un champ/i })[0]);

      // Développe la card du champ
      await user.click(screen.getByRole('button', { name: /développer le champ/i }));

      // Remplit nom et label du champ
      const nameInput = screen.getByPlaceholderText('mon_champ');
      await user.type(nameInput, 'mon_titre');
      const labelInput = screen.getByPlaceholderText('Mon champ');
      await user.type(labelInput, 'Mon Titre');

      // Soumet le formulaire
      const titleInput = screen.getByPlaceholderText(/fiche pédagogique/i);
      await user.type(titleInput, 'Ma fiche');
      await user.click(screen.getByRole('button', { name: /créer le type de contenu/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            fields: expect.arrayContaining([
              expect.objectContaining({ name: 'mon_titre', label: 'Mon Titre' }),
            ]),
          }),
          expect.any(Object),
        );
      });
    });
  });
});
