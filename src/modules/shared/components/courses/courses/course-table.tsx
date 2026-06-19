import { useMemo, useState } from "react";

import { Search, BookOpen, Plus } from "lucide-react";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getCategoryPath, useCoursesStore } from "../lib/course-store";
import type { Course } from "../types/index";
import { toast } from "sonner";
import { CourseCard } from "@/modules/shared/components/courses/components/CourseCard";
import { CourseDrawer } from "./course-drawer";

type Props = {
    basePath: string;
};

export function CourseTable({ basePath }: Props) {
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
    const [courseDrawer, setCourseDrawer] = useState<{
        open: boolean;
        course: Course | null;
    }>({
        open: false,
        course: null,
    });

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
                <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/3" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-5 w-20" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <BookOpen className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">Aucun cours trouvé</p>
                            <p className="text-sm text-muted-foreground">
                                Commencez par créer votre premier cours.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {filtered.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            categories={categories}
                            getCategoryPath={getCategoryPath}
                            onEdit={(course) =>
                                setCourseDrawer({ open: true, course })
                            }
                            onDelete={setConfirmDelete}
                            onToggleVisibility={(course) => {
                                toggleCourseVisibility(course.id);
                                toast.success(
                                    course.visible
                                        ? "Cours masqué"
                                        : "Cours rendu visible",
                                );
                            }}
                            href={() => `${basePath}/${course.id}`}
                        />
                    ))}
                </div>
            )}

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
