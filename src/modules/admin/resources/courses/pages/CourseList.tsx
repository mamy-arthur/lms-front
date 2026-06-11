"use client";

import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoursesProvider } from "../lib/course-store";
import { CourseTable } from "../components/courses/course-table";
import { CourseDrawer } from "../components/courses/course-drawer";
import type { Course } from "../types/index";

export function CoursesList() {
    return (
        <CoursesProvider>
            <CoursesInner />
        </CoursesProvider>
    );
}

function CoursesInner() {
    const [courseDrawer, setCourseDrawer] = useState<{
        open: boolean;
        course: Course | null;
    }>({
        open: false,
        course: null,
    });

    return (
        <div className="bg-background">
            <div className="mx-auto w-full">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Courses
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gérez vos cours.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                        >
                            <Settings2 className="mr-1 size-4" />
                            Gérer les catégories
                        </Button>
                        <Button
                            onClick={() =>
                                setCourseDrawer({ open: true, course: null })
                            }
                            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                        >
                            <Plus className="mr-1 size-4" />
                            Nouveau cours
                        </Button>
                    </div>
                </header>

                <CourseTable
                    onNew={() => setCourseDrawer({ open: true, course: null })}
                    onEdit={(course) => setCourseDrawer({ open: true, course })}
                />
            </div>

            <CourseDrawer
                open={courseDrawer.open}
                onOpenChange={(o) =>
                    setCourseDrawer((s) => ({
                        open: o,
                        course: o ? s.course : null,
                    }))
                }
                course={courseDrawer.course}
            />

        </div>
    );
}
