"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CourseList } from "./CourseList";
import { topCourses } from "./data/data";

export default function TopCoursesCard() {
    return (
        <Card className="min-h-112.5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-base font-semibold">
                        Top 5 Formations
                    </CardTitle>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Les formations les plus performantes
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                >
                    Voir tous
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-3 overflow-y-auto">
                <CourseList courses={topCourses} />
            </CardContent>
        </Card>
    );
}
