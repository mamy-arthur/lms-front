"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users } from "lucide-react";

type Course = {
    id: string;
    name: string;
    enrollments: number;
    inProgress: number;
    completed: number;
    notStarted: number;
};

const topCourses: Course[] = [
    {
        id: "1",
        name: "React Avancé",
        enrollments: 125,
        inProgress: 15,
        completed: 95,
        notStarted: 15,
    },
    {
        id: "2",
        name: "Docker Fundamentals",
        enrollments: 98,
        inProgress: 20,
        completed: 67,
        notStarted: 11,
    },
    {
        id: "3",
        name: "Kubernetes Basics",
        enrollments: 76,
        inProgress: 25,
        completed: 43,
        notStarted: 8,
    },
    {
        id: "4",
        name: "TypeScript Mastery",
        enrollments: 52,
        inProgress: 2,
        completed: 50,
        notStarted: 0,
    },
    {
        id: "5",
        name: "Next.js Expert",
        enrollments: 41,
        inProgress: 5,
        completed: 34,
        notStarted: 2,
    },
];

export default function TopCoursesCard() {
    const getCompletionRate = (course: Course) => {
        return Math.round((course.completed / course.enrollments) * 100);
    };

    return (
        <Card className="h-112.5 border-0 shadow-sm bg-linear-to-b from-background to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        Top 5 Formations
                    </CardTitle>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Les formations les plus performantes
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground"
                >
                    Voir toutes
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3">
                {topCourses.map((course) => {
                    const completionRate = getCompletionRate(course);

                    return (
                        <div
                            key={course.id}
                            className="
                                    group rounded-md border 
                                    bg-card p-3 px-4
                                    transition-all duration-200
                                    border-primary/20
                                "
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                                        <GraduationCap className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold">
                                            {course.name}
                                        </p>

                                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            {course.enrollments} inscrits
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="grid grid-cols-2 gap-4 items-center mt-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs text-gray-900">
                                            Progression
                                        </span>

                                        <span className="text-xs font-medium">
                                            {Math.round(
                                                (course.completed /
                                                    course.enrollments) *
                                                    100,
                                            )}
                                            %
                                        </span>
                                    </div>

                                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-(--color-primary) transition-all"
                                            style={{
                                                width: `${
                                                    (course.completed /
                                                        course.enrollments) *
                                                    100
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-2 ml-auto justify-end">
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                                    >
                                        ● {course.completed} terminés
                                    </Badge>

                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-amber-200 bg-amber-50 text-amber-700"
                                    >
                                        ● {course.inProgress} en cours
                                    </Badge>

                                    <Badge variant="outline" className="gap-1 border-gray-200 text-gray-600">
                                        ● {course.notStarted} non commencés
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
