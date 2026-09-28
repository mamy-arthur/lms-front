import { useMemo, useState } from 'react';
import { ChevronRight as ChevronRightIcon, Inbox, Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { DashboardStudent } from '../types';
import type { DateRange } from 'react-day-picker';
import { StudentsTableSkeleton } from './students-table-skeleton';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';
import { DeadlineBadge } from './DeadlineBadge';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/shared/components/ui/date/DatePickerRange';

interface StudentsTableProps {
  students: DashboardStudent[];
  loading?: boolean;
  error?: boolean;
  onSelect?: (student: DashboardStudent) => void;
}

const PAGE_SIZE = 5;

export function StudentsTable({ students, loading, error, onSelect }: StudentsTableProps) {
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [dates, setDates] = useState<DateRange | undefined>();

  const courses = useMemo(
    () =>
      [...new Map(students.map((s) => [s.courseId, s.course])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    [students],
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        query.trim() === '' ||
        s.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        s.course.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCourse = courseFilter === 'all' || s.courseId === courseFilter;
      const enrolledAt = new Date(s.enrolledAt);
      const end = dates?.to ? new Date(dates.to) : undefined;
      end?.setHours(23, 59, 59, 999);
      const matchesDates =
        (!dates?.from || enrolledAt >= dates.from) && (!end || enrolledAt <= end);
      return matchesQuery && matchesCourse && matchesDates;
    });
  }, [students, query, courseFilter, dates]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0 flex justify-between">
        <div>
          <CardTitle>Progression des étudiants par formation</CardTitle>
          <CardDescription>
            {dates?.from
              ? `${dates.from.toLocaleDateString('fr-FR')} – ${dates.to?.toLocaleDateString('fr-FR') ?? '…'}`
              : 'Toutes les périodes'}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-50">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Rechercher un étudiant…"
              className="h-7 pl-8"
              aria-label="Rechercher un étudiant"
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-8 w-full sm:w-48" aria-label="Filtrer par parcours">
              <SelectValue placeholder="Tous les parcours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>
              {courses.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePickerWithRange value={dates} onChange={setDates} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[20%]">Étudiant</TableHead>
                  <TableHead className="w-[20%]">Parcours</TableHead>
                  <TableHead className="w-[25%]">Échéance</TableHead>
                  <TableHead className="w-[25%]">Progression</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <StudentsTableSkeleton rows={PAGE_SIZE} />
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      Les étudiants sont indisponibles.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Aucun étudiant trouvé
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Ajustez votre recherche ou vos filtres pour voir des résultats.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className={
                        onSelect ? 'cursor-pointer transition-colors' : 'transition-colors'
                      }
                      onClick={onSelect ? () => onSelect(s) : undefined}
                      tabIndex={onSelect ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onSelect(s);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={s.avatarUrl} alt="" />
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {s.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.course}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        <div className="flex gap-5">
                          {s.deadline
                            ? new Date(s.deadline + 'T00:00:00').toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                          <div className="flex flex-wrap items-center gap-2">
                            <EnrollmentStatusBadge status={s.status} />
                            <DeadlineBadge
                              deadline={s.deadline}
                              progress={s.progress}
                              status={s.status}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProgressVariant
                            value={s.progress}
                            className="h-1.5 flex-1"
                            style={
                              {
                                '--color-progress': 'var(--color-primary)',
                              } as React.CSSProperties
                            }
                          />
                          <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
                            {s.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          disabled={!onSelect}
                          aria-label={`Voir le détail de ${s.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(s);
                          }}
                        >
                          <ChevronRightIcon className="h-4 w-4" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
