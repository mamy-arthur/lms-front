import { memo, useCallback, useMemo, useState } from "react";
import {
    MoreHorizontal,
    Pencil,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    FolderTree,
    CornerDownRight,
    Search,
} from "lucide-react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DataTable,
    type DataTableColumn,
} from "@/shared/components/ui/DataTable";
import { buildCategoryTree, useCoursesStore } from "../lib/course-store";
import type { Category } from "../types/index";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CategoryDrawer } from "./category-drawer";

type CategoryRow = Category & { depth: number };

type Props = {
    onEdit: (category: Category) => void;
    onAddChild: (parent: Category) => void;
};

function CategoryTableBase({ onEdit, onAddChild }: Props) {
    const { categories, deleteCategory, toggleCategoryVisibility } =
        useCoursesStore();
    const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
    const [search, setSearch] = useState("");

    const rows: CategoryRow[] = useMemo(() => {
        const tree = buildCategoryTree(categories);
        const flat = tree.map(({ category, depth }) => ({
            ...category,
            depth,
        }));
        if (!search.trim()) return flat;
        const lower = search.toLowerCase();
        return flat.filter((r) => r.name.toLowerCase().includes(lower));
    }, [categories, search]);

    const parentName = useCallback(
        (id: string | null) =>
            id ? (categories.find((c) => c.id === id)?.name ?? "—") : "—",
        [categories],
    );

    const ActionMenu = useCallback(
        function ActionMenu({ item }: { item: CategoryRow }) {
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
                                aria-label={`Actions pour ${item.name}`}
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="mr-2 size-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddChild(item)}>
                                <Plus className="mr-2 size-4" />
                                Ajouter une sous-catégorie
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    toggleCategoryVisibility(item.id);
                                    toast.success(
                                        item.visible
                                            ? "Catégorie masquée"
                                            : "Catégorie visible",
                                    );
                                }}
                            >
                                {item.visible ? (
                                    <>
                                        <EyeOff className="mr-2 size-4" />
                                        Cacher
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 size-4" />
                                        Afficher
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirmDelete(item)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        [onEdit, onAddChild, toggleCategoryVisibility],
    );

    const columns: DataTableColumn<CategoryRow>[] = useMemo(
        () => [
            {
                key: "name",
                label: "Nom",
                sortable: false,
                render: (row) => (
                    <div
                        className="flex items-center gap-2 font-medium"
                    >
                        <span className="text-xs">{row.name}</span>
                    </div>
                ),
            },
            {
                key: "parentId",
                label: "Catégorie supérieure",
                sortable: false,
                render: (row) => (
                    <span className="text-xs text-muted-foreground">
                        {parentName(row.parentId)}
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
        [parentName, ActionMenu],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une catégorie..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button
                    onClick={() => setCategoryDrawerOpen(true)}
                    className="bg-(--color-primary) hover:bg-primary/80 text-primary-foreground"
                >
                    <Plus className="mr-1 size-4" />
                    Nouveau catégorie
                </Button>
            </div>

            <DataTable
                data={rows}
                columns={columns}
                isLoading={false}
                hasQuery={!!search.trim()}
                page={1}
                pageSize={rows.length || 1}
                total={rows.length}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                emptyState={{
                    icon: (
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                            <FolderTree className="size-5 text-muted-foreground" />
                        </div>
                    ),
                    title: "Aucune catégorie",
                    description: "Créez-en une via le formulaire ci-dessus.",
                    filteredTitle: "Aucun résultat",
                    filteredDescription:
                        "Aucune catégorie ne correspond à votre recherche.",
                }}
            />

            <AlertDialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer cette catégorie ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Les sous-catégories et les cours liés à «{" "}
                            {confirmDelete?.name} » seront détachés (placés à la
                            racine / sans catégorie).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (confirmDelete) {
                                    deleteCategory(confirmDelete.id);
                                    toast.success("Catégorie supprimée");
                                }
                                setConfirmDelete(null);
                            }}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CategoryDrawer
                open={categoryDrawerOpen}
                onOpenChange={setCategoryDrawerOpen}
            />
        </div>
    );
}

export const CategoryTable = memo(CategoryTableBase);
