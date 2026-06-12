import {
  FileText,
  File as FileIcon,
  Folder,
  Package,
  Link as LinkIcon,
  BarChart3,
  Type as TypeIcon,
} from "lucide-react";
import { CONTENT_TYPE_META, ContentType } from "../../types";

const ICONS = {
  FileText,
  File: FileIcon,
  Folder,
  Package,
  Link: LinkIcon,
  BarChart3,
  Type: TypeIcon,
} as const;

const ORDER: ContentType[] = [
  "page",
  "file",
  "folder",
  "scorm",
  "url",
  "survey",
  "text-media",
];

export function ContentTypePicker({
  onSelect,
}: {
  onSelect: (type: ContentType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ORDER.map((type) => {
        const meta = CONTENT_TYPE_META[type];
        const Icon = ICONS[meta.icon as keyof typeof ICONS];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gray-600/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-accent">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-foreground">{meta.label}</div>
            <div className="text-xs text-muted-foreground">{meta.description}</div>
          </button>
        );
      })}
    </div>
  );
}