jest.mock('@/shared/api/courses.api', () => ({
  coursesApi: { list: jest.fn() },
  courseCategoriesApi: { list: jest.fn() },
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { coursesApi, courseCategoriesApi } from '@/shared/api/courses.api';
import type { ApiCourse } from '@/shared/types/course.types';
import { SelectCoursesDialog } from '../SelectCoursesDialog';

const mockListCourses = jest.mocked(coursesApi.list);
const mockListCategories = jest.mocked(courseCategoriesApi.list);

const FIRST_COURSE: ApiCourse = {
  id: 'course-1',
  tenant_id: 'tenant-1',
  created_by: 'admin-1',
  full_name: 'Introduction au développement',
  short_name: 'INTRO',
  id_number: null,
  category_id: 'cat-1',
  visibility: 'PUBLISHED',
  description: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const SECOND_COURSE: ApiCourse = {
  ...FIRST_COURSE,
  id: 'course-2',
  full_name: 'React avancé',
  short_name: 'REACT',
  category_id: 'cat-2',
};

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const onConfirm = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <SelectCoursesDialog
        open
        onOpenChange={jest.fn()}
        selectedCourseIds={[]}
        onConfirm={onConfirm}
      />
    </QueryClientProvider>,
  );
  return { onConfirm };
}

describe('SelectCoursesDialog — chargement du catalogue', () => {
  beforeEach(() => {
    mockListCourses.mockReset();
    mockListCategories.mockReset().mockResolvedValue({ data: [] });
  });

  it('permet de relancer un chargement en échec sans le confondre avec un résultat vide', async () => {
    const user = userEvent.setup();
    mockListCourses
      .mockRejectedValueOnce(new Error('Service indisponible'))
      .mockResolvedValueOnce({ data: [], meta: { total: 0 } });
    renderDialog();

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les cours');
    expect(screen.queryByText(/aucun cours ne correspond/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByText(/aucun cours ne correspond/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockListCourses).toHaveBeenCalledTimes(2);
  });

  it('relance la même recherche distante et permet de sélectionner le cours trouvé', async () => {
    const user = userEvent.setup();
    let searchFails = true;
    mockListCourses.mockImplementation(async (params) => {
      if (params?.q === 'React') {
        if (searchFails) throw new Error('Recherche indisponible');
        return { data: [SECOND_COURSE], meta: { total: 1 } };
      }
      return { data: [FIRST_COURSE], meta: { total: 1 } };
    });
    const { onConfirm } = renderDialog();

    await screen.findByRole('button', { name: FIRST_COURSE.full_name });
    await user.type(screen.getByPlaceholderText('Rechercher un cours…'), 'React');

    await screen.findByRole('alert');
    expect(screen.queryByText(/aucun cours ne correspond/i)).not.toBeInTheDocument();
    searchFails = false;
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    await user.click(await screen.findByRole('button', { name: SECOND_COURSE.full_name }));
    expect(mockListCourses).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'React', page: 1, per_page: 20 }),
    );
    await user.click(screen.getByRole('button', { name: 'Ajouter 1 cours' }));
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ id: SECOND_COURSE.id, fullName: SECOND_COURSE.full_name }),
    ]);
  });

  it('conserve les cours et la sélection après un échec de pagination puis charge la page manquante', async () => {
    const user = userEvent.setup();
    mockListCourses
      .mockResolvedValueOnce({ data: [FIRST_COURSE], meta: { total: 2 } })
      .mockRejectedValueOnce(new Error('Page suivante indisponible'));
    const { onConfirm } = renderDialog();

    await user.click(await screen.findByRole('button', { name: FIRST_COURSE.full_name }));
    await user.click(screen.getByRole('button', { name: 'Voir plus' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les cours suivants',
    );
    expect(screen.getByRole('button', { name: FIRST_COURSE.full_name })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Ajouter 1 cours' })).toBeEnabled();
    expect(screen.queryByText(/aucun cours ne correspond/i)).not.toBeInTheDocument();

    let resolveNextPage!: (response: Awaited<ReturnType<typeof coursesApi.list>>) => void;
    mockListCourses.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNextPage = resolve;
        }),
    );
    const retryButton = screen.getByRole('button', { name: 'Réessayer' });
    await user.click(retryButton);
    expect(retryButton).toBeDisabled();
    resolveNextPage({ data: [SECOND_COURSE], meta: { total: 2 } });

    await user.click(await screen.findByRole('button', { name: SECOND_COURSE.full_name }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir plus' })).not.toBeInTheDocument();
    expect(mockListCourses.mock.calls.map(([params]) => params?.page)).toEqual([1, 2, 2]);

    await user.click(screen.getByRole('button', { name: 'Ajouter 2 cours' }));
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ id: FIRST_COURSE.id }),
      expect.objectContaining({ id: SECOND_COURSE.id }),
    ]);
  });

  it('conserve les sélections lors du filtrage par catégorie et de son annulation', async () => {
    const user = userEvent.setup();
    mockListCategories.mockResolvedValue({
      data: [
        {
          id: 'cat-2',
          name: 'Développement web',
          tenant_id: 'tenant-1',
          description: null,
          parent_id: null,
          children: [],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    mockListCourses.mockImplementation(async (params) => ({
      data: params?.category_ids ? [SECOND_COURSE] : [FIRST_COURSE],
      meta: { total: 1 },
    }));
    const { onConfirm } = renderDialog();

    await user.click(await screen.findByRole('button', { name: FIRST_COURSE.full_name }));
    await user.click(await screen.findByRole('button', { name: 'Développement web' }));
    await user.click(await screen.findByRole('button', { name: SECOND_COURSE.full_name }));
    expect(mockListCourses).toHaveBeenLastCalledWith(
      expect.objectContaining({ category_ids: 'cat-2', page: 1 }),
    );

    await user.click(screen.getByRole('button', { name: 'Toutes catégories' }));
    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: FIRST_COURSE.full_name,
        }),
      ).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Ajouter 2 cours' }));
    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ id: FIRST_COURSE.id }),
      expect.objectContaining({ id: SECOND_COURSE.id }),
    ]);
  });
});
