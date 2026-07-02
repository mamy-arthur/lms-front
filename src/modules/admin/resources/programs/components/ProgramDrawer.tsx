"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import ProgramFlow from "./ProgramFlow";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

type ProgramDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ProgramDrawer({ open, onOpenChange }: ProgramDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex flex-col max-w-[55%]! ">
                <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle>Nouvelle formation</SheetTitle>
                    <SheetDescription>
                        Créez un nouveau parcours en ajoutant des modules et en définissant les règles d'accès et d'attestation.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                    <ProgramFlow />
                </div>
                <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-6 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                    >
                        <Save />
                        Sauvegarder le parcours
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
