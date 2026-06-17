import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCourseStore } from "../../hooks/useCouseContentStore";
import { CONTENT_TYPE_META, ContentType } from "../../types";
import { PageForm } from "./forms/PageForm";
import { FileForm } from "./forms/FileForm";
import { FolderForm } from "./forms/FolderForm";
import { ScormForm } from "./forms/ScormForm";
import { UrlForm } from "./forms/UrlForm";
import { TextMediaForm } from "./forms/TextMediaForm";
import { SurveyForm } from "./forms/SurveyForm";
import { Badge } from "@/components/ui/badge";
import { id } from "zod/v4/locales";

const VALID: ContentType[] = [
    "page",
    "file",
    "folder",
    "scorm",
    "url",
    "survey",
    "text-media",
];

export function SectionContent({
    sectionId,
    type,
    contentId,
}: {
    sectionId: string;
    type: ContentType;
    contentId: string;
}) {
    const update = useCourseStore((s) => s.updateContent);
    const ctype = type;

    const goBack = () => {};

    const handleSave = (title: string, data: Record<string, unknown>) => {
        update(sectionId, contentId, {
            title,
            sectionId,
            type,
            id: contentId,
            data,
        });
    };
    const typeMeta = CONTENT_TYPE_META[type ?? "file"];
    return (
        <div className="flex flex-col space-y-2 border rounded-md p-4">
            <div className="w-full flex justify-end">
                <Badge className={`${typeMeta.bgColor}`}>
                    {typeMeta.label}
                </Badge>
            </div>
            <main>
                {ctype === "page" && (
                    <PageForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "file" && (
                    <FileForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "folder" && (
                    <FolderForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "scorm" && (
                    <ScormForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "url" && (
                    <UrlForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "text-media" && (
                    <TextMediaForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
                {ctype === "survey" && (
                    <SurveyForm
                        onCancel={goBack}
                        onSubmit={(v) => handleSave(v.title, v)}
                    />
                )}
            </main>
        </div>
    );
}
