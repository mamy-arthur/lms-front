import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  FolderTree,
  Hash,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category, Course } from '@/modules/shared/components/courses/types';
import { CatalogLockMenuNote } from '@/shared/components/CatalogLockMenuNote';
import { describeCourseActionsLock } from '@/shared/types/catalog-lock.types';

interface CourseCardProps {
  course: Course;
  categories: Category[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onToggleVisibility: (course: Course) => void;
  getCategoryPath: (categories: Category[], categoryId: string | null) => string;
  href: (courseId: string) => string;
}
export function CourseCard({
  course,
  categories,
  onEdit,
  onDelete,
  onToggleVisibility,
  getCategoryPath,
  href,
}: CourseCardProps) {
  const router = useRouter();
  // Same reading as the table view: `=== true`, so an unanswered lock stays enabled
  // and is refused by the server rather than greyed out on a guess.
  const locked = course.isLocked === true;
  const lockReason = describeCourseActionsLock(course.lockOrigins ?? []);

  return (
    <Card
      className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => router.push(href(course.id))}
    >
      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-semibold leading-tight">{course.fullName}</CardTitle>

          <CardDescription>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{course.shortName}</code>
          </CardDescription>
        </div>

        {/* The whole card navigates on click, so every click coming out of this menu
            has to be stopped — on the wrapper, not just on the trigger. Radix renders
            the menu in a DOM portal, but a React event still bubbles up the COMPONENT
            tree, so an item's click reaches the Card's onClick and pushes a route
            behind whatever the item was supposed to do. */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-5 cursor-pointer">
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={href(course.id)}>
                  <BookOpen className="mr-2 size-4" />
                  Contenu du cours
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Pencil className="mr-2 size-4" />
                Modifier
              </DropdownMenuItem>

              {/* Hiding a course removes it from the learner's tree just like a
                  delete does, so the sale freezes both. */}
              <DropdownMenuItem disabled={locked} onClick={() => onToggleVisibility(course)}>
                {course.visible ? (
                  <>
                    <EyeOff className="mr-2 size-4" />
                    Cacher
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 size-4" />
                    Afficher
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={locked}
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="mr-2 size-4" />
                Supprimer
              </DropdownMenuItem>

              {locked && <CatalogLockMenuNote reason={lockReason} />}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex-1 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderTree className="size-4 shrink-0" />
          <span className="truncate">{getCategoryPath(categories, course.categoryId)}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="size-4 shrink-0" />
          <span className="truncate">{course.identifier}</span>
        </div>
      </CardContent>

      <CardFooter className="relative z-10">
        <div className="flex items-center justify-between w-full gap-2">
          {course.visible ? (
            <Badge
              variant="outline"
              className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              <Eye className="size-3" />
              Visible
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200">
              <EyeOff className="size-3" />
              Caché
            </Badge>
          )}

          <Button
            asChild
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={href(course.id)}>
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
