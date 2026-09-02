import { useCallback, useMemo, useState } from 'react';

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Settings2,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const {
    categories,
    loading: categoriesLoading,
    deleteCourse,
    toggleCourseVisibility,
  } = useCoursesStore();

  const [params, setParams] = useState<CourseListParams>({
    page: 1,
    per_page: 25,
    sort_by: 'full_name',
    sort_dir: 'asc',
  });
  const [draftSearch, setDraftSearch] = useState('');

  const { data: paginatedData, isLoading: coursesLoading } = usePaginatedCourses(params);
  const courses = paginatedData?.data ?? [];
  const total = paginatedData?.total ?? 0;
  const isLoading = coursesLoading || categoriesLoading;

  const selectedCategories = params.category_ids ? params.category_ids.split(',') : [];

  const page = (params.page ?? 1) - 1; // DataTable uses 0-based
  const pageSize = params.per_page ?? 25;
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const sort = {
    column: params.sort_by ?? 'full_name',
    direction: (params.sort_dir ?? params.sort_order ?? 'asc') as 'asc' | 'desc',
  };
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
      setParams((prev) => ({ ...prev, category_ids: undefined, page: 1 }));
      return;
    }
    setParams((prev) => {
      const current = prev.category_ids ? prev.category_ids.split(',') : [];
      const next = current.includes(value)
        ? current.filter((c) => c !== value)
        : [...current, value];
      return { ...prev, category_ids: next.length > 0 ? next.join(',') : undefined, page: 1 };
    });
  }, []);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_dir:
        prev.sort_by === column && (prev.sort_dir ?? prev.sort_order ?? 'asc') === 'asc'
          ? 'desc'
          : 'asc',
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
              <Button
                variant="outline"
                className="w-full sm:w-56 justify-between text-xs font-normal"
              >
                {selectedCategories.length === 0
                  ? 'Toutes les catégories'
                  : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
                <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="space-y-0.5">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(c.id)}
                      onCheckedChange={() => handleCategoryChange(c.id)}
                      className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
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

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((id) => (
            <Badge
              key={id}
              variant="outline"
              className="h-6 gap-1 px-2 text-xs font-normal  bg-(--color-primary) text-white"
            >
              {getCategoryPath(categories, id)}
              <button
                onClick={() => handleCategoryChange(id)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                aria-label="Retirer ce filtre"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

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
            toggleCourseVisibility(course.id, course.visibility ?? 'DRAFT');
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
        <>
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
                  toggleCourseVisibility(course.id, course.visibility ?? 'DRAFT');
                  toast.success(course.visible ? 'Cours masqué' : 'Cours rendu visible');
                }}
                href={() => `${basePath}/${course.id}`}
              />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} sur {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pageCount - 1}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
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
