import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category, Course } from '../types/index';
import type { ApiCourse, ApiCourseCategory } from '@/shared/types/course.types';
import { coursesApi, courseCategoriesApi } from '@/shared/api/courses.api';
import { courseKeys, courseCategoryKeys } from '@/shared/queries/keys';

// --- Mapping helpers ---------------------------------------------------------

function mapApiCategory(api: ApiCourseCategory): Category {
  return {
    id: api.id,
    name: api.name,
    parentId: api.parent_id,
    description: api.description ?? undefined,
    children: api.children?.map(mapApiCategory),
  };
}

function flattenCategories(roots: ApiCourseCategory[]): Category[] {
  const result: Category[] = [];
  const walk = (cats: ApiCourseCategory[]) => {
    for (const cat of cats) {
      result.push(mapApiCategory(cat));
      if (cat.children?.length) walk(cat.children);
    }
  };
  walk(roots);
  return result;
}

export function mapApiCourse(api: ApiCourse): Course {
  return {
    id: api.id,
    fullName: api.full_name,
    shortName: api.short_name,
    categoryId: api.category_id,
    identifier: api.id_number,
    visible: api.visibility === 'PUBLISHED',
    visibility: api.visibility,
    description: api.description ?? undefined,
  };
}

// --- Context types -----------------------------------------------------------

type UpsertCourseInput = {
  id?: string;
  fullName: string;
  shortName: string;
  categoryId: string | null;
  visible: boolean;
  description?: string;
};

type UpsertCategoryInput = {
  id?: string;
  name: string;
  description?: string;
  parentId?: string | null;
};

type Ctx = {
  courses: Course[];
  categories: Category[];
  loading: boolean;
  upsertCourse: (c: UpsertCourseInput) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  toggleCourseVisibility: (id: string) => void;
  upsertCategory: (c: UpsertCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
};

const CoursesCtx = createContext<Ctx | null>(null);

// --- Provider ----------------------------------------------------------------

export function CoursesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const res = await coursesApi.list();
      return res.data.map(mapApiCourse);
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: courseCategoryKeys.lists(),
    queryFn: async () => {
      const res = await courseCategoriesApi.list();
      return flattenCategories(res.data);
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (payload: Parameters<typeof coursesApi.create>[0]) =>
      coursesApi.create(payload),
    onSuccess: ({ data }) => {
      const created = mapApiCourse(data);
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) => [created, ...prev]);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof coursesApi.update>[1]) =>
      coursesApi.update(id, payload),
    onSuccess: ({ data }) => {
      const updated = mapApiCourse(data);
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) =>
        prev.filter((c) => c.id !== id),
      );
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: Parameters<typeof courseCategoriesApi.create>[0]) =>
      courseCategoriesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Parameters<typeof courseCategoriesApi.update>[1]) =>
      courseCategoriesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => courseCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });

  const value = useMemo<Ctx>(
    () => ({
      courses,
      categories,
      loading: coursesLoading || categoriesLoading,

      upsertCourse: async (c) => {
        const payload = {
          full_name: c.fullName,
          short_name: c.shortName,
          category_id: c.categoryId,
          visibility: (c.visible ? 'PUBLISHED' : 'DRAFT') as 'PUBLISHED' | 'DRAFT',
          description: c.description ?? null,
        };
        if (c.id) {
          const { data } = await updateCourseMutation.mutateAsync({ id: c.id, ...payload });
          return mapApiCourse(data);
        }
        const { data } = await createCourseMutation.mutateAsync(payload);
        return mapApiCourse(data);
      },

      deleteCourse: (id) => deleteCourseMutation.mutateAsync(id),

      toggleCourseVisibility: (id) => {
        const current = courses.find((c) => c.id === id);
        const newVisibility =
          current?.visibility === 'PUBLISHED' ? ('DRAFT' as const) : ('PUBLISHED' as const);
        updateCourseMutation.mutate({ id, visibility: newVisibility });
      },

      upsertCategory: async (c) => {
        if (c.id) {
          const { data } = await updateCategoryMutation.mutateAsync({
            id: c.id,
            name: c.name,
            description: c.description ?? null,
          });
          return mapApiCategory(data);
        }
        const { data } = await createCategoryMutation.mutateAsync({
          name: c.name,
          description: c.description ?? null,
          parent_id: c.parentId ?? null,
        });
        return mapApiCategory(data);
      },

      deleteCategory: (id) => deleteCategoryMutation.mutateAsync(id),
    }),
    [
      courses,
      categories,
      coursesLoading,
      categoriesLoading,
      createCourseMutation,
      updateCourseMutation,
      deleteCourseMutation,
      createCategoryMutation,
      updateCategoryMutation,
      deleteCategoryMutation,
    ],
  );

  return <CoursesCtx.Provider value={value}>{children}</CoursesCtx.Provider>;
}

export function useCoursesStore() {
  const ctx = useContext(CoursesCtx);
  if (!ctx) throw new Error('useCoursesStore must be used within CoursesProvider');
  return ctx;
}

// --- Utilities ---------------------------------------------------------------

export function buildCategoryTree(categories: Category[]) {
  const byParent = new Map<string | null, Category[]>();
  for (const c of categories) {
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  }
  const result: { category: Category; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      result.push({ category: child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

export function getCategoryPath(categories: Category[], id: string | null): string {
  if (!id) return '—';
  const map = new Map(categories.map((c) => [c.id, c] as const));
  const parts: string[] = [];
  let cur = map.get(id);
  let guard = 0;
  while (cur && guard++ < 20) {
    parts.unshift(cur.name);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return parts.join(' / ');
}
