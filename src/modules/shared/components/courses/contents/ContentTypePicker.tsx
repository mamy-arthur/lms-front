import {
  FileText,
  File as FileIcon,
  Folder,
  Package,
  Link as LinkIcon,
  Image,
  Box,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { BackendModuleType, ContentTypeResource } from '@/shared/types/content-type.types';
import { useContentTypesQuery } from '../hooks/useContentTypesQuery';

const MODULE_TYPE_ICON: Record<BackendModuleType, React.ElementType> = {
  page: FileText,
  file: FileIcon,
  folder: Folder,
  scorm: Package,
  url: LinkIcon,
  media: Image,
};

const MODULE_TYPE_COLOR: Record<BackendModuleType, string> = {
  page: 'bg-blue-400',
  file: 'bg-yellow-500',
  folder: 'bg-red-400',
  scorm: 'bg-orange-500',
  url: 'bg-green-400',
  media: 'bg-purple-400',
};

const MODULE_TYPE_FALLBACK_ICON = Box;
const MODULE_TYPE_FALLBACK_COLOR = 'bg-gray-400';

export function ContentTypePicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (contentType: ContentTypeResource) => void;
  disabled?: boolean;
}) {
  const { data: contentTypes, isLoading, isError } = useContentTypesQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !contentTypes?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {isError
          ? 'Impossible de charger les types de contenu.'
          : 'Aucun type de contenu disponible.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {contentTypes.map((ct) => {
        const Icon = MODULE_TYPE_ICON[ct.module_type] ?? MODULE_TYPE_FALLBACK_ICON;
        const bgColor = MODULE_TYPE_COLOR[ct.module_type] ?? MODULE_TYPE_FALLBACK_COLOR;
        return (
          <button
            key={ct.id}
            type="button"
            onClick={() => onSelect(ct)}
            disabled={disabled}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-all hover:border-gray-600/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${bgColor}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-gray-900">{ct.title}</div>
            {ct.description && (
              <div className="text-xs text-gray-800 line-clamp-2">{ct.description}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
