import { GraduationCap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardEnrollmentStatuses } from '../data/enrollmentStatuses';
import type { DashboardOverview } from '../types';
import { AverageProgressIndicator } from './AverageProgressIndicator';

export function StudentProgressOverview({ students }: { students: DashboardOverview['students'] }) {
  const { totalEnrollments } = students;
  const enrollments = dashboardEnrollmentStatuses.map((status) => ({
    ...status,
    count: students.statusCounts[status.key],
  }));

  return (
    <Card aria-labelledby="student-progress-title" className="rounded-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>
            <h2 id="student-progress-title" className="flex items-center gap-2 text-base">
              <GraduationCap className="size-5 text-primary" aria-hidden="true" />
              Progression globale des étudiants
            </h2>
          </CardTitle>
          <CardDescription>
            Une vue d’ensemble de l’avancement des étudiants dans leurs formations.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-sm bg-(--color-primary) p-5 text-primary-foreground">
            <p className="text-sm font-medium">Progression moyenne</p>
            <AverageProgressIndicator value={students.averageProgress} />
            <p className="text-xs text-primary-foreground/90">
              Moyenne de l’avancement de toutes les inscriptions, réinscriptions incluses.
            </p>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">État des inscriptions</h3>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                {students.uniqueStudents} étudiants · {totalEnrollments} inscriptions
              </span>
            </div>
            <div className="flex h-1 gap-1 overflow-hidden rounded-full" aria-hidden="true">
              {enrollments.map((status) => (
                <div
                  key={status.label}
                  className={status.color}
                  style={{
                    width: `${totalEnrollments ? (status.count / totalEnrollments) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {enrollments.map((status) => (
                <div
                  key={status.label}
                  className="relative isolate space-y-2 overflow-hidden rounded-sm border border-gray-100 p-4"
                >
                  <dt className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`size-1 rounded-full ${status.color}`} aria-hidden="true" />
                    {status.label}
                  </dt>
                  <dd className="flex items-baseline gap-2">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 bottom-3 grid grid-cols-3 gap-1.5 opacity-20"
                    >
                      {Array.from({ length: 9 }, (_, index) => (
                        <span key={index} className={`size-1 rounded-full ${status.color}`} />
                      ))}
                    </span>
                    <span className="relative z-10 text-3xl tabular-nums">{status.count}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              Un étudiant peut avoir plusieurs inscriptions, y compris à une même formation. Les
              statuts comptent toutes les inscriptions, pas les étudiants uniques.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
