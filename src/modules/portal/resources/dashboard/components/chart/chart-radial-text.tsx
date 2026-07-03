'use client';

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { CheckCircle2, Circle, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const progress = 42;
const completed = 18;
const total = 25;

const chartData = [
  {
    name: 'progress',
    value: progress,
    fill: 'var(--color-primary)',
  },
];

const chartConfig = {
  progress: {
    label: 'Progression',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig;

export function ProgressCard() {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Progression global</CardTitle>
        <CardDescription>Progression moyenne sur l'ensemble des formations.</CardDescription>
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
