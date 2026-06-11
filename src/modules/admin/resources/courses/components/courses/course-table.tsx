import { useMemo, useState } from "react";
import {
    MoreHorizontal,
    Pencil,
    Eye,
    EyeOff,
    Trash2,
    Search,
    BookOpen,
    Plus,
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
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryPath, useCoursesStore } from "../../lib/course-store";
import type { Course } from "../../types/index";
import { toast } from "sonner";

type Props = {
    onEdit: (course: Course) => void;
    onNew: () => void;
};

export function CourseTable({ onEdit, onNew }: Props) {
    const {
        courses,
        categories,
        loading,
        deleteCourse,
        toggleCourseVisibility,
    } = useCoursesStore();
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

    const filtered = useMemo(() => {
        return courses.filter((c) => {
            if (categoryFilter !== "all" && c.categoryId !== categoryFilter)
                return false;
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return (
                c.fullName.toLowerCase().includes(q) ||
                c.shortName.toLowerCase().includes(q) ||
                c.identifier.toLowerCase().includes(q)
            );
        });
    }, [courses, query, categoryFilter]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un cours…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                >
                    <SelectTrigger className="w-full sm:w-60">
                        <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            Toutes les catégories
                        </SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {getCategoryPath(categories, c.id)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Nom complet</TableHead>
                            <TableHead>Nom abrégé</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Identifiant</TableHead>
                            <TableHead>Visibilité</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filtered.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={6} className="py-16">
                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                            <BookOpen className="size-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                Aucun cours trouvé
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Commencez par créer votre
                                                premier cours.
                                            </p>
                                        </div>
                                        <Button size="sm" onClick={onNew}>
                                            <Plus className="mr-1 size-4" />
                                            Nouveau cours
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((course) => (
                                <TableRow key={course.id} className="group">
                                    <TableCell className="font-medium">
                                        {course.fullName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                            {course.shortName}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getCategoryPath(
                                            categories,
                                            course.categoryId,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {course.identifier}
                                    </TableCell>
                                    <TableCell>
                                        {course.visible ? (
                                            <Badge
                                                variant="secondary"
                                                className="gap-1"
                                            >
                                                <Eye className="size-3" />
                                                Visible
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 text-muted-foreground"
                                            >
                                                <EyeOff className="size-3" />
                                                Caché
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
                                                className="w-48"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        onEdit(course)
                                                    }
                                                >
                                                    <Pencil className="mr-2 size-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        toggleCourseVisibility(
                                                            course.id,
                                                        );
                                                        toast.success(
                                                            course.visible
                                                                ? "Cours masqué"
                                                                : "Cours rendu visible",
                                                        );
                                                    }}
                                                >
                                                    {course.visible ? (
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
                                                    onClick={() =>
                                                        setConfirmDelete(course)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 size-4" />
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
            </div>

            <AlertDialog
                open={!!confirmDelete}
                onOpenChange={(o) => !o && setConfirmDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer ce cours ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le cours «{" "}
                            {confirmDelete?.fullName} » sera définitivement
                            supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (confirmDelete) {
                                    deleteCourse(confirmDelete.id);
                                    toast.success("Cours supprimé");
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
