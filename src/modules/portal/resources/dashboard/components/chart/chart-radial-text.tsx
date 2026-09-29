'use client';

import { useMemo, useState } from 'react';
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  usePlotArea,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DashboardStudent } from '../../types';

const chartConfig = {
  progress: {
    label: 'Progression',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig;

function ProgressGrid() {
  const plotArea = usePlotArea();
  if (!plotArea) return null;

  const radius = Math.min(plotArea.width, plotArea.height) / 2;
  return (
    <PolarGrid
      gridType="circle"
      radialLines={false}
      stroke="none"
      polarRadius={[radius, radius * 0.8]}
      className="first:fill-muted last:fill-background"
    />
  );
}

export function ProgressCard({
  className,
  students,
}: {
  className?: string;
  students: DashboardStudent[] | undefined;
}) {
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const courses = useMemo(
    () =>
      [...new Map((students ?? []).map((s) => [s.courseId, s.course])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    [students],
  );

  const progress = useMemo(() => {
    const subset =
      courseFilter === 'all'
        ? (students ?? [])
        : (students ?? []).filter((s) => s.courseId === courseFilter);
    if (subset.length === 0) return 0;
    const avg = subset.reduce((sum, s) => sum + s.progress, 0) / subset.length;
    return Math.round(avg);
  }, [courseFilter, students]);

  const chartData = [
    {
      name: 'progress',
      value: progress,
      fill: 'var(--color-primary)',
    },
  ];

  return (
    <Card className={cn('h-full min-w-0', className)}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-0">
        <div className="min-w-0 flex-1 basis-48">
          <CardTitle>Progression global</CardTitle>
          <CardDescription>Progression moyenne sur l’ensemble des formations.</CardDescription>
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger
            className="mt-2 h-8 w-50 min-w-0 max-w-full"
            aria-label="Filtrer par parcours"
          >
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
      </CardHeader>
      <CardContent className="pt-6">
        <div
          className="flex flex-col items-center gap-4"
          role="img"
          aria-label={`Progression moyenne : ${students ? `${progress}%` : 'indisponible'}`}
        >
          <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-56">
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={90 - (360 * progress) / 100}
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
              innerRadius="80%"
              outerRadius="100%"
            >
              <ProgressGrid />

              <RadialBar dataKey="value" cornerRadius={10} background />

              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy - 6}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {students ? `${progress}%` : '—'}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
