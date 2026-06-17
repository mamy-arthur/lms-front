"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FileContentView } from "@/modules/shared/components/contents/components/FileView";
import { useCourseStore } from "../../../../hooks/useCouseContentStore";
import { PageContentView } from "@/modules/shared/components/contents/components/PageView";
import { UrlContentView } from "@/modules/shared/components/contents/components/UrlView";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ContentPreviewDrawer({ open, onOpenChange }: Props) {
    const course = useCourseStore();
    const sections = course.sections;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto"
                showCloseButton
            >
                <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle>Aperçu étudiant</SheetTitle>
                    <SheetDescription>
                        Aperçu de ce que l'étudiant voit
                    </SheetDescription>
                </SheetHeader>
                <div>
                    {sections.map((section) => (
                        <div className="flex flex-col space-y-4 p-4">
                            <span className="font-bold">{section.title}</span>
                            {section.contents.map((content) => (
                                <div key={`${section.id}-${content.id}`}>
                                    {content.type === "file" && (
                                        <FileContentView
                                            key={content.id}
                                            title={content.title}
                                            description={
                                                (content.data?.[
                                                    "description"
                                                ] as string) ?? undefined
                                            }
                                            fileName={
                                                (content.data?.[
                                                    "fileName"
                                                ] as string) ?? undefined
                                            }
                                        />
                                    )}
                                    {content.type === "page" && (
                                        <PageContentView
                                            title={content.title}
                                            description={
                                                (content.data?.[
                                                    "description"
                                                ] as string) ?? undefined
                                            }
                                            contenu={
                                                (content.data?.[
                                                    "content"
                                                ] as string) ?? undefined
                                            }
                                        />
                                    )}
                                    {content.type === "url" && (
                                        <UrlContentView
                                            title={content.title}
                                            description={
                                                (content.data?.[
                                                    "description"
                                                ] as string) ?? undefined
                                            }
                                            url={
                                                (content.data?.[
                                                    "url"
                                                ] as string) ?? undefined
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}
