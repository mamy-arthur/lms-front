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
let mockModuleDetail: Module | undefined;
jest.mock('@/modules/admin/resources/modules/hooks/useModule', () => ({
  useModule: () => ({ data: mockModuleDetail }),
}));

const mockUseCoursesInfinite = jest.fn();
jest.mock('@/modules/shared/components/courses/hooks/useCoursesInfinite', () => ({
  useCoursesInfinite: (...args: unknown[]) => mockUseCoursesInfinite(...args),
}));

jest.mock('@/shared/api/courses.api', () => ({
  coursesApi: { list: jest.fn(), update: jest.fn(), remove: jest.fn() },
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
import type { Module, ModuleCourse } from '../../../types';
import type { Course } from '@/modules/shared/components/courses/types';
import { coursesApi } from '@/shared/api/courses.api';
import type { ApiCourse } from '@/shared/types/course.types';

const mockListCourses = jest.mocked(coursesApi.list);

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

function makeCourse(
  id: string,
  fullName: string,
  categoryId: string,
  categoryName: string,
): Course {
  return {
    id,
    fullName,
    shortName: id,
    categoryId,
    categoryName,
    identifier: null,
    visible: true,
    visibility: 'PUBLISHED',
  };
}

const MOCK_CATALOG_COURSES: Course[] = [
  makeCourse('course-1', 'Développement React', 'cat-1', 'Dev'),
  makeCourse('course-2', 'Node.js Avancé', 'cat-1', 'Dev'),
  makeCourse('course-3', 'DevOps CI/CD', 'cat-2', 'Ops'),
];

const MOCK_LARGE_MODULE_COURSES: ApiCourse[] = Array.from({ length: 101 }, (_, index) => ({
  id: `course-${index + 1}`,
  tenant_id: '1',
  created_by: 'admin-1',
  full_name: `Leçon ${index + 1}`,
  short_name: `L-${index + 1}`,
  id_number: null,
  category_id: 'cat-1',
  visibility: 'PUBLISHED',
  description: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}));

const EMPTY_CATALOG = {
  data: { pages: [{ data: [], total: 0 }] },
  isLoading: false,
  isSuccess: true,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  isFetchingNextPage: false,
  isFetchNextPageError: false,
};

/** Mirrors what the competency detail endpoint now embeds for each linked course. */
function toModuleCourse(api: ApiCourse): ModuleCourse {
  return {
    id: api.id,
    fullName: api.full_name,
    categoryName: null,
  };
}

function moduleDetailWith(courses: ApiCourse[]): Module {
  return {
    ...MOCK_MODULE,
    courseIds: courses.map((course) => course.id),
    courses: courses.map(toModuleCourse),
    coursesCount: courses.length,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────
interface RenderOptions {
  module?: Module;
  onClose?: jest.Mock;
  onSuccess?: jest.Mock;
  queryClient?: QueryClient;
}

function renderDrawer({
  module,
  onClose = jest.fn(),
  onSuccess = jest.fn(),
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
}: RenderOptions = {}) {
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
    mockModuleDetail = undefined;
    mockUseCoursesInfinite.mockReturnValue(EMPTY_CATALOG);
    mockListCourses.mockReset().mockResolvedValue({ data: [] });
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

    it("n'affiche pas d'erreur quand les champs obligatoires sont remplis", async () => {
      const user = userEvent.setup();
      renderDrawer();
      mockCreate.mockImplementation(() => {});

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Mon module');

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

      await waitFor(() => {
        expect(screen.getByTestId('category-select')).toHaveAttribute('data-value', 'formation');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({ shortname: 'Dev Web' }),
          expect.any(Object),
        );
      });
    });

    it("n'appelle pas updateMutation en mode création", async () => {
      const user = userEvent.setup();
      renderDrawer();
      mockCreate.mockImplementation(() => {});

      await user.type(screen.getByRole('textbox', { name: /nom/i }), 'Dev Web');

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
    it('actualise les cours sélectionnés après un renommage puis une suppression sans fermer le drawer', async () => {
      const course = MOCK_LARGE_MODULE_COURSES[0];
      const renamedCourse = { ...course, full_name: 'Leçon renommée' };
      mockModuleDetail = moduleDetailWith([course]);
      const module = { ...MOCK_MODULE, courseIds: [course.id], coursesCount: 1 };
      const { rerender } = renderDrawer({ module });
      const remount = () =>
        rerender(
          <QueryClientProvider client={new QueryClient()}>
            <AdminModuleFormDrawer open onClose={jest.fn()} module={module} />
          </QueryClientProvider>,
        );

      expect(await screen.findByText(course.full_name)).toBeInTheDocument();

      mockModuleDetail = moduleDetailWith([renamedCourse]);
      remount();

      expect(await screen.findByText(renamedCourse.full_name)).toBeInTheDocument();
      expect(screen.queryByText(course.full_name)).not.toBeInTheDocument();

      mockModuleDetail = moduleDetailWith([]);
      remount();

      await waitFor(() => {
        expect(screen.queryByText(renamedCourse.full_name)).not.toBeInTheDocument();
      });
    });

    it('affiche les 101 cours du module dans le bon ordre sans requête de résolution', async () => {
      const user = userEvent.setup();
      const ordered = [...MOCK_LARGE_MODULE_COURSES].reverse();
      const courseIds = ordered.map((course) => course.id);
      mockModuleDetail = moduleDetailWith(ordered);
      renderDrawer({ module: { ...MOCK_MODULE, courseIds, coursesCount: courseIds.length } });

      await waitFor(() => {
        const displayedNames = screen.queryAllByText(/^Leçon \d+$/).map((node) => node.textContent);
        expect(displayedNames).toEqual(ordered.map((course) => course.full_name));
      });
      expect(mockListCourses).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: MOCK_MODULE.id,
            data: expect.objectContaining({ course_ids: courseIds }),
          }),
          expect.any(Object),
        );
      });
    });

    it('affiche le titre "Modifier le module"', () => {
      renderDrawer({ module: MOCK_MODULE });
      expect(screen.getByText('Modifier le module')).toBeInTheDocument();
    });

    it('pré-remplit le nom avec la valeur existante', () => {
      renderDrawer({ module: MOCK_MODULE });
      expect(screen.getByDisplayValue('Développement Web')).toBeInTheDocument();
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

  // ── Sélection de cours via la modale ───────────────────────────────────────

  describe('sélection de cours via la modale', () => {
    beforeEach(() => {
      mockUseCoursesInfinite.mockReturnValue({
        ...EMPTY_CATALOG,
        data: { pages: [{ data: MOCK_CATALOG_COURSES, total: MOCK_CATALOG_COURSES.length }] },
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

    it('un cours déjà lié à un autre module reste sélectionnable', async () => {
      const user = userEvent.setup();
      renderDrawer();

      const dialog = await openCourseDialog(user);
      const reusableBtn = within(dialog).getByRole('button', { name: /devops ci\/cd/i });
      expect(reusableBtn).toBeEnabled();
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
