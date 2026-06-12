import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ContentTypePicker } from "./ContentTypePicker";
import { ContentType } from "../../types";

export function AddContentModal({
    open,
    onOpenChange,
    sectionId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionId: string;
}) {
    const handleSelect = (type: ContentType) => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Choisir un type de contenu</DialogTitle>
                    <DialogDescription>
                        Sélectionnez le type de ressource à ajouter à cette
                        section.
                    </DialogDescription>
                </DialogHeader>
                <ContentTypePicker onSelect={handleSelect} />
            </DialogContent>
        </Dialog>
    );
}
