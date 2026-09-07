import type { ApiCourse, ApiCourseCategory } from '@/shared/types/course.types';
import type { Category, Course } from '../types/index';

export function mapApiCategory(api: ApiCourseCategory): Category {
  return {
    id: api.id,
    name: api.name,
    parentId: api.parent_id,
    description: api.description ?? undefined,
    children: api.children?.map(mapApiCategory),
  };
}

export function flattenCategories(roots: ApiCourseCategory[]): Category[] {
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
    categoryName: api.category_name ?? null,
    identifier: api.id_number,
    visible: api.visibility === 'PUBLISHED',
    visibility: api.visibility,
    description: api.description ?? undefined,
  };
}
