'use client';

import { useMemo, useState } from 'react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STUDENTS } from '../../lib/students-data';

const chartConfig = {
  progress: {
    label: 'Progression',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig;

export function ProgressCard() {
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const courses = useMemo(
    () => Array.from(new Set(STUDENTS.map((s) => s.course))).sort(),
    [],
  );

  const progress = useMemo(() => {
    const subset =
      courseFilter === 'all' ? STUDENTS : STUDENTS.filter((s) => s.course === courseFilter);
    if (subset.length === 0) return 0;
    const avg = subset.reduce((sum, s) => sum + s.progress, 0) / subset.length;
    return Math.round(avg);
  }, [courseFilter]);

  const chartData = [
    {
      name: 'progress',
      value: progress,
      fill: 'var(--color-primary)',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex justify-between gap-2 items-center pb-0">
        <div>
        <CardTitle>Progression global</CardTitle>
        <CardDescription>Progression moyenne sur l’ensemble des formations.</CardDescription>
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="mt-2 h-8 w-50" aria-label="Filtrer par parcours">
            <SelectValue placeholder="Tous les parcours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les parcours</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56">
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={90 - (360 * progress) / 100}
              innerRadius={80}
              outerRadius={100}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                polarRadius={[100, 80]}
                className="first:fill-muted last:fill-background"
              />

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
                            {progress}%
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
