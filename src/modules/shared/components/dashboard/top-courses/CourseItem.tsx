import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users } from 'lucide-react';
import { Course } from './types';
import { CourseProgress } from './CourseProgress';

type Props = {
  course: Course;
};

export function CourseItem({ course }: Props) {
  return (
    <div
      className="
                group rounded-lg
                px-4 py-4 border
            "
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
            <GraduationCap className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{course.name}</p>

            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {course.enrollments} inscrits
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 items-center gap-4">
        <CourseProgress completed={course.completed} enrollments={course.enrollments} />

        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            ● {course.completed} terminés
          </Badge>

          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            ● {course.inProgress} en cours
          </Badge>

          <Badge variant="outline" className="border-gray-200 text-gray-600">
            ● {course.notStarted} non commencés
          </Badge>
        </div>
      </div>
    </div>
  );
}
