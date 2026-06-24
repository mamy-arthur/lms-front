"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const description = "A line chart with dots";

const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
    { month: "July", desktop: 214, mobile: 140 },
    { month: "August", desktop: 114, mobile: 140 },
    { month: "September", desktop: 24, mobile: 140 },
    { month: "October", desktop: 264, mobile: 140 },
    { month: "November", desktop: 204, mobile: 140 },
    { month: "December", desktop: 150, mobile: 140 },
];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    mobile: {
        label: "Mobile",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

export function ChartLineDots() {
    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-bold uppercase text-xs">
                        Evoluation chiffre d'affaire
                    </CardTitle>
                    <CardDescription>January - Decembre 2024</CardDescription>
                </div>
                <Select>
                    <SelectTrigger className="w-full max-w-28">
                        <SelectValue placeholder="Select a date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Date</SelectLabel>
                            <SelectItem value="apple">2026</SelectItem>
                            <SelectItem value="banana">2025</SelectItem>
                            <SelectItem value="blueberry">2024</SelectItem>
                            <SelectItem value="grapes">2023</SelectItem>
                            <SelectItem value="pineapple">2022</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-70 w-full">
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                            dataKey="desktop"
                            type="natural"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--color-desktop)",
                            }}
                            activeDot={{
                                r: 6,
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
