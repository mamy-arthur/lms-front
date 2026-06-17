import { useState } from "react";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
    FileText,
    File as FileIcon,
    Folder,
    Package,
    Link as LinkIcon,
    BarChart3,
    Type as TypeIcon,
    ChevronDownIcon,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AddContentModal } from "./AddContentModal";

import { CONTENT_TYPE_META, ContentType, CourseSection } from "../../types";
import { useCourseStore } from "../../hooks/useCouseContentStore";
import { SectionContent } from "./ContentSection";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ICONS: Record<ContentType, typeof FileText> = {
    page: FileText,
    file: FileIcon,
    folder: Folder,
    scorm: Package,
    url: LinkIcon,
    survey: BarChart3,
    "text-media": TypeIcon,
};

export function SectionCard({ section }: { section: CourseSection }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [title, setTitle] = useState(section.title);
    const [description, setDescription] = useState(section.description ?? "");
    const updateSection = useCourseStore((s) => s.updateSection);
    const removeSection = useCourseStore((s) => s.removeSection);
    const [type, setType] = useState<ContentType | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const save = () => {
        updateSection(section.id, {
            title: title.trim() || "Section",
            description,
        });
        setEditOpen(false);
    };
    const typeMeta = CONTENT_TYPE_META[type ?? "file"];
    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-1">
                <CollapsibleTrigger asChild>
                    <button className="flex flex-1 items-center gap-2 min-w-0 text-left">
                        <ChevronRight
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                isOpen ? "rotate-90" : ""
                            }`}
                        />
                        <h3 className="truncate text-sm font-semibold text-foreground">
                            {section.title}
                        </h3>
                    </button>
                </CollapsibleTrigger>

                <div className="flex gap-2 items-center">
                    {type && (
                        <Badge className={`${typeMeta.bgColor}`}>
                            {typeMeta.label}
                        </Badge>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => removeSection(section.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                <AddContentModal
                    open={addOpen}
                    onOpenChange={setAddOpen}
                    sectionId={section.id}
                    setType={setType}
                />
                {type && <SectionContent sectionId={section.id} type={type} />}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    className="mt-4 w-full justify-start text-muted-foreground hover:text-foreground"
                >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un contenu
                </Button>
            </CollapsibleContent>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Nom</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button onClick={save}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Collapsible>
    );
}
