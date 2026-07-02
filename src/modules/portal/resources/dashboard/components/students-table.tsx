import { useMemo, useState } from "react";
import { ChevronRight as ChevronRightIcon, Inbox, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { type Student, type StudentStatus } from "../lib/students-data";
import { StudentsTableSkeleton } from "./students-table-skeleton";
import { ProgressVariant } from "@/shared/components/ui/progress/Progress";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/shared/components/ui/date/DatePickerRange";

interface StudentsTableProps {
    students: Student[];
    loading?: boolean;
    onSelect: (student: Student) => void;
}

const PAGE_SIZE = 5;

export function StudentsTable({
    students,
    loading,
    onSelect,
}: StudentsTableProps) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
        "all",
    );
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return students.filter((s) => {
            const matchesQuery =
                query.trim() === "" ||
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.course.toLowerCase().includes(query.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || s.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [students, query, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0 flex justify-between">
                <div>
                    <CardTitle>
                        Suivi de la progression des étudiants par formation
                    </CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                        />
                        <Input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Rechercher un étudiant…"
                            className="h-8  pl-8"
                            aria-label="Rechercher un étudiant"
                        />
                    </div>
                    <DatePickerWithRange />
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-0">
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[28%]">
                                        Étudiant
                                    </TableHead>
                                    <TableHead>Parcours</TableHead>
                                    <TableHead className="w-[20%]">
                                        Progression
                                    </TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <StudentsTableSkeleton rows={PAGE_SIZE} />
                                ) : filtered.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={6}
                                            className="py-16"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                    <Inbox
                                                        className="h-5 w-5 text-muted-foreground"
                                                        aria-hidden
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        Aucun étudiant trouvé
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Ajustez votre recherche
                                                        ou vos filtres pour voir
                                                        des résultats.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((s) => (
                                        <TableRow
                                            key={s.id}
                                            className="cursor-pointer transition-colors"
                                            onClick={() => onSelect(s)}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault();
                                                    onSelect(s);
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage
                                                            src={s.avatarUrl}
                                                            alt=""
                                                        />
                                                        <AvatarFallback className="bg-muted text-xs font-medium">
                                                            {s.initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-foreground">
                                                        {s.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {s.course}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <ProgressVariant
                                                        value={s.progress}
                                                        className="h-1.5 flex-1"
                                                        style={
                                                            {
                                                                "--color-progress":
                                                                    "var(--color-primary)",
                                                            } as React.CSSProperties
                                                        }
                                                    />
                                                    <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                                        {s.progress}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg"
                                                    aria-label={`Voir le détail de ${s.name}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(s);
                                                    }}
                                                >
                                                    <ChevronRightIcon
                                                        className="h-4 w-4"
                                                        aria-hidden
                                                    />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
