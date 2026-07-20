import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Category, Course } from '../types/index';
import { mapApiCourse, mapApiCategory } from './course-mappers';
import { useCourseData } from '../hooks/useCourseData';
import { useCategoryData } from '../hooks/useCategoryData';

// Re-exports for backward compatibility with existing consumers
export { buildCategoryTree, getCategoryPath } from './course-utils';

// --- Types -------------------------------------------------------------------

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
  const {
    coursesQuery,
    createMutation: createCourse,
    updateMutation: updateCourse,
    deleteMutation: deleteCourse,
  } = useCourseData();

  const {
    categoriesQuery,
    createMutation: createCategory,
    updateMutation: updateCategory,
    deleteMutation: deleteCategory,
  } = useCategoryData();

  const courses = coursesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const value = useMemo<Ctx>(
    () => ({
      courses,
      categories,
      loading: coursesQuery.isLoading || categoriesQuery.isLoading,

      upsertCourse: async (c) => {
        const payload = {
          full_name: c.fullName,
          short_name: c.shortName,
          category_id: c.categoryId,
          visibility: (c.visible ? 'PUBLISHED' : 'DRAFT') as 'PUBLISHED' | 'DRAFT',
          description: c.description ?? null,
        };
        if (c.id) {
          const { data } = await updateCourse.mutateAsync({ id: c.id, ...payload });
          return mapApiCourse(data);
        }
        const { data } = await createCourse.mutateAsync(payload);
        return mapApiCourse(data);
      },

      deleteCourse: (id) => deleteCourse.mutateAsync(id),

      toggleCourseVisibility: (id) => {
        const current = courses.find((c) => c.id === id);
        const newVisibility =
          current?.visibility === 'PUBLISHED' ? ('DRAFT' as const) : ('PUBLISHED' as const);
        updateCourse.mutate({ id, visibility: newVisibility });
      },

      upsertCategory: async (c) => {
        if (c.id) {
          const { data } = await updateCategory.mutateAsync({
            id: c.id,
            name: c.name,
            description: c.description ?? null,
          });
          return mapApiCategory(data);
        }
        const { data } = await createCategory.mutateAsync({
          name: c.name,
          description: c.description ?? null,
          parent_id: c.parentId ?? null,
        });
        return mapApiCategory(data);
      },

      deleteCategory: (id) => deleteCategory.mutateAsync(id),
    }),
    [
      courses,
      categories,
      coursesQuery.isLoading,
      categoriesQuery.isLoading,
      createCourse,
      updateCourse,
      deleteCourse,
      createCategory,
      updateCategory,
      deleteCategory,
    ],
  );

  return <CoursesCtx.Provider value={value}>{children}</CoursesCtx.Provider>;
}

export function useCoursesStore() {
  const ctx = useContext(CoursesCtx);
  if (!ctx) throw new Error('useCoursesStore must be used within CoursesProvider');
  return ctx;
}
