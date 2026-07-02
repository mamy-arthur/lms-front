"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import ProgramFlow from "./ProgramFlow";

type ProgramDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ProgramDrawer({ open, onOpenChange }: ProgramDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-4xl flex flex-col"
            >
                <SheetHeader>
                    <SheetTitle>Nouvelle formation</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                    <ProgramFlow />
                </div>
            </SheetContent>
        </Sheet>
    );
}
