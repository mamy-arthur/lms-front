import {
    CheckCircle2,
    CircleDashed,
    LogIn,
    ArrowRight,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "../lib/students-data";

const ICONS: Record<ActivityEvent["type"], LucideIcon> = {
    login: LogIn,
    module_completed: CheckCircle2,
    quiz: CircleDashed,
    next_step: ArrowRight,
};

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
    return (
        <ol className="relative space-y-5 pl-6">
            <span
                className="absolute left-2.5 top-2 bottom-2 w-px bg-border"
                aria-hidden
            />
            {events.map((e, idx) => {
                const Icon = ICONS[e.type];
                const isLast = idx === events.length - 1;
                return (
                    <li key={e.id} className="relative">
                        <span
                            className={cn(
                                "absolute -left-[18px] flex h-5 w-5 items-center justify-center rounded-full border bg-background",
                                isLast ? "border-foreground" : "border-border",
                            )}
                            aria-hidden
                        >
                            <Icon
                                className={cn(
                                    "h-3 w-3",
                                    isLast
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                )}
                            />
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">
                                {e.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {e.description}
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                                {e.date}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
