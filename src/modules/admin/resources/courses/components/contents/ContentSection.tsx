import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCourseStore } from "../../hooks/useCouseContentStore";
import { ContentType } from "../../types";
import { PageForm } from "./forms/PageForm";
import { FileForm } from "./forms/FileForm";
import { FolderForm } from "./forms/FolderForm";
import { ScormForm } from "./forms/ScormForm";
import { UrlForm } from "./forms/UrlForm";
import { TextMediaForm } from "./forms/TextMediaForm";
import { SurveyForm } from "./forms/SurveyForm";

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
}: {
    sectionId: string;
    type: ContentType;
}) {
    const addContent = useCourseStore((s) => s.addContent);
    const ctype = type;

    const goBack = () => {};

    const handleSave = (title: string, data: Record<string, unknown>) => {
        console.log(title , data)
        addContent(sectionId, ctype, title, data);
    };

    return (
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
    );
}
