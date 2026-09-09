/**
 * Tests fonctionnels — SelectEmailTemplateDialog
 *
 * Vérifie les parcours utilisateur :
 * - Sélection d'un modèle d'email existant dans la liste
 * - Création d'un nouveau modèle directement depuis la modale (sans en sortir), utilisé
 *   immédiatement une fois créé (la modale de sélection se masque pendant la création)
 * - Annulation de la création (retour à la liste sans effet de bord)
 * - Affichage des erreurs de validation lors de la création
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

// ─── Mock RichTextEditor (TipTap) ──────────────────────────────────────────────

jest.mock('@modules/shared/components/tiptap/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock('@modules/shared/components/tiptap/ImageInsertDialog', () => ({
  ImageInsertDialog: () => null,
}));

// ─── Mock hooks ─────────────────────────────────────────────────────────────────

const mockUseMailTemplatesQuery = jest.fn();
jest.mock('@/modules/admin/resources/mail-templates/hooks/useMailTemplatesQuery', () => ({
  useMailTemplatesQuery: (...args: unknown[]) => mockUseMailTemplatesQuery(...args),
}));

const mockCreate = jest.fn();
// Référence stable (comme le vrai `useMutation`) pour éviter de redéclencher
// les effets qui dépendent de `createMutation.reset` à chaque rendu.
const mockCreateReset = jest.fn();
jest.mock('@/modules/admin/resources/mail-templates/hooks/useCreateMailTemplate', () => ({
  useCreateMailTemplate: () => ({
    mutate: mockCreate,
    isPending: false,
    isError: false,
    error: null,
    reset: mockCreateReset,
  }),
}));

jest.mock('@/modules/admin/resources/mail-templates/hooks/useUpdateMailTemplate', () => ({
  useUpdateMailTemplate: () => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  }),
}));

jest.mock('@/modules/admin/resources/mail-templates/hooks/useUploadMailTemplateMedia', () => ({
  useUploadMailTemplateMedia: () => ({
    mutateAsync: jest.fn(),
  }),
}));

// ─── Imports ────────────────────────────────────────────────────────────────────

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectEmailTemplateDialog } from '../SelectEmailTemplateDialog';

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const MOCK_TEMPLATE_1 = {
  id: 'tpl-1',
  reference: 'REF-1',
  name: 'Bienvenue',
  subject: 'Bienvenue sur la plateforme',
  isActive: true,
  body: '<p>Bienvenue</p>',
  tenantId: 't1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const MOCK_TEMPLATE_2 = {
  ...MOCK_TEMPLATE_1,
  id: 'tpl-2',
  name: 'Relance',
  subject: 'Vous avez été inscrit',
};

// Réponse brute (snake_case) telle que renvoyée par l'API après création
const NEW_TEMPLATE_RAW = {
  id: 'tpl-new',
  reference: 'REF-NEW',
  name: 'Nouveau modèle',
  subject: 'Sujet du nouveau modèle',
  status: true,
  body: 'Contenu du nouveau modèle',
  tenant_id: 't1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ─── Helper ─────────────────────────────────────────────────────────────────────

function renderDialog({
  onSelect = jest.fn().mockResolvedValue(undefined),
  onOpenChange = jest.fn(),
  initialTemplateId,
}: {
  onSelect?: jest.Mock;
  onOpenChange?: jest.Mock;
  initialTemplateId?: string;
} = {}) {
  const utils = render(
    <SelectEmailTemplateDialog
      open={true}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      initialTemplateId={initialTemplateId}
    />,
  );
  return { onSelect, onOpenChange, ...utils };
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('SelectEmailTemplateDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMailTemplatesQuery.mockReturnValue({
      data: { data: [MOCK_TEMPLATE_1, MOCK_TEMPLATE_2], total: 2 },
      isLoading: false,
    });
  });

  // ── Sélection d'un modèle existant ─────────────────────────────────────────

  describe("sélection d'un modèle existant", () => {
    it('affiche les modèles disponibles', () => {
      renderDialog();

      expect(screen.getByText('Bienvenue')).toBeInTheDocument();
      expect(screen.getByText('Relance')).toBeInTheDocument();
    });

    it('confirme la sélection d’un modèle existant', async () => {
      const user = userEvent.setup();
      const { onSelect } = renderDialog();

      await user.click(screen.getByText('Relance'));
      await user.click(screen.getByRole('button', { name: /choisir ce modèle/i }));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith({
          id: 'tpl-2',
          name: 'Relance',
          subject: 'Vous avez été inscrit',
        });
      });
    });
  });

  // ── Restauration de la sélection initiale (initialTemplateId) ──────────────

  describe('restauration de la sélection initiale', () => {
    it('restaure le modèle initial à chaque réouverture, même après une annulation', async () => {
      const user = userEvent.setup();
      const { rerender, onOpenChange } = renderDialog({ initialTemplateId: 'tpl-2' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /choisir ce modèle/i })).toBeEnabled();
      });

      // Annuler réinitialise la sélection locale et notifie la fermeture
      await user.click(screen.getByRole('button', { name: /annuler/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Le parent ferme puis rouvre la modale (même nœud, mêmes données en cache)
      rerender(
        <SelectEmailTemplateDialog
          open={false}
          onOpenChange={onOpenChange}
          onSelect={jest.fn().mockResolvedValue(undefined)}
          initialTemplateId="tpl-2"
        />,
      );
      rerender(
        <SelectEmailTemplateDialog
          open={true}
          onOpenChange={onOpenChange}
          onSelect={jest.fn().mockResolvedValue(undefined)}
          initialTemplateId="tpl-2"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /choisir ce modèle/i })).toBeEnabled();
      });
    });
  });

  // ── Création d'un nouveau modèle depuis la modale ──────────────────────────

  describe("création d'un nouveau modèle", () => {
    it('masque la modale de sélection et affiche le formulaire de création au clic sur « Nouveau »', async () => {
      const user = userEvent.setup();
      renderDialog();

      expect(
        screen.getByRole('dialog', { name: /modèle d'email de démarrage/i }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /nouveau/i }));

      // Le nouveau modèle sera utilisé directement : pas besoin de revoir la liste en arrière-plan.
      expect(
        screen.queryByRole('dialog', { name: /modèle d'email de démarrage/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Sujet' })).toBeInTheDocument();
    });

    it('revient à la liste sans créer de modèle en cliquant sur Annuler', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('button', { name: /nouveau/i }));
      // Le drawer partagé s'ouvre au-dessus de la modale de sélection : on scope
      // la recherche du bouton « Annuler » pour éviter l'ambiguïté avec celui de la modale.
      const createDialog = await screen.findByRole('dialog', { name: /ajouter un template mail/i });
      await user.click(within(createDialog).getByRole('button', { name: /annuler/i }));

      expect(mockCreate).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('dialog', { name: /ajouter un template mail/i }),
      ).not.toBeInTheDocument();
      // Retour à la modale de sélection, toujours affichée en arrière-plan
      expect(
        screen.getByRole('dialog', { name: /modèle d'email de démarrage/i }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/rechercher un modèle/i)).toBeInTheDocument();
    });

    it('affiche des erreurs de validation si les champs requis sont vides', async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByRole('button', { name: /nouveau/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText('Nom requis')).toBeInTheDocument();
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('crée un nouveau modèle et l’utilise directement, sans repasser par la liste', async () => {
      const user = userEvent.setup();
      mockCreate.mockImplementation(
        (_payload: unknown, options?: { onSuccess?: (r: unknown) => void }) => {
          options?.onSuccess?.({ data: NEW_TEMPLATE_RAW });
        },
      );
      const { onSelect, onOpenChange } = renderDialog();

      await user.click(screen.getByRole('button', { name: /nouveau/i }));
      await user.type(screen.getByRole('textbox', { name: 'Nom' }), 'Nouveau modèle');
      await user.type(screen.getByRole('textbox', { name: 'Sujet' }), 'Sujet du nouveau modèle');
      await user.type(screen.getByTestId('rich-text-editor'), 'Contenu du nouveau modèle');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Nouveau modèle',
            subject: 'Sujet du nouveau modèle',
            status: true,
            body: 'Contenu du nouveau modèle',
          }),
          expect.any(Object),
        );
      });

      // Utilisé directement : pas de retour à la liste ni de clic de confirmation supplémentaire
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith({
          id: 'tpl-new',
          name: 'Nouveau modèle',
          subject: 'Sujet du nouveau modèle',
        });
      });
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
