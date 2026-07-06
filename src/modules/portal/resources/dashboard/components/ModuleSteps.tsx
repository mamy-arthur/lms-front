import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CourseModule, Student } from '../lib/students-data';

const MODULE_STATUS_CLASS: Record<CourseModule['status'], string> = {
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  not_started: 'bg-muted text-muted-foreground border-border',
};

const MODULE_STATUS_LABEL: Record<CourseModule['status'], string> = {
  completed: 'Terminé',
  in_progress: 'En cours',
  not_started: 'À démarrer',
};

export function ModuleSteps({ student }: { student: Student }) {
  return (
    <div className="space-y-2">
      {student.modules.map((m, index) => {
        const isCompleted = m.status === 'completed';
        const isInProgress = m.status === 'in_progress';
        const isTodo = m.status === 'not_started';
        return (
          <div key={m.id} className="flex gap-2">
            {/* Step indicator */}
            <div className="flex flex-col items-center mt-2">
              <div>
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {isInProgress && <Clock className="h-4 w-4 text-yellow-600" />}
                {isTodo && <Circle className="h-4 w-4 text-gray-400" />}
              </div>

              {/* Connector line */}
              {index !== student.modules.length - 1 && (
                <div className={cn('mt-2 h-8 w-1', isCompleted ? 'bg-green-200' : 'bg-gray-200')} />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-4 pt-4 bg-gray-100 px-4 rounded-md">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{m.name}</p>
                  {m.duration && (
                    <p className="text-xs text-muted-foreground">Durée ecoule · {m.duration}:20m</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs',
                    MODULE_STATUS_CLASS[m.status],
                  )}
                >
                  {MODULE_STATUS_LABEL[m.status]}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
