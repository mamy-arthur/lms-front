import { useState } from "react";
import {
    MoreHorizontal,
    Pencil,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    FolderTree,
    CornerDownRight,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { buildCategoryTree, useCoursesStore } from "../../lib/course-store";
import type { Category } from "../../types/index";
import { toast } from "sonner";

type Props = {
    onEdit: (category: Category) => void;
    onAddChild: (parent: Category) => void;
};

export function CategoryTable({ onEdit, onAddChild }: Props) {
    const { categories, deleteCategory, toggleCategoryVisibility } =
        useCoursesStore();
    const tree = buildCategoryTree(categories);
    const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

    const parentName = (id: string | null) =>
        id ? (categories.find((c) => c.id === id)?.name ?? "—") : "—";

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie supérieure</TableHead>
                        <TableHead>Identifiant</TableHead>
                        <TableHead>Visibilité</TableHead>
                        <TableHead className="w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tree.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={5} className="py-12">
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                        <FolderTree className="size-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Aucune catégorie. Créez-en une via le
                                        formulaire ci-dessus.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        tree.map(({ category, depth }) => (
                            <TableRow key={category.id} className="group">
                                <TableCell className="font-medium">
                                    <div
                                        className="flex items-center gap-2"
                                        style={{
                                            paddingLeft: `${depth * 20}px`,
                                        }}
                                    >
                                        {depth > 0 && (
                                            <CornerDownRight className="size-3.5 text-muted-foreground" />
                                        )}
                                        <span>{category.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {parentName(category.parentId)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        {category.identifier}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    {category.visible ? (
                                        <Badge
                                            variant="secondary"
                                            className="gap-1"
                                        >
                                            <Eye className="size-3" /> Visible
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="gap-1 text-muted-foreground"
                                        >
                                            <EyeOff className="size-3" /> Caché
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 opacity-0 transition group-hover:opacity-100 data-[state=open]:opacity-100"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-52"
                                        >
                                            <DropdownMenuItem
                                                onClick={() => onEdit(category)}
                                            >
                                                <Pencil className="mr-2 size-4" />{" "}
                                                Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    onAddChild(category)
                                                }
                                            >
                                                <Plus className="mr-2 size-4" />{" "}
                                                Ajouter une sous-catégorie
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    toggleCategoryVisibility(
                                                        category.id,
                                                    );
                                                    toast.success(
                                                        category.visible
                                                            ? "Catégorie masquée"
                                                            : "Catégorie visible",
                                                    );
                                                }}
                                            >
                                                {category.visible ? (
                                                    <>
                                                        <EyeOff className="mr-2 size-4" />{" "}
                                                        Cacher
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="mr-2 size-4" />{" "}
                                                        Afficher
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() =>
                                                    setConfirmDelete(category)
                                                }
                                            >
                                                <Trash2 className="mr-2 size-4" />{" "}
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

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
        </div>
    );
}
