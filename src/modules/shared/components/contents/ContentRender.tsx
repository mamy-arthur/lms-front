import { CourseContent } from "@/modules/admin/resources/courses/types";
import { FileContentView } from "./components/FileView";
import { PageContentView } from "./components/PageView";
import { UrlContentView } from "./components/UrlView";
import { TextContentView } from "./components/TextView";
import { FolderContentView } from "./components/FolderView";
import { SurveyContentView } from "./components/SurveyView";

interface ContentRendererProps {
    content: CourseContent;
}

export function ContentRenderer({ content }: ContentRendererProps) {
    switch (content.type) {
        case "file":
            return (
                <FileContentView
                    title={content.title}
                    description={content.data?.description as string}
                    fileName={content.data?.fileName as string}
                />
            );

        case "page":
            return (
                <PageContentView
                    title={content.title}
                    description={content.data?.description as string}
                    contenu={content.data?.content as string}
                />
            );

        case "url":
            return (
                <UrlContentView
                    title={content.title}
                    description={content.data?.description as string}
                    url={content.data?.url as string}
                />
            );
        case "text-media":
            return (
                <TextContentView
                    title={content.title}
                    text={content.data?.text as string}
                />
            );
        case "folder":
            return (
                <FolderContentView
                    title={content.title}
                    description={content.data?.description as string}
                    fileCount={content.data?.fileCount as number}
                    filesNames={content.data?.filesNames as string[]}
                />
            );
        case "survey":
            return (
                <SurveyContentView
                    title={content.title}
                    surveyType={
                        (content.data?.surveyType as string) ?? undefined
                    }
                    description={
                        (content.data?.description as string) ?? undefined
                    }
                />
            );

        default:
            return null;
    }
}
