export type Category = {
    id: string;
    name: string;
    identifier: string;
    parentId: string | null;
    visible: boolean;
    description?: string;
};

export type Course = {
    id: string;
    fullName: string;
    shortName: string;
    categoryId: string | null;
    identifier: string;
    visible: boolean;
    description?: string;
};

export type ContentType =
    | "folder"
    | "file"
    | "page"
    | "scorm"
    | "survey"
    | "url"
    | "text-media";

export interface CourseContent {
    id: string;
    sectionId: string;
    type: ContentType;
    title: string;
    data?: Record<string, unknown>;
}

export interface CourseSection {
    id: string;
    title: string;
    description?: string;
    order: number;
    contents: CourseContent[];
}

export const CONTENT_TYPE_META: Record<
    ContentType,
    { label: string; icon: string; description: string; bgColor: string }
> = {
    page: {
        label: "Page",
        icon: "FileText",
        description: "Une page de contenu riche",
        bgColor: "bg-blue-400",
    },
    file: {
        label: "Fichier",
        icon: "File",
        description: "Téléverser un fichier",
        bgColor: "bg-yellow-500",
    },
    folder: {
        label: "Dossier",
        icon: "Folder",
        description: "Regrouper plusieurs fichiers",
        bgColor: "bg-red-400",
    },
    scorm: {
        label: "SCORM",
        icon: "Package",
        description: "Paquet SCORM interactif",
        bgColor: "bg-orange-500",
    },
    url: {
        label: "URL",
        icon: "Link",
        description: "Lien vers une ressource externe",
        bgColor: "bg-green-400",
    },
    survey: {
        label: "Sondage",
        icon: "BarChart3",
        description: "Recueillir des réponses",
        bgColor: "bg-gray-400",
    },
    "text-media": {
        label: "Texte et média",
        icon: "Type",
        description: "Texte enrichi et médias",
        bgColor: "bg-purple-400",
    },
};
