"use client";

import { useState } from "react";
import { CategoryTable } from "../components/categories/category-table";
import { Category } from "../types";
import { CategoryDrawer } from "../components/categories/category-drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CoursesProvider } from "../lib/course-store";

export function CategoryList() {
    return (
        <CoursesProvider>
            <CategoryInner />
        </CoursesProvider>
    );
}

export function CategoryInner() {
    const [editing, setEditing] = useState<Category | null>(null);
    const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
    return (
        <div className="bg-background">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Catégories de formation
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Classez et organisez vos formations par catégories.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => setCategoryDrawerOpen(true)}
                        className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
                    >
                        <Plus className="mr-1 size-4" />
                        Nouveau catégories
                    </Button>
                </div>
            </header>
            <CategoryTable
                onEdit={(c) => {
                    setEditing(c);
                    setDefaultParentId(null);
                }}
                onAddChild={(parent) => {
                    setEditing(null);
                    setDefaultParentId(parent.id);
                }}
            />
            <CategoryDrawer
                open={categoryDrawerOpen}
                onOpenChange={setCategoryDrawerOpen}
            />
        </div>
    );
}
