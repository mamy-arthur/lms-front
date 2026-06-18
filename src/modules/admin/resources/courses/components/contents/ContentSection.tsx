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
import { Separator } from "@/components/ui/separator";

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
    const remove = useCourseStore((s) => s.removeContent);
    const ctype = type;

    const goBack = () => {
        remove(sectionId, contentId);
    };

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
        <div className="flex flex-col space">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">
                        Configuration du contenu
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Renseignez les informations du contenu.
                    </p>
                </div>
                <Badge className={typeMeta.bgColor}>{typeMeta.label}</Badge>
            </div>

            <Separator/>
            <main className="mt-5">
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
