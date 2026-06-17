"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseStore } from "../hooks/useCouseContentStore";
import { SectionCard } from "../components/contents/SectionCard";
import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { ContentPreviewDrawer } from "../components/contents/preview/components/ContentPreviewDrawer";

export function CourseContentPage() {
    const [isOpen, setIsOpen] = useState(false);
    const sections = useMemo(
        () =>
            [...useCourseStore.getState().sections].sort(
                (a, b) => a.order - b.order,
            ),
        [useCourseStore((s) => s.sections)],
    );
    const addSection = useCourseStore((s) => s.addSection);

    return (
        <div className="bg-background">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Contenu du cours
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Organisez votre cours en sections et ressources.
                    </p>
                </div>
                <div>
                    <Button
                        className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                        onClick={() => setIsOpen(true)}
                    >
                        <BookOpen className="size-4" />
                        Prévisualisation
                    </Button>
                </div>
            </header>

            <main className="mx-auto py-8">
                <div className="space-y-4">
                    {sections.map((section) => (
                        <SectionCard key={section.id} section={section} />
                    ))}
                </div>

                <Button
                    variant="outline"
                    onClick={() => addSection()}
                    className="mt-6 w-full border-dashed py-6 text-muted-foreground hover:text-foreground"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une section
                </Button>

                {sections.length === 0 && (
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Aucune section pour le moment.
                    </p>
                )}
            </main>
            <ContentPreviewDrawer open={isOpen} onOpenChange={setIsOpen} />
        </div>
    );
}
