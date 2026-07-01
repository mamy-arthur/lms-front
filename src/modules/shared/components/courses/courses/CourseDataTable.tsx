import { memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    DataTable,
    type DataTableColumn,
} from "@/shared/components/ui/DataTable";
import { getCategoryPath } from "../lib/course-store";
import type { Category, Course } from "../types/index";

interface CourseDataTableProps {
    courses: Course[];
    categories: Category[];
    isLoading?: boolean;
    hasQuery?: boolean;
    basePath: string;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    onToggleVisibility: (course: Course) => void;
}

function CourseDataTableBase({
    courses,
    categories,
    isLoading = false,
    hasQuery = false,
    basePath,
    onEdit,
    onDelete,
    onToggleVisibility,
}: CourseDataTableProps) {
    const router = useRouter();
    const ActionMenu = useCallback(
        function ActionMenu({ item }: { item: Course }) {
            return (
                <div
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                                aria-label={`Actions pour ${item.fullName}`}
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onToggleVisibility(item)}
                            >
                                {item.visible ? (
                                    <>
                                        <EyeOff className="mr-2 size-3.5 text-muted-foreground" />
                                        Cacher
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 size-3.5 text-muted-foreground" />
                                        Afficher
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(item)}
                            >
                                <Trash2 className="mr-2 size-3.5" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        [onEdit, onDelete, onToggleVisibility],
    );

    const columns: DataTableColumn<Course>[] = useMemo(
        () => [
            {
                key: "fullName",
                label: "Nom",
                sortable: false,
                render: (row) => (
                    <span className="text-xs font-medium">{row.fullName}</span>
                ),
            },
            {
                key: "shortName",
                label: "Nom court",
                sortable: false,
                render: (row) => (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {row.shortName}
                    </code>
                ),
            },
            {
                key: "categoryId",
                label: "Catégorie",
                sortable: false,
                render: (row) => (
                    <span className="text-xs text-muted-foreground">
                        {getCategoryPath(categories, row.categoryId) || "—"}
                    </span>
                ),
            },
            {
                key: "identifier",
                label: "Identifiant",
                sortable: false,
                render: (row) => (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {row.identifier}
                    </code>
                ),
            },
            {
                key: "visible",
                label: "Visibilité",
                sortable: false,
                render: (row) =>
                    row.visible ? (
                        <Badge
                            variant="outline"
                            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        >
                            <Eye className="size-3" /> Visible
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="gap-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
                        >
                            <EyeOff className="size-3" /> Caché
                        </Badge>
                    ),
            },
            {
                key: "actions",
                label: "",
                sortable: false,
                render: (row) => <ActionMenu item={row} />,
            },
        ],
        [categories, ActionMenu],
    );

    return (
        <DataTable
            data={courses}
            columns={columns}
            isLoading={isLoading}
            hasQuery={hasQuery}
            page={1}
            pageSize={courses.length || 1}
            total={courses.length}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onRowClick={(course) => router.push(`${basePath}/${course.id}`)}
            emptyState={{
                title: "Aucun cours trouvé",
                description: "Commencez par créer votre premier cours.",
                filteredTitle: "Aucun résultat",
                filteredDescription:
                    "Aucun cours ne correspond à votre recherche.",
            }}
        />
    );
}

export const CourseDataTable = memo(CourseDataTableBase);
