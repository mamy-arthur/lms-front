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
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl">
                <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle>Gérer les catégories</SheetTitle>
                    <SheetDescription>
                        Organisez vos cours avec une arborescence de catégories.
                    </SheetDescription>
                </SheetHeader>

                <CategoryForm
                    category={editing}
                    defaultParentId={defaultParentId}
                    onDone={() => {
                        setEditing(null);
                        setDefaultParentId(null);
                    }}
                />
            </SheetContent>
        </Sheet>
    );
}
