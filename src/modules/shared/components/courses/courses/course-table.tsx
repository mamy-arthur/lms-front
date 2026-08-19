import { useCallback, useState } from 'react';

import { BookOpen, ChevronDown, Plus, LayoutGrid, List, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryPath, useCoursesStore } from '../lib/course-store';
import type { Course } from '../types/index';
import { toast } from 'sonner';
import { CourseCard } from '@/modules/shared/components/courses/components/CourseCard';
import { CourseDrawer } from './course-drawer';
import { CourseDataTable } from './CourseDataTable';
import { CategoryDrawer } from '../categories/category-drawer';
import { ModuleSearch } from '@modules/shared/components/modules';
import { usePaginatedCourses } from '../hooks/usePaginatedCourses';
import type { CourseListParams } from '@/shared/api/courses.api';

type View = 'card' | 'table';

type Props = {
  basePath: string;
};

export function CourseTable({ basePath }: Props) {
  const { categories, loading: categoriesLoading, upsertCourse, deleteCourse, toggleCourseVisibility } = useCoursesStore();

  const [params, setParams] = useState<CourseListParams>({
    page: 1,
    per_page: 25,
    sort_by: 'full_name',
    sort_order: 'asc',
  });
  const [draftSearch, setDraftSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: paginatedData, isLoading: coursesLoading } = usePaginatedCourses(params);
  const courses = paginatedData?.data ?? [];
  const total = paginatedData?.total ?? 0;
  const isLoading = coursesLoading || categoriesLoading;

  const page = (params.page ?? 1) - 1; // DataTable uses 0-based
  const pageSize = params.per_page ?? 25;
  const sort = { column: params.sort_by ?? 'full_name', direction: (params.sort_order ?? 'asc') as 'asc' | 'desc' };
  const hasQuery = !!(params.q || params.category_ids);

  const handleSearch = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      page: 1,
    }));
  }, [draftSearch]);

  const handleCategoryChange = useCallback((value: string) => {
    if (value === 'all') {
      setSelectedCategories([]);
      setParams((prev) => ({ ...prev, category_ids: undefined, page: 1 }));
      return;
    }
    setSelectedCategories((prev) => {
      const next = prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value];
      setParams((p) => ({ ...p, category_ids: next.length > 0 ? next.join(',') : undefined, page: 1 }));
      return next;
    });
  }, []);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage + 1 })); // DataTable is 0-based
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, per_page: newSize, page: 1 }));
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [view, setView] = useState<View>('table');
  const [courseDrawer, setCourseDrawer] = useState<{
    open: boolean;
    course: Course | null;
  }>({
    open: false,
    course: null,
  });
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ModuleSearch value={draftSearch} onChange={setDraftSearch} onSearch={handleSearch} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={`size-6 ${view === 'card' ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
              onClick={() => setView('card')}
              aria-label="Vue cartes"
            >
              <LayoutGrid className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`size-6 ${view === 'table' ? 'bg-background shadow-sm' : 'hover:bg-transparent'}`}
              onClick={() => setView('table')}
              aria-label="Vue tableau"
            >
              <List className="size-3" />
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-56 h-9 justify-between text-xs font-normal">
                {selectedCategories.length === 0
                  ? 'Toutes les catégories'
                  : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
                <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="space-y-0.5">
                {categories.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs">
                    <Checkbox
                      checked={selectedCategories.includes(c.id)}
                      onCheckedChange={() => handleCategoryChange(c.id)}
                    />
                    {getCategoryPath(categories, c.id)}
                  </label>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <button
                  className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => handleCategoryChange('all')}
                >
                  Effacer le filtre
                </button>
              )}
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setCategoryDrawerOpen(true)}>
            <Settings2 className="mr-1 size-4" />
            Gérer les catégories
          </Button>
          <Button
            onClick={() => setCourseDrawer({ open: true, course: null })}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
          >
            <Plus className="mr-1 size-4" />
            Nouveau cours
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <CourseDataTable
          courses={courses}
          categories={categories}
          isLoading={isLoading}
          hasQuery={hasQuery}
          basePath={basePath}
          page={page}
          pageSize={pageSize}
          total={total}
          sort={sort}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={(course) => setCourseDrawer({ open: true, course })}
          onDelete={setConfirmDelete}
          onToggleVisibility={(course) => {
            toggleCourseVisibility(course.id);
            toast.success(course.visible ? 'Cours masqué' : 'Cours rendu visible');
          }}
        />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-5 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun cours trouvé</p>
              <p className="text-sm text-muted-foreground">
                Commencez par créer votre premier cours.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              categories={categories}
              getCategoryPath={getCategoryPath}
              onEdit={(course) => setCourseDrawer({ open: true, course })}
              onDelete={setConfirmDelete}
              onToggleVisibility={(course) => {
                toggleCourseVisibility(course.id);
                toast.success(course.visible ? 'Cours masqué' : 'Cours rendu visible');
              }}
              href={() => `${basePath}/${course.id}`}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le cours « {confirmDelete?.fullName} » sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete) {
                  try {
                    await deleteCourse(confirmDelete.id);
                    toast.success('Cours supprimé');
                  } catch {
                    toast.error('Erreur lors de la suppression');
                  }
                }
                setConfirmDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CourseDrawer
        open={courseDrawer.open}
        onOpenChange={(o) =>
          setCourseDrawer((s) => ({
            open: o,
            course: o ? s.course : null,
          }))
        }
        course={courseDrawer.course}
      />

      <CategoryDrawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} />
    </div>
  );
}
