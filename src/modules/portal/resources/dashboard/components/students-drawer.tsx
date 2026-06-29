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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ActivityTimeline } from "./activity-timeline";

interface StudentDrawerProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MODULE_STATUS_LABEL: Record<CourseModule["status"], string> = {
    completed: "Terminé",
    in_progress: "En cours",
    not_started: "À démarrer",
};

const MODULE_STATUS_CLASS: Record<CourseModule["status"], string> = {
    completed:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    in_progress:
        "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    not_started: "bg-muted text-muted-foreground border-border",
};

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
                className="flex w-full flex-col gap-0 border-l p-0 sm:max-w-xl"
            >
                <SheetHeader className="space-y-0 px-6 pt-6 pb-4 text-left">
                    <SheetTitle className="sr-only">
                        Détail de {student.name}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Suivi de progression et activité récente
                    </SheetDescription>

                    <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={student.avatarUrl} alt="" />
                            <AvatarFallback className="bg-muted text-sm font-medium">
                                {student.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {student.name}
                                </h2>
                                <Badge>{student.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {student.course}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="space-y-8 px-6 pb-10">
                        {/* Progression globale */}
                        <section className="space-y-3">
                            <div className="flex items-end justify-between">
                                <SectionTitle>Progression globale</SectionTitle>
                                <span className="text-3xl font-semibold tabular-nums text-foreground">
                                    {student.progress}%
                                </span>
                            </div>
                            <Progress
                                value={student.progress}
                                className="h-2.5"
                            />
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CalendarDays
                                        className="h-4 w-4"
                                        aria-hidden
                                    />
                                    <span>Début · {student.startDate}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" aria-hidden />
                                    <span>Écoulé · {student.elapsed}</span>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Résumé */}
                        <section className="space-y-3">
                            <SectionTitle>Résumé</SectionTitle>
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

                        <Separator />

                        {/* Parcours */}
                        <section className="space-y-3">
                            <SectionTitle>Parcours de formation</SectionTitle>
                            <div className="space-y-3">
                                {student.modules.map((m) => (
                                    <Card
                                        key={m.id}
                                        className="rounded-xl border-border/60 shadow-none transition-colors hover:bg-muted/40"
                                    >
                                        <CardContent className="space-y-3 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {m.name}
                                                    </p>
                                                    {m.duration ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Durée · {m.duration}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                        MODULE_STATUS_CLASS[
                                                            m.status
                                                        ],
                                                    )}
                                                >
                                                    {
                                                        MODULE_STATUS_LABEL[
                                                            m.status
                                                        ]
                                                    }
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Progress
                                                    value={m.progress}
                                                    className="h-1.5 flex-1"
                                                />
                                                <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                                    {m.progress}%
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <Separator />

                        {/* Activité */}
                        <section className="space-y-4">
                            <SectionTitle>Activité récente</SectionTitle>
                            <ActivityTimeline events={student.activity} />
                        </section>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
