import {
    CalendarDays,
    Clock,
    Layers,
    CheckCircle2,
    PlayCircle,
    ListChecks,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseModule, Student } from "../lib/students-data";
import { ProgressVariant } from "@/shared/components/ui/progress/Progress";
import { ModuleSteps } from "./ModuleSteps";

interface StudentDrawerProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
        </h3>
    );
}

export function StudentDrawer({
    student,
    open,
    onOpenChange,
}: StudentDrawerProps) {
    if (!student) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full p-0 sm:max-w-xl" />
            </Sheet>
        );
    }

    const completed = student.modules.filter(
        (m) => m.status === "completed",
    ).length;
    const inProgress = student.modules.filter(
        (m) => m.status === "in_progress",
    ).length;
    const remaining = student.modules.filter(
        (m) => m.status === "not_started",
    ).length;

    const summary = [
        { icon: CheckCircle2, label: "Terminés", value: completed },
        { icon: PlayCircle, label: "En cours", value: inProgress },
        { icon: ListChecks, label: "Restants", value: remaining },
        { icon: Layers, label: "Global", value: `${student.progress}%` },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-xl overflow-auto"
            >
                <SheetHeader className="space-y-0 text-left">
                    <SheetTitle className="sr-only">
                        Détail de {student.name}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Suivi de progression et activité récente
                    </SheetDescription>

                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={student.avatarUrl} alt="" />
                            <AvatarFallback className="bg-muted text-sm font-medium">
                                {student.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {student.name}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {student.course}
                            </p>
                        </div>
                    </div>
                </SheetHeader>
                <Separator />
                <div className="space-y-8 px-6 pb-10 pt-5">
                    <section className="space-y-3">
                        <div className="flex justify-between">
                            <div className="flex items-center gap-2 text-xs">
                                <CalendarDays className="h-4 w-4" aria-hidden />
                                <span>Début · {student.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Clock className="h-4 w-4" aria-hidden />
                                <span>Écoulé · {student.elapsed}</span>
                            </div>
                        </div>
                    </section>
                    {/* Résumé */}
                    <section className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {summary.map(({ icon: Icon, label, value }) => (
                                <Card
                                    key={label}
                                    className="rounded-xl border-border/60 shadow-none"
                                >
                                    <CardContent className="space-y-1.5 p-4">
                                        <Icon
                                            className="h-4 w-4 text-muted-foreground"
                                            aria-hidden
                                        />
                                        <p className="text-xl font-semibold tabular-nums text-foreground">
                                            {value}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {label}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                    {/* Parcours */}
                    <section className="space-y-3">
                        <SectionTitle>Parcours de formation</SectionTitle>
                        <div className="space-y-3">
                            <ModuleSteps student={student} />
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
