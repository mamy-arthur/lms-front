/**
 * Tests fonctionnels — AdminModuleFormDrawer
 *
 * On teste depuis la perspective utilisateur :
 *  - validation du formulaire (zod + react-hook-form)
 *  - soumission en mode création et édition
 *  - pré-remplissage des champs en mode édition
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

// ─── Mock DnD ────────────────────────────────────────────────────────────────
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
  arrayMove: jest.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    result.splice(to, 0, result.splice(from, 1)[0]);
    return result;
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }));

// ─── Mock RichTextEditor ──────────────────────────────────────────────────────
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

// ─── Mock hooks ───────────────────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/modules/admin/resources/modules/hooks/useCreateModule', () => ({
  useCreateModule: () => ({
    mutate: mockCreate,
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  }),
}));
jest.mock('@/modules/admin/resources/modules/hooks/useUpdateModule', () => ({
  useUpdateModule: () => ({
    mutate: mockUpdate,
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  }),
}));
jest.mock('@/modules/admin/resources/modules/hooks/useModule', () => ({
  useModule: () => ({ data: undefined }),
}));

const mockUseAvailableCoursesQuery = jest.fn();
jest.mock('@/modules/admin/resources/modules/hooks/useAvailableCoursesQuery', () => ({
  useAvailableCoursesQuery: (...args: unknown[]) => mockUseAvailableCoursesQuery(...args),
}));

jest.mock('@/modules/shared/components/courses/hooks/useCategoryData', () => ({
  useCategoryData: () => ({ categoriesQuery: { data: [] } }),
}));
jest.mock(
  '@/modules/admin/resources/modules/components/categories/CompetencyCategoryModal',
  () => ({
    CompetencyCategoryModal: () => null,
  }),
);
jest.mock(
  '@/modules/admin/resources/modules/components/categories/CompetencyCategorySelect',
  () => ({
    CompetencyCategorySelect: ({
      value,
      onChange,
    }: {
      value?: string;
      onChange?: (v: string) => void;
    }) => {
      React.useEffect(() => {
        if (!value) onChange?.('formation');
      }, []);

      return <div data-testid="category-select" data-value={value ?? ''} />;
    },
  }),
);

// ─── Imports ──────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminModuleFormDrawer } from '../AdminModuleFormDrawer';
import type { Module } from '../../../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_MODULE: Module = {
  id: 'mod-001',
  shortname: 'Développement Web',
  idnumber: 'DW-001',
  description: '<p>Description existante</p>',
  category_id: 'formation',
  category_name: null,
  tenantId: '1',
  courseIds: [],
  coursesCount: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const MOCK_AVAILABLE_COURSES = [
  {
    id: 'course-1',
    fullName: 'Développement React',
    categoryId: 'cat-1',
    categoryName: 'Dev',
    status: 'AVAILABLE' as const,
  },
  {
    id: 'course-2',
    fullName: 'Node.js Avancé',
    categoryId: 'cat-1',
    categoryName: 'Dev',
    status: 'AVAILABLE' as const,
  },
  {
    id: 'course-3',
    fullName: 'DevOps CI/CD',
    categoryId: 'cat-2',
    categoryName: 'Ops',
    status: 'ALREADY_LINKED' as const,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
interface RenderOptions {
  module?: Module;
  onClose?: jest.Mock;
  onSuccess?: jest.Mock;
}

function renderDrawer({ module, onClose = jest.fn(), onSuccess = jest.fn() }: RenderOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminModuleFormDrawer open={true} onClose={onClose} onSuccess={onSuccess} module={module} />
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AdminModuleFormDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAvailableCoursesQuery.mockReturnValue({ data: [], isLoading: false });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('affiche une erreur si le nom est vide à la soumission', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText(/nom requis/i)).toBeInTheDocument();
      });
    });

    it("affiche une erreur si l'identifiant est vide à la soumission", async () => {
      const user = userEvent.setup();
      renderDrawer();

      const shortnameInput = screen.getByRole('textbox', { name: /nom/i });
      await user.type(shortnameInput, 'Mon module');

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText(/identifiant requis/i)).toBeInTheDocument();
      });
    });

    it("n'affiche pas d'erreur quand les champs obligatoires sont remplis", async () => {
      const user = userEvent.setup();
      renderDrawer();
      mockCreate.mockImplementation(() => {});

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Mon module');
      await user.type(screen.getByRole('textbox', { name: /identifiant/i }), 'MOD-001');

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.queryByText(/requis/i)).not.toBeInTheDocument();
      });
    });
  });

  // ── Mode création ──────────────────────────────────────────────────────────

  describe('création', () => {
    it('affiche le titre "Ajouter un module"', () => {
      renderDrawer();
      expect(screen.getByText('Ajouter un module')).toBeInTheDocument();
    });

    it('appelle createMutation avec le bon payload', async () => {
      const user = userEvent.setup();
      renderDrawer();
      mockCreate.mockImplementation(() => {});

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Dev Web');
      await user.type(screen.getByRole('textbox', { name: /identifiant/i }), 'DW-001');

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({ shortname: 'Dev Web', idnumber: 'DW-001' }),
          expect.any(Object),
        );
      });
    });

    it("n'appelle pas updateMutation en mode création", async () => {
      const user = userEvent.setup();
      renderDrawer();
      mockCreate.mockImplementation(() => {});

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Dev Web');
      await user.type(screen.getByRole('textbox', { name: /identifiant/i }), 'DW-001');

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => expect(mockCreate).toHaveBeenCalled());
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── Mode édition ───────────────────────────────────────────────────────────

  describe('édition', () => {
    it('affiche le titre "Modifier le module"', () => {
      renderDrawer({ module: MOCK_MODULE });
      expect(screen.getByText('Modifier le module')).toBeInTheDocument();
    });

    it('pré-remplit le nom avec la valeur existante', () => {
      renderDrawer({ module: MOCK_MODULE });
      expect(screen.getByDisplayValue('Développement Web')).toBeInTheDocument();
    });

    it("pré-remplit l'identifiant avec la valeur existante", () => {
      renderDrawer({ module: MOCK_MODULE });
      expect(screen.getByDisplayValue('DW-001')).toBeInTheDocument();
    });

    it('appelle updateMutation avec le bon payload', async () => {
      const user = userEvent.setup();
      renderDrawer({ module: MOCK_MODULE });
      mockUpdate.mockImplementation(() => {});

      const shortnameInput = screen.getByDisplayValue('Développement Web');
      await user.clear(shortnameInput);
      await user.type(shortnameInput, 'Dev Web Avancé');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: MOCK_MODULE.id,
            data: expect.objectContaining({ shortname: 'Dev Web Avancé' }),
          }),
          expect.any(Object),
        );
      });
    });

    it("n'appelle pas createMutation en mode édition", async () => {
      const user = userEvent.setup();
      renderDrawer({ module: MOCK_MODULE });
      mockUpdate.mockImplementation(() => {});

      const shortnameInput = screen.getByDisplayValue('Développement Web');
      await user.clear(shortnameInput);
      await user.type(shortnameInput, 'Dev Web Avancé');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── Bouton Annuler ─────────────────────────────────────────────────────────

  describe('bouton Annuler', () => {
    it('appelle onClose sans déclencher les mutations', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderDrawer({ onClose });

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(onClose).toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── Auto-identifiant ───────────────────────────────────────────────────────

  describe('bouton Auto (identifiant)', () => {
    it('génère un identifiant à partir du nom saisi', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Dev Web');
      await user.click(screen.getByRole('button', { name: /auto/i }));

      await waitFor(() => {
        const idInput = screen.getByRole('textbox', { name: /identifiant/i }) as HTMLInputElement;
        expect(idInput.value).toMatch(/^DEV-WEB-\d{3}$/);
      });
    });
  });

  // ── Sélection de cours via la modale ───────────────────────────────────────

  describe('sélection de cours via la modale', () => {
    beforeEach(() => {
      mockUseAvailableCoursesQuery.mockReturnValue({
        data: MOCK_AVAILABLE_COURSES,
        isLoading: false,
      });
    });

    /** Opens the SelectCoursesDialog and returns it (scoped away from the Sheet). */
    async function openCourseDialog(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /ajouter un cours/i }));
      return screen.findByRole('dialog', { name: /ajouter des cours/i });
    }

    it('ouvre le dialog au clic sur "Ajouter un cours"', async () => {
      const user = userEvent.setup();
      renderDrawer();

      await openCourseDialog(user);

      expect(screen.getByRole('dialog', { name: /ajouter des cours/i })).toBeInTheDocument();
    });

    it('affiche tous les cours disponibles dans le dialog', async () => {
      const user = userEvent.setup();
      renderDrawer();

      const dialog = await openCourseDialog(user);
      expect(within(dialog).getByText('Développement React')).toBeInTheDocument();
      expect(within(dialog).getByText('Node.js Avancé')).toBeInTheDocument();
      expect(within(dialog).getByText('DevOps CI/CD')).toBeInTheDocument();
    });

    it('sélectionne un cours et met à jour courseIds à la confirmation', async () => {
      const user = userEvent.setup();
      renderDrawer();

      const dialog = await openCourseDialog(user);
      await user.click(within(dialog).getByRole('button', { name: /développement react/i }));
      await user.click(within(dialog).getByRole('button', { name: /ajouter 1 cours/i }));

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: /ajouter des cours/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Développement React')).toBeInTheDocument();
      });
    });

    it('les cours ALREADY_LINKED sont affichés mais désactivés', async () => {
      const user = userEvent.setup();
      renderDrawer();

      const dialog = await openCourseDialog(user);
      const linkedBtn = within(dialog).getByRole('button', { name: /devops ci\/cd/i });
      expect(linkedBtn).toBeDisabled();
      expect(within(dialog).getByText('Déjà lié')).toBeInTheDocument();
    });

    it('les cours déjà liés au module sont affichés mais désactivés', async () => {
      const user = userEvent.setup();
      renderDrawer({ module: { ...MOCK_MODULE, courseIds: ['course-1'] } });

      const dialog = await openCourseDialog(user);
      const alreadyAddedBtn = within(dialog).getByRole('button', { name: /développement react/i });
      expect(alreadyAddedBtn).toBeDisabled();
      expect(within(dialog).getByText('Déjà ajouté')).toBeInTheDocument();
    });

    it('ferme le dialog sans mettre à jour courseIds au clic sur Annuler', async () => {
      const user = userEvent.setup();
      renderDrawer();

      const dialog = await openCourseDialog(user);
      await user.click(within(dialog).getByRole('button', { name: /développement react/i }));
      await user.click(within(dialog).getByRole('button', { name: /annuler/i }));

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: /ajouter des cours/i }),
        ).not.toBeInTheDocument();
      });
      expect(screen.queryByText('Développement React')).not.toBeInTheDocument();
    });

    it('réinitialise la sélection à la réouverture après annulation', async () => {
      const user = userEvent.setup();
      renderDrawer();

      // First open: select a course then cancel
      let dialog = await openCourseDialog(user);
      await user.click(within(dialog).getByRole('button', { name: /développement react/i }));
      await user.click(within(dialog).getByRole('button', { name: /annuler/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /ajouter des cours/i }),
        ).not.toBeInTheDocument(),
      );

      // Second open: pending selection must be gone — confirm button still disabled
      dialog = await openCourseDialog(user);
      expect(within(dialog).getByRole('button', { name: /ajouter des cours/i })).toBeDisabled();
    });
  });
});
