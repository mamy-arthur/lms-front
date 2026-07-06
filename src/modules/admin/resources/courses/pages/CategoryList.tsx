'use client';

import { CoursesProvider } from '@/modules/shared/components/courses/lib/course-store';
import { CategoryTable } from '@/modules/shared/components/courses/categories/category-table';

export function CategoryList() {
  return (
    <CoursesProvider>
      <CategoryInner />
    </CoursesProvider>
  );
}

export function CategoryInner() {
  return (
    <div className="bg-background">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Classez et organisez vos formations par catégories.
          </p>
        </div>
      </header>
      <CategoryTable
        onEdit={() => {
          //
        }}
        onAddChild={() => {
        }}
      />
    </div>
  );
}
