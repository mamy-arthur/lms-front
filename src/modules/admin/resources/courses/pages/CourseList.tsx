'use client';

import { CoursesProvider } from '@/modules/shared/components/courses/lib/course-store';
import { CourseTable } from '@/modules/shared/components/courses/courses/course-table';

export function CoursesList() {
  return (
    <CoursesProvider>
      <CoursesInner />
    </CoursesProvider>
  );
}

function CoursesInner() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des cours</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez, modifiez et organisez les cours de votre plateforme.
            </p>
          </div>
        </header>

        <CourseTable basePath="/admin/courses" />
      </div>
    </div>
  );
}
