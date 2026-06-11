import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CategoryForm } from "./category-form";
import { CategoryTable } from "./category-table";
import type { Category } from "../../types/index";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function CategoryDrawer({ open, onOpenChange }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

    return (
        <Sheet
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setEditing(null);
                    setDefaultParentId(null);
                }
            }}
        >
            <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:w-[90vw]">
                <SheetHeader className="border-b px-6 py-5">
                    <SheetTitle>Gérer les catégories</SheetTitle>
                    <SheetDescription>
                        Organisez vos cours avec une arborescence de catégories.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 px py-6">
                    <CategoryForm
                        category={editing}
                        defaultParentId={defaultParentId}
                        onDone={() => {
                            setEditing(null);
                            setDefaultParentId(null);
                        }}
                    />

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Toutes les catégories
                        </h4>
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
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
